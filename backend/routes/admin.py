"""
Админка: CRUD статей, экскурсий, мест отдыха;
+ просмотр и обновление заявок;
+ модерация комментариев;
+ KPI и аудит.
"""

from datetime import datetime
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from extensions import db
from models import (
    Article, ArticleCategory, Excursion, Destination, Country,
    Comment, ConsultRequest, AuditLog, User,
)
from ._helpers import admin_required, get_json, log_action, current_user

bp = Blueprint("admin", __name__)


# --------------------------------------------------------- KPI --

@bp.get("/stats")
@admin_required
def stats():
    return jsonify(
        articles=Article.query.count(),
        articles_published=Article.query.filter_by(is_published=True).count(),
        excursions=Excursion.query.count(),
        destinations=Destination.query.count(),
        users=User.query.count(),
        requests_new=ConsultRequest.query.filter_by(status="new").count(),
        requests_total=ConsultRequest.query.count(),
        comments_pending=Comment.query.filter_by(is_approved=False).count(),
    )


@bp.get("/audit")
@admin_required
def audit():
    rows = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(20).all()
    return jsonify(items=[r.to_dict() for r in rows])


# ---------------------------------------------------- ARTICLES --

@bp.get("/articles")
@admin_required
def admin_articles():
    items = Article.query.order_by(Article.published_at.desc()).limit(200).all()
    return jsonify(items=[a.to_dict() for a in items])


@bp.post("/articles")
@admin_required
def create_article():
    d = get_json()
    title = (d.get("title") or "").strip()
    slug = (d.get("slug") or "").strip()
    if not title or not slug:
        return jsonify(error="missing_fields"), 400
    if Article.query.filter_by(slug=slug).first():
        return jsonify(error="slug_taken", field="slug"), 409

    a = Article(
        slug=slug,
        title=title,
        summary=d.get("summary"),
        body=d.get("body"),
        author=d.get("author") or "Редакция «Кругосвет»",
        cover_label=d.get("cover_label") or "обложка",
        reading_time=int(d.get("reading_time") or 5),
        category_id=d.get("category_id"),
        destination_id=d.get("destination_id"),
        is_published=bool(d.get("is_published", True)),
        is_featured=bool(d.get("is_featured", False)),
    )
    db.session.add(a)
    db.session.flush()
    log_action("INSERT", "articles", f'"{a.title}"', user_id=current_user().id)
    db.session.commit()
    return jsonify(article=a.to_dict(full=True)), 201


@bp.put("/articles/<int:aid>")
@admin_required
def update_article(aid):
    a = Article.query.get_or_404(aid)
    d = get_json()
    for f in ("title", "summary", "body", "author", "cover_label", "reading_time",
              "category_id", "destination_id", "is_published", "is_featured"):
        if f in d:
            setattr(a, f, d[f])
    log_action("UPDATE", "articles", f'"{a.title}"', user_id=current_user().id)
    db.session.commit()
    return jsonify(article=a.to_dict(full=True))


@bp.delete("/articles/<int:aid>")
@admin_required
def delete_article(aid):
    a = Article.query.get_or_404(aid)
    title = a.title
    db.session.delete(a)
    log_action("DELETE", "articles", f'"{title}"', user_id=current_user().id)
    db.session.commit()
    return jsonify(ok=True)


# -------------------------------------------------- EXCURSIONS --

@bp.get("/excursions")
@admin_required
def admin_excursions():
    items = Excursion.query.order_by(Excursion.id.desc()).limit(200).all()
    return jsonify(items=[e.to_dict() for e in items])


@bp.post("/excursions")
@admin_required
def create_excursion():
    d = get_json()
    if not (d.get("title") and d.get("slug") and d.get("destination_id")):
        return jsonify(error="missing_fields"), 400
    if Excursion.query.filter_by(slug=d["slug"]).first():
        return jsonify(error="slug_taken", field="slug"), 409

    e = Excursion(
        slug=d["slug"],
        title=d["title"],
        kind=d.get("kind", "excursion"),
        summary=d.get("summary"),
        description=d.get("description"),
        program=d.get("program"),
        duration=d.get("duration"),
        price_from=d.get("price_from"),
        languages=d.get("languages") or "русский",
        group_size=d.get("group_size"),
        cover_label=d.get("cover_label") or "обложка",
        destination_id=d["destination_id"],
        is_featured=bool(d.get("is_featured", False)),
    )
    db.session.add(e)
    db.session.flush()
    log_action("INSERT", "excursions", f'"{e.title}"', user_id=current_user().id)
    db.session.commit()
    return jsonify(excursion=e.to_dict(full=True)), 201


@bp.put("/excursions/<int:eid>")
@admin_required
def update_excursion(eid):
    e = Excursion.query.get_or_404(eid)
    d = get_json()
    for f in ("title", "kind", "summary", "description", "program",
              "duration", "price_from", "languages", "group_size",
              "cover_label", "destination_id", "is_featured"):
        if f in d:
            setattr(e, f, d[f])
    log_action("UPDATE", "excursions", f'"{e.title}"', user_id=current_user().id)
    db.session.commit()
    return jsonify(excursion=e.to_dict(full=True))


@bp.delete("/excursions/<int:eid>")
@admin_required
def delete_excursion(eid):
    e = Excursion.query.get_or_404(eid)
    title = e.title
    db.session.delete(e)
    log_action("DELETE", "excursions", f'"{title}"', user_id=current_user().id)
    db.session.commit()
    return jsonify(ok=True)


# ------------------------------------------------- DESTINATIONS --

@bp.get("/destinations")
@admin_required
def admin_destinations():
    items = Destination.query.order_by(Destination.title).all()
    return jsonify(items=[x.to_dict(full=True) for x in items])


# ----------------------------------------------- CONSULT REQUESTS --

@bp.get("/requests")
@admin_required
def admin_requests():
    status = request.args.get("status")
    q = ConsultRequest.query
    if status and status in ("new", "in_work", "done", "cancelled"):
        q = q.filter_by(status=status)
    items = q.order_by(ConsultRequest.created_at.desc()).limit(200).all()
    return jsonify(items=[r.to_dict() for r in items])


@bp.put("/requests/<int:rid>")
@admin_required
def update_request(rid):
    r = ConsultRequest.query.get_or_404(rid)
    d = get_json()
    new_status = d.get("status")
    if new_status not in ("new", "in_work", "done", "cancelled"):
        return jsonify(error="bad_status"), 400
    old = r.status
    r.status = new_status
    log_action("UPDATE", "consult_requests",
               f"#{r.id} {old} → {new_status}",
               user_id=current_user().id)
    db.session.commit()
    return jsonify(request=r.to_dict())


# ----------------------------------------- COMMENTS MODERATION --

@bp.get("/comments")
@admin_required
def admin_comments():
    """
    Список комментариев. По умолчанию — все, с приоритетом неодобренных.
    """
    only_pending = request.args.get("pending") == "1"
    q = Comment.query
    if only_pending:
        q = q.filter_by(is_approved=False)
    items = q.order_by(Comment.is_approved.asc(), Comment.created_at.desc()).limit(200).all()
    return jsonify(items=[c.to_dict() for c in items])


@bp.put("/comments/<int:cid>")
@admin_required
def update_comment(cid):
    c = Comment.query.get_or_404(cid)
    d = get_json()
    if "is_approved" in d:
        c.is_approved = bool(d["is_approved"])
    log_action("UPDATE", "comments",
               f"#{c.id} approved={c.is_approved}",
               user_id=current_user().id)
    db.session.commit()
    return jsonify(comment=c.to_dict())


@bp.delete("/comments/<int:cid>")
@admin_required
def delete_comment(cid):
    c = Comment.query.get_or_404(cid)
    db.session.delete(c)
    log_action("DELETE", "comments", f"#{cid}", user_id=current_user().id)
    db.session.commit()
    return jsonify(ok=True)
