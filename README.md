# Кругосвет — независимый журнал о путешествиях

> **Уровень: Junior+ / Pre-Middle Fullstack**
> Полноценный продукт от ER-диаграммы до Docker-деплоя: Python/Flask + Vanilla JS + MySQL.
> Без фреймворков на фронте — чтобы видеть владение базой (DOM API, fetch, CSS-переменные).

![Стек](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000?logo=flask)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Tests](https://github.com/Magerko/krugosvet-travel-journal/actions/workflows/tests.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green)

Информационный портал с гайдами по странам, лентой новостей туриндустрии, подборкой экскурсий и полноценной системой бронирования.

## Скриншоты

| Главная | Каталог экскурсий | Детальная экскурсии |
|---|---|---|
| ![Главная](docs/screenshots/01-home.png) | ![Экскурсии](docs/screenshots/02-excursions.png) | ![Детальная](docs/screenshots/03-excursion-detail.png) |

| Места отдыха | Лента новостей | Статья |
|---|---|---|
| ![Места](docs/screenshots/04-destinations.png) | ![Новости](docs/screenshots/05-news.png) | ![Статья](docs/screenshots/06-article.png) |

| Авторизация | Бронирование с календарём | Личный кабинет |
|---|---|---|
| ![Auth](docs/screenshots/07-auth.png) | ![Бронь](docs/screenshots/08-booking-modal.png) | ![Кабинет](docs/screenshots/09-cabinet.png) |

| Админка — статьи | Админка — брони |
|---|---|
| ![Admin Articles](docs/screenshots/10-admin-articles.png) | ![Admin Bookings](docs/screenshots/11-admin-bookings.png) |

### Мобильная версия

| Главная | Меню (drawer) | Тёмная тема | Бронирование |
|---|---|---|---|
| ![M Home](docs/screenshots/m1-home.png) | ![M Drawer](docs/screenshots/m2-drawer.png) | ![M Dark](docs/screenshots/m3-home-dark.png) | ![M Booking](docs/screenshots/m4-booking-modal.png) |

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
│   ├── extensions.py         — SQLAlchemy, Flask-WTF CSRF, Flask-Limiter
│   ├── tests/                — 50 pytest-тестов (см. секцию ниже)
│   └── routes/
│       ├── _helpers.py        — login_required / admin_required / log_action / clean_text
│       ├── auth.py            — регистрация, логин, /me
│       ├── articles.py        — публичный доступ к статьям
│       ├── excursions.py      — экскурсии и пакеты, availability календаря
│       ├── destinations.py    — места отдыха
│       ├── favorites.py       — добавление/удаление в избранное
│       ├── requests_.py       — заявки на консультацию
│       ├── bookings.py        — создание брони, оплата, отмена, история юзера
│       ├── admin.py           — CRUD статей/экскурсий, брони, заявки, комментарии
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

### Как зайти в админку

1. Открыть `http://localhost:5000/auth`
2. Email: `admin@krugosvet.ru`, пароль: `admin123`
3. После входа в шапке появится имя «Администратор» — клик по нему ведёт на `/admin`. Или сразу перейти на `http://localhost:5000/admin`
4. Внутри:
   - **Брони** — все заявки на экскурсии, можно менять статус
   - **Заявки** — обращения на консультацию
   - **Статьи** — CRUD: создать, отредактировать, опубликовать, удалить
   - **Экскурсии** — CRUD экскурсий и пакетов
   - **Места** — справочник стран и городов
   - **Комментарии** — модерация

Обычные пользователи (`ivanov@example.com`, `anna@example.com`) на `/admin` получат `403 forbidden` — это проверяется декоратором `@admin_required` в `backend/routes/_helpers.py`.

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
| `GET`  | `/api/excursions/<id>/availability` | занятые даты на 60 дней (для календаря в модалке бронирования) |
| `POST` | `/api/excursions/<id>/comments` | комментарий к экскурсии |
| `GET`  | `/api/destinations/` | список мест |
| `GET`  | `/api/destinations/<slug>` | детальная + экскурсии + статьи |
| `POST` | `/api/favorites/toggle` | добавить/убрать из избранного |
| `GET`  | `/api/favorites/my` | мои избранные |
| `POST` | `/api/requests/` | оставить заявку на консультацию |
| `GET`  | `/api/requests/my` | история моих заявок |
| `POST` | `/api/bookings/` | создать бронь экскурсии (login required) |
| `GET`  | `/api/bookings/my` | мои брони — отсортированы по предстоящим / истории |
| `GET`  | `/api/bookings/<id>` | бронь по id (только владелец или админ) |
| `POST` | `/api/bookings/<id>/pay` | mock-оплата брони (pending → paid) |
| `POST` | `/api/bookings/<id>/cancel` | отмена брони |
| `GET`  | `/api/csrf` | CSRF-токен для последующих state-changing запросов |
| `GET`  | `/api/admin/stats` | KPI |
| `GET`  | `/api/admin/audit` | журнал действий |
| `GET/POST/PUT/DELETE` | `/api/admin/articles[/id]` | CRUD статей |
| `GET/POST/PUT/DELETE` | `/api/admin/excursions[/id]` | CRUD экскурсий |
| `GET`  | `/api/admin/destinations` | места отдыха |
| `GET/PUT` | `/api/admin/bookings[/id]` | список броней + смена статуса |
| `GET/PUT` | `/api/admin/requests[/id]` | заявки + смена статуса |
| `GET/PUT/DELETE` | `/api/admin/comments[/id]` | модерация комментариев |

## Миграции БД

Схема версионируется через **Flask-Migrate** (обёртка над Alembic). Initial-миграция лежит в `backend/migrations/versions/`.

```bash
cd backend
flask --app app db upgrade          # накатить все миграции на актуальную БД
flask --app app db migrate -m "..." # сгенерировать новую миграцию по изменениям моделей
flask --app app db downgrade        # откатить на одну
```

В Docker `entrypoint.sh` гонит `db upgrade` перед стартом приложения — поэтому свежеподнятый контейнер всегда на актуальной схеме без ручных шагов.

Для тестов миграции пропускаются: `conftest.py` использует SQLite-in-memory и `db.create_all()` для скорости (миграции на каждом тесте — лишний overhead).

## CI/CD

`.github/workflows/tests.yml` — GitHub Actions, который:

- запускается на каждый `push` в `main` и на каждый PR против `main`,
- ставит Python 3.12, поднимает `backend/requirements.txt`,
- гоняет `pytest tests -v` в SQLite-режиме,
- падает, если хотя бы один тест красный.

Бейдж со статусом в шапке README обновляется автоматически.

## Тесты

Покрытие — **50 тестов**, прогон занимает ~30 секунд. Стек: `pytest` + Flask test client + SQLite в памяти (быстро, без зависимости от MySQL).

```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS

pytest tests -v
```

```
tests/test_auth.py            9 tests   — регистрация, логин, /me, защита от user enumeration
tests/test_articles.py        9 tests   — список, фильтры, комментарии, sanitize контрольных байт
tests/test_excursions.py      5 tests   — каталог, фильтры по стране/типу, availability
tests/test_bookings.py        9 tests   — создание, оплата, отмена, IDOR (своя бронь / чужая / админ)
tests/test_admin.py           6 tests   — stats, CRUD статей, защита от non-admin, audit-log
tests/test_requests.py        5 tests   — анонимные и юзерские заявки, валидация
tests/test_favorites.py       4 tests   — полиморфное toggle, группировка my по типам
tests/test_security_headers.py 3 tests  — X-Frame-Options, CSP с picsum, MIME-sniffing
```

Что покрыто специально:
- **IDOR на бронях** — два теста на «чужую бронь нельзя ни посмотреть, ни оплатить»
- **User enumeration** — `register(taken_email)` и `register(new_email)` возвращают одинаковую структуру
- **Sanitize управляющих символов** — посылаем `\x00\x07` в комментарий, проверяем что в БД чистый текст
- **Прошлая дата в брони и заявке** — оба сценария отдают 400 с указанием поля
- **CRUD-полный цикл** — создать → обновить → удалить → убедиться что в публичной выдаче пропала

В `conftest.py` rate-limit отключается через `limiter.enabled = False`, иначе 50 быстрых логинов забивают лимит. CSRF тоже выключен в тестовом контексте — это стандартный паттерн для Flask-WTF.

## Темы оформления

Реализованы через CSS-переменные и атрибут `data-theme="dark"` на `<html>`.

- При первой загрузке страница берёт значение из `localStorage["krugosvet-theme"]`. Если его нет — смотрит в `prefers-color-scheme`, если и там ничего — ставит `light`.
- Скрипт `js/theme.js` подключается в `<head>` **до** CSS, чтобы избежать «миганий».
- Кнопка-переключатель в шапке записывает выбор в `localStorage` и перерисовывает иконку.

## Безопасность

Этот раздел оформлен как **справочник для учебных целей** — что было сделано, зачем, и где в коде смотреть. Все примеры — реальные строки из проекта.

### 1. Аутентификация и хранение паролей

Пароли хранятся только в виде хеша, без plaintext-копий в БД или логах. При регистрации `werkzeug.security.generate_password_hash(password)` возвращает строку вида `pbkdf2:sha256:600000$salt$hash` — это PBKDF2-SHA256 с 600 000 итераций и случайной солью. При логине используется `check_password_hash`, которая сравнивает значения в constant time, чтобы минимизировать риск тайминговых атак.

📁 `backend/routes/auth.py` · модель `backend/models.py:User.password_hash`

### 2. Сессии

Используем стандартные Flask-сессии: cookie, подписанный `SECRET_KEY` (HMAC). Cookie:
- `HttpOnly` — недоступен JavaScript, защита от кражи через XSS;
- `SameSite=Lax` — браузер не пошлёт куки на POST с чужого сайта (одна из CSRF-защит);
- Срок жизни — 14 дней.

📁 `backend/config.py:43-46`

Если `SECRET_KEY` остался дефолтным — на старте логируется warning, чтобы не задеплоить с предсказуемым ключом.

📁 `backend/app.py:80`

### 3. Авторизация (кто что может делать)

Защита эндпоинтов — два декоратора:

```python
@login_required     # требует залогиненной сессии, иначе 401
@admin_required     # требует is_admin=True, иначе 403
```

📁 `backend/routes/_helpers.py`

Они применяются на все state-changing операции (создать комментарий, добавить в избранное, оплатить бронь, любой CRUD в админке).

### 4. CSRF (Cross-Site Request Forgery)

Все POST/PUT/PATCH/DELETE требуют CSRF-токен в заголовке `X-CSRFToken`. Реализация — Flask-WTF `CSRFProtect()`. Поток:

1. Фронт первым делом дёргает `GET /api/csrf` — получает токен, привязанный к сессии.
2. Кладёт в память (`_csrfToken`).
3. На каждый POST/PUT/DELETE автоматически добавляет заголовок.
4. Если токен невалиден (сессия истекла) — фронт ловит `400 csrf_failed`, обновляет токен и повторяет запрос **один раз**.

📁 Бэк: `backend/extensions.py:11`, `backend/app.py:55-62` · Фронт: `frontend/js/api.js`

**Проверка:** `curl -X POST /api/auth/login` без токена → `400 {"error":"csrf_failed"}`.

### 5. Защита от user enumeration на регистрации

Стандартная ошибка молодых проектов: вернуть `409 email_taken`, если email занят. Это позволяет перебором проверить, кто из ваших знакомых зарегистрирован.

В этом проекте **ответ всегда одинаков** независимо от результата:
```
200 {"ok": true, "message": "Если email свободен, аккаунт создан..."}
```

Чтобы тайминги ответа тоже не различались — в случае «email занят» сервер всё равно вычисляет PBKDF2-хеш (это самая дорогая операция). Замер: 184ms vs 129ms, разница в пределах сетевого джиттера.

Автовход после регистрации убран — фронт переключает на форму логина, пользователь логинится своими данными.

📁 `backend/routes/auth.py:50-92`

### 6. Rate limiting

Защита от credential stuffing и брутфорса — Flask-Limiter, ключ по IP:

```python
@bp.post("/login")
@limiter.limit("8 per minute", error_message="too_many_attempts")

@bp.post("/register")
@limiter.limit("10 per hour", error_message="too_many_attempts")
```

После лимита возвращается `429 Too Many Requests`. Хранилище — in-memory (для нескольких реплик нужен Redis).

📁 `backend/routes/auth.py:23,55`

### 7. XSS (Cross-Site Scripting)

Пользовательский контент (комментарии, имена, тексты заявок) во всех текущих местах рендеринга проходит через `Fmt.esc` перед вставкой в `innerHTML`. Это правило кодстайла, а не архитектурный инвариант: если в новом коде кто-то забудет вызвать `.esc`, защита в этом конкретном месте не сработает. Поэтому ниже есть и серверный sanitize-слой — defense in depth. Универсальный хелпер на фронте:

```js
Fmt.esc(s)  // < → &lt;, > → &gt;, & → &amp;, " → &quot;, ' → &#039;
```

📁 `frontend/js/format.js` · использован в `article.js`, `excursion.js`, `cabinet.js`, `admin.js`

**Defense-in-depth на бэке:** `clean_text()` обрезает по длине и вычищает управляющие символы перед сохранением в БД. То есть даже если фронт где-то забудет про эскейп, в БД не лежит злоупотребляемый payload.

📁 `backend/routes/_helpers.py:42`

### 8. SQL injection

Риск SQL-инъекций существенно снижен за счёт ORM: все запросы идут через SQLAlchemy с параметризованной подстановкой, raw-SQL строк в коде проекта на момент написания нет. Это закрывает классические векторы вроде конкатенации значений из request-параметров прямо в SQL.

```python
# Так — правильно (ORM, параметры подставляются драйвером)
User.query.filter_by(email=email).first()

# Так в этом проекте никто не пишет:
db.session.execute(f"SELECT * FROM users WHERE email='{email}'")  # уязвимо
```

При этом ORM сам по себе не делает приложение «иммунным»: если в будущем где-то появится `text("...")` или `.execute(...)` с f-string — уязвимость вернётся. Поэтому в чек-листе перед PR-ами стоит проверка `grep -E "text\(|execute\("` по бэкенду.

### 9. Безопасные HTTP-заголовки

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; img-src 'self' https://picsum.photos data:; ...
```

Что они делают:
- `nosniff` — браузер не пытается угадать MIME, защита от XSS через подмену типа;
- `DENY` — сайт нельзя встроить в `<iframe>` (защита от clickjacking);
- `Referrer-Policy` — не утечёт URL текущей страницы на сторонний сайт;
- `Permissions-Policy` — даже если кто-то подсунет вредоносный код, доступа к гео/камере/микрофону не будет;
- `CSP` — браузер исполняет скрипты только со своего origin и нашего CDN-хоста для картинок.

📁 `backend/app.py:114-138`

### 10. Open redirect

При редиректе после логина (`/auth?next=/cabinet`) параметр `next` проверяется:

```js
const next = (rawNext.startsWith('/') && !rawNext.startsWith('//')) ? rawNext : '/cabinet';
```

Без этой проверки `?next=https://evil.com` уводил бы пользователя на чужой сайт после логина.

📁 `frontend/js/auth.js:11`

### 11. IDOR (Insecure Direct Object Reference)

При запросе `/api/bookings/<id>` сервер сначала проверяет, что бронь принадлежит текущему пользователю (или он админ). Без этой проверки любой залогиненный мог бы читать чужие брони.

```python
if b.user_id != u.id and not u.is_admin:
    return jsonify(error="forbidden"), 403
```

📁 `backend/routes/bookings.py:110`

То же для `pay`/`cancel` — только владелец может менять свою бронь.

### 12. Валидация входных данных

Все формы валидируют формат и длину **на сервере** (на клиенте — только UX-подсказка, ей доверять нельзя):

| Поле | Что проверяется | Где |
|---|---|---|
| email | regex `^[^@\s]+@[^@\s]+\.[^@\s]+$` | `backend/routes/auth.py:11` |
| password | минимум 6 символов | `backend/routes/auth.py` |
| phone | regex `^[\d\s\+\-\(\)]{7,30}$` | `backend/routes/requests_.py:12` |
| дата бронирования | формат `YYYY-MM-DD`, не в прошлом | `backend/routes/bookings.py:39-46` |
| дата заявки | то же | `backend/routes/requests_.py:50-55` |
| `tourists` | 1–50 | `backend/routes/bookings.py:34` |
| тело комментария | пусто/контрольные символы вычищаются | `backend/routes/_helpers.py:42` (`clean_text`) |

### 13. Аудит-лог

Каждое админское действие пишется в таблицу `audit_log`:

```
INSERT articles  · "Безвизовые направления — гайд 2026"      [user_id=1, 2026-05-13 21:14]
UPDATE bookings  · B-1306 pending → paid                     [user_id=2, 2026-05-13 21:15]
DELETE comments  · #42                                       [user_id=1, 2026-05-13 21:16]
LOGIN users      · ivanov@example.com вошёл в систему        [user_id=2, 2026-05-13 21:17]
```

В админке отдельный блок «Активность» показывает последние 20 событий.

📁 Хелпер `log_action(op, table, message)` в `backend/routes/_helpers.py:35`, вызывается из всех CRUD-эндпоинтов

### 14. Что специально НЕ сделано (out of scope)

- **2FA** — не реализовано. Для учебного проекта — за рамками.
- **Email-верификация при регистрации** — нет почтового сервиса.
- **Сброс пароля** — нет почтового сервиса. Можно добавить с любым SMTP-провайдером.
- **Защита от SSRF** — отдельный слой не реализован. Бэкенд на текущий момент не делает исходящих HTTP-запросов на адреса, которые подставил бы пользователь, поэтому актуальной поверхности для SSRF здесь нет. Если в будущем появятся фичи вроде «загрузить аватар по URL», понадобится валидация хоста и блокировка приватных диапазонов.
- **Загрузка файлов** — эндпоинтов нет; обложки берутся из Picsum CDN с детерминированными seed-ами.
- **CAPTCHA на формах** — не требуется при rate limit.

### 15. Чек-лист перед деплоем

Если будете запускать проект в публичной сети, нужно:

- [ ] **`SECRET_KEY`** — задать длинной случайной строкой через env, **не** оставлять `dev-secret-меняйте-в-проде`. Сгенерировать: `python -c "import secrets; print(secrets.token_hex(32))"`.
- [ ] **DB пароль** — не `meridian` из `docker-compose.yml`. Перенести в `.env`, добавить в `.dockerignore`.
- [ ] **HTTPS** — за reverse proxy (nginx / Caddy / Traefik) с автообновлением Let's Encrypt. Без HTTPS cookie сессии перехватывается на любом Wi-Fi.
- [ ] **`SESSION_COOKIE_SECURE = True`** — добавить в `Config`, чтобы cookie не отправлялся по HTTP.
- [ ] **`APP_MODE=prod`** — gunicorn вместо flask dev-сервера. Уже поддерживается, надо только переключить в `docker-compose.yml`.
- [ ] **Rate limit storage** — на Redis (`RATELIMIT_STORAGE_URI=redis://...`), если запускаете больше одного контейнера приложения.
- [ ] **Логирование** — Flask пишет в stderr; в проде подключить sentry/elk/aws-cloudwatch.
- [ ] **`debug=True`** — выключить.

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
