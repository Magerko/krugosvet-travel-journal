"""
Новости и статьи — листинг с категориями + детальная страница.
"""

from flask import Blueprint, jsonify, request

from extensions import db
from models import Article, ArticleCategory, Comment, Favorite
from ._helpers import current_user, login_required, get_json, clean_text

bp = Blueprint("articles", __name__)


@bp.get("/")
def list_articles():
    q = Article.query.filter(Article.is_published.is_(True))

    cat = request.args.get("category")
    if cat:
        q = q.join(Article.category).filter(ArticleCategory.slug == cat)

    search = (request.args.get("q") or "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(Article.title.like(like), Article.summary.like(like)))

    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(24, max(1, request.args.get("per_page", 8, type=int)))
    q = q.order_by(Article.published_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify(
        items=[a.to_dict() for a in items],
        page=page, per_page=per_page, total=total,
        pages=(total + per_page - 1) // per_page,
    )


@bp.get("/featured")
def featured():
    items = (Article.query
             .filter(Article.is_published.is_(True), Article.is_featured.is_(True))
             .order_by(Article.published_at.desc())
             .limit(3).all())
    return jsonify(items=[a.to_dict() for a in items])


@bp.get("/categories")
def categories():
    items = ArticleCategory.query.order_by(ArticleCategory.id).all()
    return jsonify(items=[c.to_dict() for c in items])


@bp.get("/<slug>")
def detail(slug):
    a = Article.query.filter_by(slug=slug, is_published=True).first()
    if not a:
        return jsonify(error="not_found"), 404

    # Накручиваем счётчик просмотров — простой вариант, без защиты от перезагрузок
    a.views = (a.views or 0) + 1
    db.session.commit()

    comments = (Comment.query
                .filter_by(target_type="article", target_id=a.id, is_approved=True)
                .order_by(Comment.created_at.desc())
                .limit(30).all())

    # Похожие статьи: та же категория, не сама эта
    related = (Article.query
               .filter(Article.is_published.is_(True),
                       Article.category_id == a.category_id,
                       Article.id != a.id)
               .order_by(Article.published_at.desc())
               .limit(3).all())

    in_fav = False
    u = current_user()
    if u:
        in_fav = Favorite.query.filter_by(
            user_id=u.id, target_type="article", target_id=a.id
        ).first() is not None

    return jsonify(
        article=a.to_dict(full=True),
        comments=[c.to_dict() for c in comments],
        related=[r.to_dict() for r in related],
        in_favorites=in_fav,
    )


@bp.post("/<int:article_id>/comments")
@login_required
def add_comment(article_id):
    a = Article.query.get_or_404(article_id)
    data = get_json()
    body = clean_text(data.get("body"))
    if not body:
        return jsonify(error="empty"), 400

    u = current_user()
    c = Comment(target_type="article", target_id=a.id, user_id=u.id, body=body)
    db.session.add(c)
    db.session.commit()
    return jsonify(comment=c.to_dict()), 201
