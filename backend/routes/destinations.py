"""
Места отдыха (destinations) — публичный список и детальная страница.
"""

from flask import Blueprint, jsonify, request

from extensions import db
from models import Destination, Country, Excursion, Article, Favorite
from ._helpers import current_user

bp = Blueprint("destinations", __name__)


@bp.get("/")
def list_destinations():
    """Параметры: country=TR (код страны), q=строка поиска по title/summary."""
    q = Destination.query.join(Destination.country)

    code = request.args.get("country")
    if code:
        q = q.filter(Country.code == code.upper())

    search = (request.args.get("q") or "").strip()
    if search:
        like = f"%{search}%"
        q = q.filter(db.or_(Destination.title.like(like), Destination.summary.like(like)))

    only_featured = request.args.get("featured") == "1"
    if only_featured:
        q = q.filter(Destination.is_featured.is_(True))

    items = q.order_by(Destination.is_featured.desc(), Destination.title.asc()).all()
    return jsonify(items=[d.to_dict() for d in items])


@bp.get("/<slug>")
def detail(slug):
    """Детальная страница места по slug. Прицепляем 6 экскурсий и 4 связанные статьи."""
    d = Destination.query.filter_by(slug=slug).first()
    if not d:
        return jsonify(error="not_found"), 404

    # Похожие экскурсии — те, что в этом месте, плюс в стране целиком (если открыли город).
    excursions = (Excursion.query
                  .filter_by(destination_id=d.id)
                  .order_by(Excursion.is_featured.desc(), Excursion.id.asc())
                  .limit(6)
                  .all())

    articles = (Article.query
                .filter_by(destination_id=d.id, is_published=True)
                .order_by(Article.published_at.desc())
                .limit(4)
                .all())

    # Сосед по стране — другие города той же страны
    siblings = (Destination.query
                .filter(Destination.country_id == d.country_id, Destination.id != d.id)
                .order_by(Destination.is_featured.desc())
                .limit(4).all())

    in_fav = False
    u = current_user()
    if u:
        in_fav = Favorite.query.filter_by(
            user_id=u.id, target_type="destination", target_id=d.id
        ).first() is not None

    return jsonify(
        destination=d.to_dict(full=True),
        excursions=[e.to_dict() for e in excursions],
        articles=[a.to_dict() for a in articles],
        siblings=[s.to_dict() for s in siblings],
        in_favorites=in_fav,
    )
