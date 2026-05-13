"""
Авторизация: регистрация, вход, выход, текущий пользователь.
Всё через сессию Flask — куки выставляются автоматически.
"""

import re
from flask import Blueprint, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db, limiter
from models import User
from ._helpers import current_user, get_json, log_action

bp = Blueprint("auth", __name__)


# Простейшая регулярка для email — этого хватит для этого проекта,
# полную проверку всё равно делает почтовый сервер.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@bp.post("/register")
@limiter.limit("10 per hour", error_message="too_many_attempts")
def register():
    data = get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    phone = (data.get("phone") or "").strip()

    # Валидация — отдаём понятный код, чтобы фронт мог подсветить нужное поле
    errors = {}
    if not EMAIL_RE.match(email):
        errors["email"] = "Введите корректный email"
    if len(password) < 6:
        errors["password"] = "Пароль минимум 6 символов"
    if not full_name or len(full_name) < 2:
        errors["full_name"] = "Укажите имя"
    if errors:
        return jsonify(error="validation", fields=errors), 400

    if User.query.filter_by(email=email).first():
        return jsonify(error="email_taken"), 409

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        full_name=full_name,
        phone=phone or None,
    )
    db.session.add(user)
    db.session.flush()
    log_action("INSERT", "users", f"регистрация {email}", user_id=user.id)
    db.session.commit()

    # Сразу логиним юзера, чтобы он не вводил пароль ещё раз
    session.permanent = True
    session["user_id"] = user.id
    return jsonify(user=user.to_dict()), 201


@bp.post("/login")
@limiter.limit("8 per minute", error_message="too_many_attempts")
def login():
    data = get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        # Сознательно не уточняем "нет такого email" / "пароль неверный" — безопасность
        return jsonify(error="invalid_credentials"), 401

    session.permanent = True
    session["user_id"] = user.id

    log_action("LOGIN", "users", f"{user.email} вошёл в систему", user_id=user.id)
    db.session.commit()

    return jsonify(user=user.to_dict())


@bp.post("/logout")
def logout():
    session.pop("user_id", None)
    return jsonify(ok=True)


@bp.get("/me")
def me():
    """Узнать, кто залогинен. Удобно для фронта при загрузке страницы."""
    u = current_user()
    if not u:
        return jsonify(user=None)
    return jsonify(user=u.to_dict())
