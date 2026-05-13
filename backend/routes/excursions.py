"""
Экскурсии и тур-пакеты — публичные листинги и детальная страница.
"""

from flask import Blueprint, jsonify, request

from extensions import db
from models import Excursion, Destination, Country, Comment, Favorite
from ._helpers import current_user, login_required, get_json

bp = Blueprint("excursions", __name__)


@bp.get("/")
def list_excursions():
    """
    Каталог экскурсий и пакетов.
    Параметры:
        kind=excursion|package
        country=TR
        destination=2  (id места)
        price_max
        sort=price_asc | price_desc | title
        page=1, per_page=12
    """
    q = (Excursion.query
         .join(Excursion.destination)
         .join(Destination.country))

    kind = request.args.get("kind")
    if kind in ("excursion", "package"):
        q = q.filter(Excursion.kind == kind)

    code = request.args.get("country")
    if code:
        q = q.filter(Country.code == code.upper())

    dest_id = request.args.get("destination", type=int)
    if dest_id:
        q = q.filter(Excursion.destination_id == dest_id)

    pmax = request.args.get("price_max", type=int)
    if pmax:
        q = q.filter(Excursion.price_from <= pmax)

    sort = request.args.get("sort", "")
    if sort == "price_asc":
        q = q.order_by(Excursion.price_from.asc())
    elif sort == "price_desc":
        q = q.order_by(Excursion.price_from.desc())
    elif sort == "title":
        q = q.order_by(Excursion.title.asc())
    else:
        q = q.order_by(Excursion.is_featured.desc(), Excursion.id.asc())

    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(36, max(1, request.args.get("per_page", 12, type=int)))
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify(
        items=[e.to_dict() for e in items],
        page=page, per_page=per_page, total=total,
        pages=(total + per_page - 1) // per_page,
    )


@bp.get("/featured")
def featured():
    """Рекомендации редакции — для главной страницы."""
    items = (Excursion.query
             .filter(Excursion.is_featured.is_(True))
             .order_by(Excursion.id.asc())
             .limit(6).all())
    return jsonify(items=[e.to_dict() for e in items])


@bp.get("/<slug>")
def detail(slug):
    e = Excursion.query.filter_by(slug=slug).first()
    if not e:
        return jsonify(error="not_found"), 404

    # Комментарии — только одобренные
    comments = (Comment.query
                .filter_by(target_type="excursion", target_id=e.id, is_approved=True)
                .order_by(Comment.created_at.desc())
                .limit(20).all())

    # Похожие экскурсии — в той же стране, того же типа
    related = (Excursion.query
               .join(Excursion.destination)
               .filter(Destination.country_id == e.destination.country_id,
                       Excursion.id != e.id)
               .limit(3).all())

    in_fav = False
    u = current_user()
    if u:
        in_fav = Favorite.query.filter_by(
            user_id=u.id, target_type="excursion", target_id=e.id
        ).first() is not None

    return jsonify(
        excursion=e.to_dict(full=True),
        comments=[c.to_dict() for c in comments],
        related=[r.to_dict() for r in related],
        in_favorites=in_fav,
    )


@bp.post("/<int:exc_id>/comments")
@login_required
def add_comment(exc_id):
    e = Excursion.query.get_or_404(exc_id)
    data = get_json()
    body = (data.get("body") or "").strip()
    if not body:
        return jsonify(error="empty"), 400
    if len(body) > 2000:
        return jsonify(error="too_long"), 400

    u = current_user()
    c = Comment(target_type="excursion", target_id=e.id, user_id=u.id, body=body)
    db.session.add(c)
    db.session.commit()
    return jsonify(comment=c.to_dict()), 201
