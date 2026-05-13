"""
Бронирования экскурсий. Полноценный заказ (в отличие от заявок).
"""

import re
from datetime import datetime, date
from flask import Blueprint, jsonify

from extensions import db
from models import Booking, Excursion
from ._helpers import current_user, login_required, get_json, log_action

bp = Blueprint("bookings", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^[\d\s\+\-\(\)]{7,30}$")


def _next_code():
    last = db.session.query(Booking.code).order_by(Booking.id.desc()).first()
    if not last:
        return "B-1284"
    try:
        n = int(last[0].split("-")[1]) + 1
    except (ValueError, IndexError):
        n = 1300
    return f"B-{n}"


@bp.post("/")
@login_required
def create():
    """
    Создать бронь. Принимает:
        excursion_id, tourists, departure_date (YYYY-MM-DD),
        contact_phone, contact_email
    """
    data = get_json()
    u = current_user()

    exc = Excursion.query.get(data.get("excursion_id"))
    if not exc:
        return jsonify(error="excursion_not_found"), 404
    if not exc.price_from:
        return jsonify(error="price_on_request", message="Для этой экскурсии цена по запросу — оставьте заявку"), 400

    try:
        tourists = max(1, int(data.get("tourists", 1)))
    except (TypeError, ValueError):
        tourists = 1
    if tourists > 50:
        return jsonify(error="too_many_tourists"), 400

    date_str = (data.get("departure_date") or "").strip()
    try:
        departure = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify(error="bad_date", fields={"departure_date": "Формат ГГГГ-ММ-ДД"}), 400
    if departure < date.today():
        return jsonify(error="past_date", fields={"departure_date": "Дата не может быть в прошлом"}), 400

    phone = (data.get("contact_phone") or u.phone or "").strip()
    email = (data.get("contact_email") or u.email).strip().lower()
    errors = {}
    if not PHONE_RE.match(phone):
        errors["contact_phone"] = "Введите корректный телефон"
    if not EMAIL_RE.match(email):
        errors["contact_email"] = "Введите корректный email"
    if errors:
        return jsonify(error="validation", fields=errors), 400

    base = exc.price_from * tourists
    # Скидка постоянного клиента: если у юзера уже есть оплаченные брони — даём 5%
    paid_count = Booking.query.filter_by(user_id=u.id, status="paid").count()
    discount = int(base * 0.05) if paid_count > 0 else 0
    total = base - discount

    booking = Booking(
        code=_next_code(),
        user_id=u.id,
        excursion_id=exc.id,
        tourists=tourists,
        departure_date=departure,
        contact_phone=phone,
        contact_email=email,
        base_price=base,
        discount=discount,
        total_price=total,
        status="pending",
    )
    db.session.add(booking)
    db.session.flush()

    log_action("INSERT", "bookings",
               f"{booking.code} · {exc.title} · {tourists} чел.",
               user_id=u.id)
    db.session.commit()
    return jsonify(booking=booking.to_dict()), 201


@bp.get("/my")
@login_required
def my():
    u = current_user()
    items = (Booking.query
             .filter_by(user_id=u.id)
             .order_by(Booking.created_at.desc())
             .all())

    today = date.today()
    upcoming, history = [], []
    for b in items:
        d = b.to_dict()
        if b.status in ("pending", "paid") and b.departure_date >= today:
            d["days_left"] = (b.departure_date - today).days
            upcoming.append(d)
        else:
            history.append(d)
    return jsonify(upcoming=upcoming, history=history)


@bp.get("/<int:booking_id>")
@login_required
def detail(booking_id):
    u = current_user()
    b = Booking.query.get_or_404(booking_id)
    if b.user_id != u.id and not u.is_admin:
        return jsonify(error="forbidden"), 403
    return jsonify(booking=b.to_dict())


@bp.post("/<int:booking_id>/pay")
@login_required
def pay(booking_id):
    u = current_user()
    b = Booking.query.get_or_404(booking_id)
    if b.user_id != u.id:
        return jsonify(error="forbidden"), 403
    if b.status != "pending":
        return jsonify(error="already_processed"), 409

    b.status = "paid"
    log_action("UPDATE", "bookings", f"{b.code} → paid", user_id=u.id)
    db.session.commit()
    return jsonify(booking=b.to_dict())


@bp.post("/<int:booking_id>/cancel")
@login_required
def cancel(booking_id):
    u = current_user()
    b = Booking.query.get_or_404(booking_id)
    if b.user_id != u.id:
        return jsonify(error="forbidden"), 403
    if b.status in ("cancelled", "completed"):
        return jsonify(error="already_processed"), 409

    b.status = "cancelled"
    log_action("UPDATE", "bookings", f"{b.code} → cancelled", user_id=u.id)
    db.session.commit()
    return jsonify(booking=b.to_dict())
