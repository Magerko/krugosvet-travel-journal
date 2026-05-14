#!/usr/bin/env bash
# Стартовый скрипт контейнера приложения.
# 1. Ждёт пока поднимется MySQL.
# 2. Выполняет flask seed — создаст таблицы (если их нет) и наполнит данными.
# 3. Запускает либо gunicorn (прод), либо flask dev server (разработка).

set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"

echo "[entrypoint] Жду базу ${DB_HOST}:${DB_PORT}..."
# nc -z = только проверка соединения, без передачи данных. Цикл с таймаутом.
for i in $(seq 1 60); do
    if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "[entrypoint] БД доступна."
        break
    fi
    if [ "$i" = "60" ]; then
        echo "[entrypoint] БД не поднялась за 60 секунд — выходим" >&2
        exit 1
    fi
    sleep 1
done

# Небольшая пауза — MySQL может слушать порт ещё до того, как готов принимать запросы.
sleep 2

echo "[entrypoint] Применяю миграции схемы (flask db upgrade)..."
python -m flask --app app db upgrade || {
    echo "[entrypoint] db upgrade упал — возможно БД ещё не готова"
    exit 1
}

echo "[entrypoint] Наполняю справочники и пользователей..."
python -m flask --app app seed || {
    echo "[entrypoint] seed упал — продолжаем"
}

# В $APP_MODE=prod запускаем gunicorn, иначе — встроенный flask для удобства разработки
if [ "${APP_MODE:-dev}" = "prod" ]; then
    echo "[entrypoint] Запускаю gunicorn..."
    exec gunicorn --bind 0.0.0.0:5000 --workers 2 --access-logfile - app:app
else
    # В контейнере обязательно --host=0.0.0.0, иначе порт не выходит наружу
    echo "[entrypoint] Запускаю flask (dev) на 0.0.0.0:5000..."
    exec python -m flask --app app run --host=0.0.0.0 --port=5000 --debug
fi
