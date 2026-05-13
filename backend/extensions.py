"""
Здесь живут расширения Flask.
Вынес отдельно, чтобы избежать circular import между app.py и моделями/маршрутами.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect

db = SQLAlchemy()

# CSRF: защищаем все POST/PUT/PATCH/DELETE. Токен фронт получает через /api/csrf
# и шлёт в заголовке X-CSRFToken (см. frontend/js/api.js).
csrf = CSRFProtect()

# Rate-limit: ключ — IP клиента. Хранилище — в памяти (для одного контейнера ок).
# Глобального лимита нет, ставим точечно на чувствительные эндпоинты.
limiter = Limiter(key_func=get_remote_address)
