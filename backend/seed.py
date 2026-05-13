"""
Скрипт первичного заполнения БД.

Покрывает оба сценария:
- если используется SQLite — сам создаёт таблицы через db.create_all() и наполняет
  ВСЕ справочники (страны, места, экскурсии, статьи, категории) и пользователей;
- если используется MySQL и схему уже импортировали через schema.sql —
  заполняет только пользователей и связанные данные (не дублируя справочники).

Запуск:
    flask --app app seed
"""

from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash

from extensions import db
from models import (
    Country, Destination, Excursion,
    Article, ArticleCategory,
    User, Comment, Favorite, ConsultRequest, AuditLog, Booking,
)


# --------------------------------------------------- СПРАВОЧНИКИ --

def _seed_countries():
    if Country.query.first():
        return
    db.session.add_all([
        Country(code="TR", name="Турция",  is_hot=True),
        Country(code="EG", name="Египет",  is_hot=True),
        Country(code="AE", name="ОАЭ",     is_hot=False),
        Country(code="TH", name="Таиланд", is_hot=False),
        Country(code="GR", name="Греция",  is_hot=True),
        Country(code="CY", name="Кипр",    is_hot=False),
        Country(code="IT", name="Италия",  is_hot=False),
        Country(code="GE", name="Грузия",  is_hot=False),
    ])
    db.session.flush()


def _seed_categories():
    if ArticleCategory.query.first():
        return
    db.session.add_all([
        ArticleCategory(slug="news",     name="Новости"),
        ArticleCategory(slug="advice",   name="Советы"),
        ArticleCategory(slug="industry", name="Индустрия"),
        ArticleCategory(slug="places",   name="Места"),
    ])
    db.session.flush()


def _seed_destinations():
    if Destination.query.first():
        return

    # Карта код→id, чтобы не делать лишних запросов
    cmap = {c.code: c.id for c in Country.query.all()}

    rows = [
        # (country_code, city, slug, title, summary, description, season, temp, flight, cover, lat, lng, featured)
        ("TR", None, "turtsiya", "Турция",
         "Самое популярное направление: пляжи Эгейского и Средиземного моря, всё включено и недорого.",
         "Турция давно превратилась в туристический хаб. Сюда летают ради пляжного отдыха и истории — Стамбул, Эфес, Каппадокия. Большинство отелей работают по системе «всё включено», а перелёт занимает 3–4 часа.",
         "апрель–октябрь", "+28 °C летом", "3–4 ч", "Турция — побережье", 38.9637, 35.2433, True),

        ("TR", "Анталия", "antalya", "Анталия",
         "Главный курорт Турции: широкие пляжи, аквапарки, ночная жизнь и десятки отелей 5★.",
         "Анталия делится на районы: Кемер, Белек, Сиде, Аланья. Каждый со своим характером — Кемер у гор, Белек для гольфа и спа, Сиде с античными руинами.",
         "май–сентябрь", "+30 °C летом", "3 ч 30 мин", "Анталия — бухты", 36.8841, 30.7056, True),

        ("EG", "Хургада", "hurghada", "Хургада",
         "Главный курорт Красного моря: коралловые рифы, дайвинг и круглогодичное солнце.",
         "Хургада подходит для тех, кто хочет море и солнце даже зимой. Глубоководные рифы — мечта дайверов, а в августе на пляжах +35 °C.",
         "круглый год", "+25–35 °C", "4 ч 30 мин", "Хургада — рифы", 27.2579, 33.8116, False),

        ("AE", "Дубай", "dubai", "Дубай",
         "Город будущего в пустыне: небоскрёбы, шопинг и пляжи Персидского залива.",
         "Дубай впечатляет масштабом — Burj Khalifa, искусственные острова, гигантские моллы. Лучшее время — ноябрь–март, когда нет изнуряющей жары.",
         "ноябрь–март", "+22 °C зимой", "5 ч 30 мин", "Дубай — небоскрёбы", 25.2048, 55.2708, True),

        ("TH", "Пхукет", "phuket", "Пхукет",
         "Самый известный остров Таиланда: тропические пляжи, рынки и соседние Пхи-Пхи.",
         "Пхукет хорош плотной инфраструктурой: бары Патонга, тихие бухты, экскурсии на острова Пхи-Пхи и Симиланы. Лететь 9–10 часов, но ради этих закатов — стоит.",
         "ноябрь–апрель", "+30 °C", "9 ч", "Пхукет — пляж", 7.9519, 98.3381, False),

        ("GR", None, "gretsiya", "Греция",
         "Колыбель Европы и идеальное Эгейское море. Континентальная часть и сотни островов.",
         "В Греции есть всё — пляжный отдых на Крите и Родосе, антика в Афинах, белоснежная Санторини. И при этом средиземноморская кухня, которая сама по себе достопримечательность.",
         "май–октябрь", "+27 °C летом", "3 ч 50 мин", "Греция — острова", 39.0742, 21.8243, True),

        ("IT", "Рим", "rome", "Рим",
         "Вечный город. Собор Святого Петра, Колизей, фонтаны и пицца на каждом углу.",
         "Рим — для тех, кто хочет погружения в историю. Три-четыре дня — минимум, чтобы успеть Ватикан, Колизей, форумы и не торопясь поужинать в Трастевере.",
         "апрель–июнь, сентябрь–октябрь", "+25 °C весной", "4 ч", "Рим — Колизей", 41.9028, 12.4964, False),

        ("GE", "Батуми", "batumi", "Батуми",
         "Грузинская «Маленькая Дубай» на Чёрном море: набережная, башни и хинкали.",
         "Батуми за десять лет превратился из тихого приморья в курорт с современной набережной, отелями международных брендов и насыщенной едой.",
         "июнь–сентябрь", "+27 °C летом", "2 ч 30 мин", "Батуми — пляж", 41.6517, 41.6406, False),
    ]
    for code, city, slug, title, summary, desc, season, temp, flight, cover, lat, lng, featured in rows:
        db.session.add(Destination(
            country_id=cmap[code], city=city, slug=slug, title=title,
            summary=summary, description=desc,
            best_season=season, avg_temperature=temp, flight_time=flight,
            cover_label=cover, lat=lat, lng=lng, is_featured=featured,
        ))
    db.session.flush()


def _seed_excursions():
    if Excursion.query.first():
        return
    dmap = {d.slug: d.id for d in Destination.query.all()}

    rows = [
        # (dest_slug, slug, title, kind, summary, description, program, duration, price, languages, group, featured, cover)
        ("antalya", "kapadokiya-iz-antalii", "Каппадокия за один день", "excursion",
         "Долины, скальные церкви и подземный город — однодневная экскурсия из Анталии или Кемера.",
         "Перелёт в Кайсери, обзор знаменитых долин Гёреме, остановка в скальных церквях и спуск в подземный город Каймаклы. Возвращение поздним вечером того же дня.",
         "Сбор группы 04:30 — переезд в аэропорт Анталии — рейс в Кайсери — долины Гёреме — обед — подземный город Каймаклы — фабрика ковров — обратный рейс.",
         "18 часов", 220, "русский, английский", "до 24 человек", True, "Каппадокия — шары"),

        ("antalya", "demre-mira-keklin", "Демре, Мира, Кекова", "excursion",
         "Древняя Ликия за день: руины Миры, церковь Святого Николая и затонувший город.",
         "Маршрут проходит по местам древней Ликии. Сначала церковь Святого Николая в Демре, затем амфитеатр и скальные гробницы Миры, потом морская прогулка над затонувшим городом Кекова.",
         "Выезд из отеля — Демре — церковь Св. Николая — Мира — обед — морская прогулка над Кековой — возвращение.",
         "10 часов", 60, "русский", "до 30 человек", False, "Кекова — лодка"),

        ("hurghada", "vyhod-na-rife", "Дайвинг на коралловом рифе", "excursion",
         "Однодневный выход на риф Гифтун: 2 погружения, обед на катере, snorkeling.",
         "Один из лучших рифов Красного моря в часе хода от Хургады. Программа подходит и для опытных, и для тех, кто хочет попробовать снорклинг.",
         "07:30 трансфер в порт — выход в море — погружение №1 — обед — погружение №2 — возвращение к 17:00.",
         "10 часов", 80, "русский, английский", "до 20 человек", True, "риф — снорклинг"),

        ("dubai", "pustynya-safari", "Сафари по пустыне Дубая", "excursion",
         "Багги по дюнам, бедуинский лагерь, ужин под звёздами и шоу с танцем живота.",
         "Классическая вечерняя программа в эмиратах. Плюс — катание на верблюде и хна по желанию.",
         "15:30 встреча — переезд в пустыню — багги — закат — лагерь — ужин — шоу — возврат к 22:00.",
         "6 часов", 95, "русский, английский", "до 6 человек на машину", False, "дюны — джип"),

        ("gretsiya", "kruiz-po-ostrovam", "Круиз по островам Эгейского моря", "package",
         "5-дневный круиз: Миконос, Делос, Парос, Санторини. Тур-пакет с проживанием на лайнере.",
         "Морское путешествие классом «комфорт». Пять дней — пять островов. Программа включает экскурсии в портах, ужины с видом на Эгейское море и одну ночёвку на берегу Санторини.",
         "День 1: Афины — посадка на лайнер. День 2: Миконос. День 3: Делос + Парос. День 4: Санторини. День 5: возвращение в Афины.",
         "5 дней / 4 ночи", 1100, "русский, английский", "индивидуально", True, "Эгейское море"),

        ("rome", "rim-za-3-dnya", "Рим за три дня", "package",
         "3-дневный мини-пакет с гидом: Ватикан, Колизей, фонтаны, музеи, Трастевере.",
         "Программа для первого посещения. Каждый день — пешая обзорка с историком и свободное время до и после.",
         "День 1: Колизей и Форумы. День 2: Ватикан и Музеи. День 3: барочный центр + Трастевере.",
         "3 дня", 560, "русский", "до 12 человек", False, "Рим — Ватикан"),

        ("batumi", "gruzinskoe-vino-i-kuhnya", "Гастротур по Грузии", "package",
         "Винные погреба Кахетии, мастер-класс по хинкали, ужин в семье. 4 дня.",
         "Камерный тур по Кахетии и Тбилиси. Знакомство с историей виноделия и грузинской кухни через дегустации и мастер-классы.",
         "День 1: Тбилиси, обзорная и ужин. День 2: Кахетия, винодельни. День 3: мастер-класс по хинкали. День 4: вылет.",
         "4 дня / 3 ночи", 480, "русский", "до 8 человек", True, "Грузия — погреб"),
    ]
    for slug_d, slug, title, kind, summary, desc, program, duration, price, langs, group, feat, cover in rows:
        db.session.add(Excursion(
            destination_id=dmap[slug_d], slug=slug, title=title, kind=kind,
            summary=summary, description=desc, program=program,
            duration=duration, price_from=price, languages=langs, group_size=group,
            is_featured=feat, cover_label=cover,
        ))
    db.session.flush()


def _seed_articles():
    if Article.query.first():
        return
    cmap = {c.slug: c.id for c in ArticleCategory.query.all()}
    dmap = {d.slug: d.id for d in Destination.query.all()}

    now = datetime.utcnow()
    rows = [
        # (slug, cat_slug, dest_slug, title, summary, body, author, cover, reading_time, featured, views, days_ago)
        ("vizy-2026", "industry", None,
         "Безвизовые направления — гайд 2026",
         "Свежий обзор стран с безвизовым въездом и упрощёнными процедурами на 2026 год.",
         "В 2026 году список доступных без визы направлений почти не изменился, но появились нюансы. Турция и Грузия — по-прежнему самые удобные варианты. Египет и ОАЭ выдают визу по прилёте. Подробности и сроки — в карточках ниже.",
         "Анна Громова", "обложка — паспорта", 5, True, 1820, 2),

        ("top-5-mest-leto-2026", "places", None,
         "Топ-5 направлений для пляжного отдыха летом 2026",
         "Рейтинг направлений редакции «Кругосвет» — без рекламы, по соотношению цены и качества.",
         "Каждое лето читатели задают одни и те же вопросы: куда лететь, чтобы было море, недорого и без визовой суеты. Мы собрали пять направлений, которые подходят почти всем.\n\nПервое место — Турция. Второе — Кипр.",
         "Игорь Лебедев", "обложка — пляж", 7, True, 2410, 5),

        ("cappadocia-guide", "places", "antalya",
         "Каппадокия за один день: реально ли, и стоит ли ехать",
         "Личный опыт редакции: летим на рассвете в Кайсери и возвращаемся в Анталию ночью.",
         "Утренний рейс — пять утра в аэропорту Анталии. Через час с небольшим — Кайсери. Дальше автобус, и долины Гёреме открываются как декорации к фильму.",
         "Анна Громова", "обложка — шары", 8, False, 980, 8),

        ("phuket-rains", "advice", "phuket",
         "Когда не стоит лететь на Пхукет: гид по сезонам",
         "Высокий сезон — ноябрь–апрель. Что происходит остальные полгода — разбираемся.",
         "С мая по октябрь на Пхукете дождевой сезон. Это не значит, что все 24 часа льёт — но утро солнечное, а к обеду грозы становятся обыденностью. Мы провели две недели в августе и расскажем как это.",
         "Михаил Орлов", "обложка — пальмы", 6, False, 612, 12),

        ("industriya-cifry-q1-2026", "industry", None,
         "Туриндустрия 2026: цифры за первый квартал",
         "Аналитика бронирований, средний чек и популярные направления в январе–марте.",
         "Первый квартал 2026 года показал рост числа бронирований на 14% год к году. Лидер по динамике — Грузия (+38%), за ней Турция (+22%) и ОАЭ (+11%). Средний чек на пляжный тур вырос на 9% — отражение общей инфляции в индустрии.",
         "Редакция «Кругосвет»", "обложка — графики", 4, False, 433, 1),

        ("sovety-pervyy-raz", "advice", None,
         "Первый раз за границей: 9 советов, которые сэкономят нервы",
         "Маленькие лайфхаки для тех, кто впервые отправляется в международное путешествие.",
         "Самая популярная ошибка — не сделать копии паспорта. Вторая — не разменять валюту заранее. Сводный гайд для новичков.",
         "Анна Громова", "обложка — чемодан", 5, False, 1250, 14),
    ]
    for slug, cat_slug, dest_slug, title, summary, body, author, cover, rt, feat, views, days_ago in rows:
        db.session.add(Article(
            slug=slug,
            category_id=cmap.get(cat_slug) if cat_slug else None,
            destination_id=dmap.get(dest_slug) if dest_slug else None,
            title=title, summary=summary, body=body, author=author,
            cover_label=cover, reading_time=rt, is_featured=feat, views=views,
            published_at=now - timedelta(days=days_ago),
        ))
    db.session.flush()


# ---------------------------------------------- ПОЛЬЗОВАТЕЛИ И ДЕМО --

def _seed_users_and_demo():
    if User.query.first():
        return

    admin = User(
        email="admin@krugosvet.ru",
        password_hash=generate_password_hash("admin123"),
        full_name="Администратор",
        phone="+1 (555) 010-0001",
        is_admin=True,
    )
    user = User(
        email="ivanov@example.com",
        password_hash=generate_password_hash("password"),
        full_name="Иванов Сергей Александрович",
        phone="+1 (555) 010-4567",
        is_admin=False,
    )
    user2 = User(
        email="anna@example.com",
        password_hash=generate_password_hash("password"),
        full_name="Громова Анна Михайловна",
        phone="+1 (555) 010-3344",
        is_admin=False,
    )
    db.session.add_all([admin, user, user2])
    db.session.flush()

    # Комментарии: пара к статьям, пара к экскурсиям. ID статей/экскурсий — 1..N в порядке сидинга.
    db.session.add_all([
        Comment(target_type="article", target_id=1, user_id=user.id,
                body="Очень полезный обзор. Особенно про Грузию — ездим уже четвёртый раз."),
        Comment(target_type="article", target_id=2, user_id=user2.id,
                body="Спасибо! С детьми в этом году выбираем именно по такому критерию."),
        Comment(target_type="article", target_id=3, user_id=user.id,
                body="Каппадокия безумно красивая, но 18 часов — это жесть. После такого день отсыпаешься."),
        Comment(target_type="excursion", target_id=1, user_id=user2.id,
                body="Сбор в 04:30 — морально готовьтесь, что вечером будете еле живые. Но шары на рассвете того стоят."),
        Comment(target_type="excursion", target_id=3, user_id=user.id,
                body="Брали с инструктором впервые — всё спокойно, никто не торопил. Рекомендую."),
    ])

    db.session.add_all([
        Favorite(user_id=user.id, target_type="article",     target_id=1),
        Favorite(user_id=user.id, target_type="article",     target_id=3),
        Favorite(user_id=user.id, target_type="excursion",   target_id=1),
        Favorite(user_id=user.id, target_type="destination", target_id=2),
        Favorite(user_id=user2.id, target_type="article",    target_id=2),
        Favorite(user_id=user2.id, target_type="excursion",  target_id=5),
    ])

    # Пара демо-броней
    db.session.add_all([
        Booking(
            code="B-1284", user_id=user.id, excursion_id=1,
            tourists=2, departure_date=date(2026, 6, 14),
            contact_phone=user.phone, contact_email=user.email,
            base_price=440, discount=0, total_price=440, status="paid",
        ),
        Booking(
            code="B-1305", user_id=user.id, excursion_id=5,
            tourists=2, departure_date=date(2026, 7, 10),
            contact_phone=user.phone, contact_email=user.email,
            base_price=2200, discount=110, total_price=2090, status="pending",
        ),
    ])

    db.session.add_all([
        ConsultRequest(
            excursion_id=1, user_id=user.id,
            full_name=user.full_name, email=user.email, phone=user.phone,
            desired_date=date(2026, 6, 14),
            message="Хочу узнать про вылет из Антальи и обратные билеты.",
            status="new",
        ),
        ConsultRequest(
            excursion_id=5, user_id=user2.id,
            full_name=user2.full_name, email=user2.email, phone=user2.phone,
            desired_date=date(2026, 7, 10),
            message="Возможен ли круиз для двоих с детьми 6 и 9 лет?",
            status="in_work",
        ),
        ConsultRequest(
            excursion_id=None, user_id=None,
            full_name="Петров Игорь", email="igor@example.com", phone="+1 (555) 010-9911",
            desired_date=None,
            message="Подскажите подходящее направление для сентября — бюджет до 100 тыс.",
            status="done",
        ),
    ])

    now = datetime.utcnow()
    db.session.add_all([
        AuditLog(op="INSERT", table_name="articles",
                 message='Опубликована статья "Безвизовые направления — гайд 2026"',
                 user_id=admin.id, created_at=now - timedelta(hours=2)),
        AuditLog(op="UPDATE", table_name="excursions",
                 message='"Каппадокия за один день" → is_featured=True',
                 user_id=admin.id, created_at=now - timedelta(hours=4)),
        AuditLog(op="INSERT", table_name="consult_requests",
                 message='Новая заявка #1 (Каппадокия)',
                 user_id=user.id, created_at=now - timedelta(hours=5)),
        AuditLog(op="UPDATE", table_name="consult_requests",
                 message='Заявка #2 → in_work',
                 user_id=admin.id, created_at=now - timedelta(hours=6)),
        AuditLog(op="LOGIN", table_name="users",
                 message='ivanov@example.com вошёл в систему',
                 user_id=user.id, created_at=now - timedelta(hours=7)),
    ])


# -------------------------------------------------- ENTRY POINT --

def seed_users_and_demo():
    """
    Главная точка наполнения. Создаёт схему (если её нет — для SQLite),
    заполняет справочники и пользователей. Каждый шаг идемпотентен:
    повторный вызов ничего не дублирует.
    """
    db.create_all()  # на SQLite сделает таблицы; на MySQL пропустит, если они уже есть
    _seed_countries()
    _seed_categories()
    _seed_destinations()
    _seed_excursions()
    _seed_articles()
    _seed_users_and_demo()
    db.session.commit()

    print(
        "seed: ", User.query.count(), "пользователей,",
        Destination.query.count(), "мест,",
        Excursion.query.count(), "экскурсий,",
        Article.query.count(), "статей,",
        Comment.query.count(), "комментариев,",
        ConsultRequest.query.count(), "заявок"
    )
