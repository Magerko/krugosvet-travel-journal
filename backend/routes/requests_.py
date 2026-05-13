"""
Заявки на консультацию.
Может оставлять как залогиненный пользователь, так и гость (имя/email/телефон).
"""

import re
from flask import Blueprint, jsonify
from datetime import datetime, date

from extensions import db
from models import ConsultRequest, Excursion
from ._helpers import current_user, login_required, get_json, log_action, clean_text

bp = Blueprint("requests", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[\d\s\+\-\(\)]{7,30}$")


@bp.post("/")
def create():
    """Создать заявку. Залогиненность необязательна."""
    data = get_json()

    full_name = clean_text(data.get("full_name"), max_len=120)
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    message = clean_text(data.get("message"))
    desired_str = (data.get("desired_date") or "").strip()
    excursion_id = data.get("excursion_id")

    errors = {}
    if len(full_name) < 2:
        errors["full_name"] = "Укажите имя"
    if not EMAIL_RE.match(email):
        errors["email"] = "Введите корректный email"
    if not PHONE_RE.match(phone):
        errors["phone"] = "Введите корректный телефон"
    if errors:
        return jsonify(error="validation", fields=errors), 400

    desired_date = None
    if desired_str:
        try:
            desired_date = datetime.strptime(desired_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify(error="bad_date", fields={"desired_date": "Дата в формате ГГГГ-ММ-ДД"}), 400
        if desired_date < date.today():
            return jsonify(error="past_date", fields={"desired_date": "Дата не может быть в прошлом"}), 400

    # Если ID экскурсии передан, проверим что она существует. Иначе оставим NULL.
    if excursion_id:
        if not Excursion.query.get(excursion_id):
            excursion_id = None

    u = current_user()
    req = ConsultRequest(
        excursion_id=excursion_id,
        user_id=u.id if u else None,
        full_name=full_name,
        email=email,
        phone=phone,
        desired_date=desired_date,
        message=message or None,
    )
    db.session.add(req)
    db.session.flush()

    log_action(
        "INSERT", "consult_requests",
        f"Заявка #{req.id}{' (' + req.excursion.title + ')' if req.excursion else ''}",
        user_id=u.id if u else None,
    )
    db.session.commit()

    return jsonify(request=req.to_dict()), 201


@bp.get("/my")
@login_required
def my():
    """История заявок текущего пользователя."""
    u = current_user()
    items = (ConsultRequest.query
             .filter_by(user_id=u.id)
             .order_by(ConsultRequest.created_at.desc())
             .all())
    return jsonify(items=[r.to_dict() for r in items])
