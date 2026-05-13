"""
Разные вспомогательные эндпоинты: справочники.
"""

from flask import Blueprint, jsonify

from models import Country, Destination

bp = Blueprint("misc", __name__)


@bp.get("/countries")
def countries():
    items = Country.query.order_by(Country.name).all()
    return jsonify(items=[c.to_dict() for c in items])


@bp.get("/destinations-list")
def destinations_simple():
    """Упрощённый список мест — для выпадашек в админке (id, title, country)."""
    items = Destination.query.join(Destination.country).order_by(Destination.title).all()
    return jsonify(items=[
        {
            "id": d.id, "title": d.title, "slug": d.slug,
            "country": d.country.name if d.country else None,
        }
        for d in items
    ])


@bp.get("/health")
def health():
    return jsonify(status="ok")
