# Кругосвет — независимый журнал о путешествиях

Информационный портал с гайдами по странам, лентой новостей туриндустрии и подборкой экскурсий.

## О проекте

Веб-приложение, которое представляет собой онлайн-ресурс с туристической информацией:

- **Новости туриндустрии** — лента статей с категориями, поиском и комментариями
- **Экскурсии и тур-пакеты** — каталог с фильтрами (страна, тип, цена)
- **Места отдыха** — гиды по странам и городам с описанием, фото, экскурсиями и связанными статьями
- **Заявка на консультацию** — форма обратной связи (с экскурсии или общая)
- **Личный кабинет** — избранное (статьи / экскурсии / места) и история заявок
- **Админка** — CRUD статей, экскурсий, мест; обработка заявок; модерация комментариев; журнал действий

Темы оформления: **светлая / тёмная**, переключаются вручную, по умолчанию подстраиваются под систему пользователя (`prefers-color-scheme`).

## Технологии

| Слой | Стек |
|------|------|
| Фронтенд | HTML5, CSS3 (CSS-переменные для светлой/тёмной тем), JavaScript Vanilla (ES6+) |
| Бэкенд | Python 3.10+, Flask 3, SQLAlchemy 2 |
| СУБД | MySQL 8.x (драйвер PyMySQL) |
| Хеширование паролей | Werkzeug PBKDF2-SHA256 |
| Сессии | Flask Session (cookie на 14 дней) |
| Сервер | gunicorn (в Docker, `APP_MODE=prod`) или Flask dev-сервер |
| Деплой | Docker Compose (Flask + MySQL) |

## Структура проекта

```
Site/
├── schema.sql                 — DDL базы данных + справочные сиды
├── README.md
│
├── backend/                   — Python/Flask
│   ├── app.py                 — точка входа, регистрация Blueprint'ов и страниц
│   ├── config.py              — конфиг из .env
│   ├── extensions.py          — экземпляр SQLAlchemy
│   ├── models.py              — все модели
│   ├── seed.py                — наполнение БД пользователями и демо-данными
│   ├── requirements.txt
│   ├── .env.example
│   └── routes/
│       ├── _helpers.py        — login_required / admin_required / log_action
│       ├── auth.py            — регистрация, логин, /me
│       ├── articles.py        — публичный доступ к статьям
│       ├── excursions.py      — экскурсии и пакеты
│       ├── destinations.py    — места отдыха
│       ├── favorites.py       — добавление/удаление в избранное
│       ├── requests_.py       — заявки на консультацию
│       ├── admin.py           — CRUD-эндпоинты для админки
│       └── misc.py            — справочники
│
├── frontend/                  — HTML + CSS + JS Vanilla
│   ├── index.html             — главная (новости + подборки)
│   ├── news.html              — лента новостей
│   ├── article.html           — отдельная статья
│   ├── excursions.html        — каталог экскурсий
│   ├── excursion.html         — детальная страница экскурсии
│   ├── destinations.html      — каталог мест отдыха
│   ├── destination.html       — детальная страница места
│   ├── auth.html              — вход / регистрация
│   ├── cabinet.html           — личный кабинет
│   ├── admin.html             — админ-панель
│   ├── css/                   — токены, базовые стили, страничные
│   └── js/                    — theme.js, api.js, layout.js + JS каждой страницы
│
└── designs/                   — JSX-макеты (referenсная вёрстка от заказчика)
    └── preview.html           — preview всех экранов в React, открывается в браузере
```

## Установка и запуск

Есть два варианта: через Docker (одна команда — поднимется и БД, и сайт) или вручную.

### Вариант А — через Docker (рекомендую)

Нужен установленный **Docker Desktop** (Windows/macOS) или Docker Engine (Linux).

```bash
docker compose up --build
```

Поднимутся два контейнера:
- `krugosvet-db` — MySQL 8.4 на хост-порту **3307** (внутри сети — `db:3306`)
- `krugosvet-app` — Flask на http://localhost:5000

При первом запуске приложение само создаст таблицы и наполнит БД (через `flask --app app seed`). Дальше — браузер на `http://localhost:5000`.

Учётки те же: `admin@krugosvet.ru` / `admin123`, `ivanov@example.com` / `password`.

Полезные команды:
```bash
docker compose logs -f app          # смотреть логи приложения
docker compose exec app bash        # зайти в контейнер
docker compose down                 # остановить контейнеры (данные БД сохранятся)
docker compose down -v              # остановить и удалить том БД (полный reset)
```

Чтобы переключиться в продакшн-режим (gunicorn вместо flask dev) — поменять в `docker-compose.yml` строку `APP_MODE: dev` на `APP_MODE: prod`.

### Вариант Б — вручную

#### 1. Установить и запустить MySQL

Например, через XAMPP или MySQL Server. Убедиться, что сервер слушает `127.0.0.1:3306` и есть пользователь `root` (по умолчанию без пароля в XAMPP).

#### 2. Импортировать схему

Открыть phpMyAdmin (или MySQL Workbench / mysql cli) и выполнить файл `schema.sql`. Он создаст БД `krugosvet` со всеми таблицами и наполнит справочники (страны, места отдыха, экскурсии, статьи).

```bash
mysql -u root < schema.sql
```

#### 3. Установить Python-зависимости

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS

pip install -r requirements.txt
```

#### 4. Настроить .env

Скопировать `.env.example` в `.env` и подправить пароль БД, если нужно:

```
SECRET_KEY=замените-на-длинную-случайную-строку
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=krugosvet
```

#### 5. Создать пользователей и демо-данные

```bash
flask --app app seed
```

Создаст:
- админа: `admin@krugosvet.ru` / **admin123**
- тестовых пользователей: `ivanov@example.com` / **password**, `anna@example.com` / **password**
- немного комментариев, избранного и заявок на консультацию

#### 6. Запустить сервер

```bash
python app.py
```

Откроется на `http://127.0.0.1:5000`.

## Маршруты

### Публичные страницы

| Путь | Описание |
|------|----------|
| `/` | Главная |
| `/news` | Лента новостей |
| `/news/<slug>` | Статья |
| `/excursions` | Каталог экскурсий и пакетов |
| `/excursions/<slug>` | Детальная страница экскурсии |
| `/destinations` | Каталог мест отдыха |
| `/destinations/<slug>` | Детальная страница места |
| `/auth` | Вход / регистрация |
| `/cabinet` | Личный кабинет (требует авторизации) |
| `/admin` | Админка (только для `is_admin = true`) |

### REST API

| Метод | Путь | Назначение |
|-------|------|------------|
| `POST` | `/api/auth/register` | регистрация |
| `POST` | `/api/auth/login` | вход |
| `POST` | `/api/auth/logout` | выход |
| `GET`  | `/api/auth/me` | текущий пользователь |
| `GET`  | `/api/articles/` | список статей с фильтрами |
| `GET`  | `/api/articles/featured` | избранные для главной |
| `GET`  | `/api/articles/categories` | категории |
| `GET`  | `/api/articles/<slug>` | детальная статья + комментарии |
| `POST` | `/api/articles/<id>/comments` | добавить комментарий |
| `GET`  | `/api/excursions/` | каталог экскурсий |
| `GET`  | `/api/excursions/featured` | подборка для главной |
| `GET`  | `/api/excursions/<slug>` | детальная + связанные |
| `POST` | `/api/excursions/<id>/comments` | комментарий к экскурсии |
| `GET`  | `/api/destinations/` | список мест |
| `GET`  | `/api/destinations/<slug>` | детальная + экскурсии + статьи |
| `POST` | `/api/favorites/toggle` | добавить/убрать из избранного |
| `GET`  | `/api/favorites/my` | мои избранные |
| `POST` | `/api/requests/` | оставить заявку на консультацию |
| `GET`  | `/api/requests/my` | история моих заявок |
| `GET`  | `/api/admin/stats` | KPI |
| `GET`  | `/api/admin/audit` | журнал действий |
| `GET/POST/PUT/DELETE` | `/api/admin/articles[/id]` | CRUD статей |
| `GET/POST/PUT/DELETE` | `/api/admin/excursions[/id]` | CRUD экскурсий |
| `GET`  | `/api/admin/destinations` | места отдыха |
| `GET/PUT` | `/api/admin/requests[/id]` | заявки + смена статуса |
| `GET/PUT/DELETE` | `/api/admin/comments[/id]` | модерация комментариев |

## Темы оформления

Реализованы через CSS-переменные и атрибут `data-theme="dark"` на `<html>`.

- При первой загрузке страница берёт значение из `localStorage["krugosvet-theme"]`. Если его нет — смотрит в `prefers-color-scheme`, если и там ничего — ставит `light`.
- Скрипт `js/theme.js` подключается в `<head>` **до** CSS, чтобы избежать «миганий».
- Кнопка-переключатель в шапке записывает выбор в `localStorage` и перерисовывает иконку.

## Безопасность

- Пароли хешируются через `werkzeug.security.generate_password_hash` (PBKDF2-SHA256).
- Сессии — HttpOnly, SameSite=Lax, шифруются `SECRET_KEY` из `.env`.
- Защищённые эндпоинты — через декораторы `@login_required` и `@admin_required` (`backend/routes/_helpers.py`).
- Все админские действия логируются в таблицу `audit_log`.
- В JSON-эндпоинтах валидируются email, телефон, размеры полей.

## Архитектурные решения

1. **MySQL + ER-диаграмма**: 11 таблиц, связи через FK, проверочные ограничения (`CHECK`), индексы по часто запрашиваемым полям (`status`, `published_at`, `target_type+target_id`).
2. **Паттерн «полиморфные связи»**: `comments` и `favorites` через `target_type + target_id` — позволяет одной таблицей покрыть и статьи, и экскурсии, и места.
3. **Архитектура бэкенда**: разделение по Blueprint'ам (auth / excursions / articles / destinations / admin), общий слой моделей и хелперов.
4. **REST + Vanilla JS**: фронтенд не знает Python и не зависит от Flask-шаблонов — может быть выложен на любой статический хостинг.
5. **Темы и адаптивность**: один CSS поддерживает все размеры экрана от телефона до десктопа.

## Учётные записи для проверки

| Логин | Пароль | Роль |
|-------|--------|------|
| `admin@krugosvet.ru` | `admin123` | администратор |
| `ivanov@example.com` | `password` | обычный пользователь (с историей заявок и избранным) |
| `anna@example.com` | `password` | обычный пользователь |
