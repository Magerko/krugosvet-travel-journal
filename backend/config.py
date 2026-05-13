"""
Конфигурация Flask-приложения.
Читаем переменные окружения из .env (если есть), иначе берём дефолты для локальной разработки.

По умолчанию используется SQLite (файл krugosvet.db рядом с проектом) — чтобы можно было
запускать без установки MySQL. Для продакшна переключиться на MySQL
переменной окружения DB_BACKEND=mysql в файле .env.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# .env лежит рядом с этим файлом
load_dotenv(Path(__file__).parent / ".env")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-меняйте-в-проде")

    DB_BACKEND = os.getenv("DB_BACKEND", "sqlite").lower()

    # Параметры MySQL (используются только если DB_BACKEND=mysql)
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "krugosvet")

    if DB_BACKEND == "mysql":
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
            f"?charset=utf8mb4"
        )
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 1800,
        }
    else:
        # SQLite — по умолчанию для разработки. Файл рядом с backend/.
        sqlite_path = (Path(__file__).parent.parent / "krugosvet.db").resolve()
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{sqlite_path.as_posix()}"
        SQLALCHEMY_ENGINE_OPTIONS = {}

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Сессии: cookie на 14 дней
    PERMANENT_SESSION_LIFETIME = 60 * 60 * 24 * 14
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
