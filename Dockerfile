# Dockerfile для бэкенда «Кругосвет».
# Собирает образ Flask-приложения, фронт раздаётся им же со /frontend.

FROM python:3.12-slim

# Удобства для отладки и UTF-8 в логах
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

# Системные библиотеки — нужны cryptography (для PyMySQL TLS) и netcat для wait-for-db
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Сначала зависимости — пользуемся кэшем слоёв Docker
COPY backend/requirements.txt /app/backend/requirements.txt
# В контейнере дополнительно ставим gunicorn — для прод-режима
RUN pip install --no-cache-dir -r /app/backend/requirements.txt gunicorn==23.0.0

# Дальше код проекта целиком
COPY backend/  /app/backend/
COPY frontend/ /app/frontend/
COPY schema.sql /app/schema.sql
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app/backend

EXPOSE 5000

ENTRYPOINT ["/app/entrypoint.sh"]
