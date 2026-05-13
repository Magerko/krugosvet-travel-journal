"""
Избранное — общий обработчик для article / excursion / destination.
Состояние и переключение хранятся через одну табличку favorites (полиморфно).
"""

from flask import Blueprint, jsonify

from extensions import db
from models import Favorite, Article, Excursion, Destination
from ._helpers import current_user, login_required, get_json

bp = Blueprint("favorites", __name__)


# Карта: тип → модель. Используем для проверки, что target_id реально существует.
TYPES = {
    "article":     Article,
    "excursion":   Excursion,
    "destination": Destination,
}


@bp.post("/toggle")
@login_required
def toggle():
    """
    {target_type, target_id} — переключает избранное.
    Возвращает {in_favorites: true|false}.
    """
    data = get_json()
    t = data.get("target_type")
    tid = data.get("target_id")
    if t not in TYPES or not isinstance(tid, int):
        return jsonify(error="bad_input"), 400

    if not TYPES[t].query.get(tid):
        return jsonify(error="target_not_found"), 404

    u = current_user()
    fav = Favorite.query.filter_by(
        user_id=u.id, target_type=t, target_id=tid
    ).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
        return jsonify(in_favorites=False)

    db.session.add(Favorite(user_id=u.id, target_type=t, target_id=tid))
    db.session.commit()
    return jsonify(in_favorites=True)


@bp.get("/my")
@login_required
def my_favorites():
    """
    Все избранные текущего пользователя — для личного кабинета.
    Возвращаем сгруппированно по типам.
    """
    u = current_user()
    favs = Favorite.query.filter_by(user_id=u.id).order_by(Favorite.created_at.desc()).all()

    result = {"articles": [], "excursions": [], "destinations": []}
    for f in favs:
        Model = TYPES.get(f.target_type)
        if not Model:
            continue
        obj = Model.query.get(f.target_id)
        if not obj:
            continue
        d = obj.to_dict()
        d["favorited_at"] = f.created_at.isoformat()
        if f.target_type == "article":
            result["articles"].append(d)
        elif f.target_type == "excursion":
            result["excursions"].append(d)
        elif f.target_type == "destination":
            result["destinations"].append(d)

    return jsonify(result)
