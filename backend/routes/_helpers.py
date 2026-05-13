"""
Маленькие утилиты для маршрутов: декораторы авторизации, текущий пользователь,
запись в audit_log.
"""

from functools import wraps
from flask import session, jsonify, request

from extensions import db
from models import User, AuditLog


def current_user():
    """Достаёт текущего пользователя из сессии. None — если не залогинен."""
    uid = session.get("user_id")
    if not uid:
        return None
    return db.session.get(User, uid)


def login_required(view):
    """Простой декоратор: пускает только залогиненных. Иначе 401."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        if not current_user():
            return jsonify(error="unauthorized"), 401
        return view(*args, **kwargs)
    return wrapper


def admin_required(view):
    """Только для админов. Если не залогинен — 401, если не админ — 403."""
    @wraps(view)
    def wrapper(*args, **kwargs):
        u = current_user()
        if not u:
            return jsonify(error="unauthorized"), 401
        if not u.is_admin:
            return jsonify(error="forbidden"), 403
        return view(*args, **kwargs)
    return wrapper


def log_action(op, table, message, user_id=None):
    """Записываем событие в audit_log. Вызываем вручную из CRUD-эндпоинтов."""
    db.session.add(AuditLog(op=op, table_name=table, message=message, user_id=user_id))
    # Коммит делает вызывающая сторона — чтобы лог был частью одной транзакции с действием.


def get_json():
    """Безопасно достаём JSON из запроса. Если его нет — возвращаем пустой dict."""
    return request.get_json(silent=True) or {}


def clean_text(value, max_len=2000):
    """
    Приводим пользовательский текст в безопасный вид перед сохранением:
    - режем по максимальной длине,
    - убираем управляющие символы (кроме \n, \r, \t),
    - тримим пробелы по краям.

    HTML-теги не вычищаем — фронт всё равно вставляет через Fmt.esc(),
    но защищаемся от попадания «мусора» в БД.
    """
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return s
    # Удаляем управляющие символы
    s = "".join(c for c in s if c == "\n" or c == "\r" or c == "\t" or ord(c) >= 32)
    return s[:max_len]
