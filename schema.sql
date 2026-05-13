-- ============================================================
-- Кругосвет — независимый журнал о путешествиях
-- Схема БД информационного туристического портала
-- СУБД: MySQL 8.x (utf8mb4)
--
-- Что хранит:
--   - countries / destinations  — справочник мест отдыха (страны и города)
--   - excursions                — экскурсии и туристические пакеты
--   - articles                  — новости туриндустрии (с категориями)
--   - users                     — пользователи (читатели + админы)
--   - comments                  — комментарии к статьям и экскурсиям
--   - favorites                 — избранное (полиморфно: статья / экскурсия / место)
--   - requests                  — заявки на консультацию по экскурсии
--   - audit_log                 — лог админских действий
-- ============================================================

DROP DATABASE IF EXISTS krugosvet;
CREATE DATABASE krugosvet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE krugosvet;


-- Страны (справочник)
CREATE TABLE countries (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    code    CHAR(2) NOT NULL UNIQUE,
    name    VARCHAR(80) NOT NULL,
    is_hot  TINYINT(1) NOT NULL DEFAULT 0
);

-- Места отдыха — страна или конкретный город. Получается удобный единый каталог.
-- Если country_id = self для самой страны? Я сделал проще — у страны нет parent,
-- у города ставится country_id, у самой страны city = NULL.
CREATE TABLE destinations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    country_id      INT NOT NULL,
    city            VARCHAR(80),               -- NULL = карточка страны целиком
    slug            VARCHAR(120) NOT NULL UNIQUE,
    title           VARCHAR(160) NOT NULL,
    summary         VARCHAR(500),              -- короткое описание для карточки
    description     TEXT,                      -- полный текст для детальной
    best_season     VARCHAR(80),               -- "май—октябрь"
    avg_temperature VARCHAR(40),               -- "+28 °C летом"
    flight_time     VARCHAR(40),               -- "4 ч" — типичное время перелёта
    cover_label     VARCHAR(80) DEFAULT 'фото',
    lat             DECIMAL(9,6),
    lng             DECIMAL(9,6),
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dest_country FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    INDEX idx_dest_featured (is_featured)
);

-- Экскурсии и тур-пакеты. Это контент, не товар — без статусов оплаты.
CREATE TABLE excursions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    destination_id  INT NOT NULL,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    kind            ENUM('excursion','package') NOT NULL DEFAULT 'excursion',
    summary         VARCHAR(500),
    description     TEXT,
    program         TEXT,                      -- "День 1: ..., День 2: ..."
    duration        VARCHAR(60),               -- "8 часов" / "5 дней / 4 ночи"
    price_from      INT,                       -- ориентировочная цена в долларах. NULL если "по запросу"
    languages       VARCHAR(120) DEFAULT 'русский',
    group_size      VARCHAR(60),               -- "до 8 человек"
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    cover_label     VARCHAR(80) DEFAULT 'обложка',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_exc_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    INDEX idx_exc_kind (kind),
    INDEX idx_exc_featured (is_featured)
);

-- Категории новостей: общие, направления, советы, индустрия и т.п.
CREATE TABLE article_categories (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    slug  VARCHAR(60) NOT NULL UNIQUE,
    name  VARCHAR(80) NOT NULL
);

-- Новости туриндустрии и редакционные статьи.
CREATE TABLE articles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    slug            VARCHAR(160) NOT NULL UNIQUE,
    category_id     INT,
    destination_id  INT,                       -- статья может быть привязана к месту
    title           VARCHAR(220) NOT NULL,
    summary         VARCHAR(500),
    body            MEDIUMTEXT,                -- большой текст статьи
    author          VARCHAR(120) NOT NULL DEFAULT 'Редакция «Кругосвет»',
    cover_label     VARCHAR(80) DEFAULT 'обложка',
    reading_time    INT DEFAULT 5,             -- минуты на прочтение
    is_published    TINYINT(1) NOT NULL DEFAULT 1,
    is_featured     TINYINT(1) NOT NULL DEFAULT 0,
    views           INT NOT NULL DEFAULT 0,
    published_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_art_cat  FOREIGN KEY (category_id)    REFERENCES article_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_art_dest FOREIGN KEY (destination_id) REFERENCES destinations(id)        ON DELETE SET NULL,
    INDEX idx_art_published (published_at),
    INDEX idx_art_featured (is_featured)
);

-- Пользователи. Хеши паролей — Werkzeug PBKDF2.
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(120) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(120) NOT NULL,
    phone           VARCHAR(40),
    is_admin        TINYINT(1) NOT NULL DEFAULT 0,
    avatar_letters  VARCHAR(4),                -- буквы для "цветной плашки" вместо фото
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Комментарии. Полиморфные: одна таблица для статей и экскурсий.
-- target_type = 'article' | 'excursion', target_id — id записи.
CREATE TABLE comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    target_type ENUM('article','excursion') NOT NULL,
    target_id   INT NOT NULL,
    user_id     INT NOT NULL,
    body        TEXT NOT NULL,
    is_approved TINYINT(1) NOT NULL DEFAULT 1, -- модерация (по умолчанию все одобрены)
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_com_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_com_target (target_type, target_id),
    INDEX idx_com_approved (is_approved)
);

-- Избранное — тоже полиморфное (article / excursion / destination).
CREATE TABLE favorites (
    user_id     INT NOT NULL,
    target_type ENUM('article','excursion','destination') NOT NULL,
    target_id   INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, target_type, target_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fav_target (target_type, target_id)
);

-- Заявки на консультацию по экскурсии.
CREATE TABLE consult_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    excursion_id    INT,                       -- может быть NULL (общая заявка)
    user_id         INT,                       -- если оставлено залогиненным
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(120) NOT NULL,
    phone           VARCHAR(40)  NOT NULL,
    desired_date    DATE,
    message         TEXT,
    status          ENUM('new','in_work','done','cancelled') NOT NULL DEFAULT 'new',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_req_exc  FOREIGN KEY (excursion_id) REFERENCES excursions(id) ON DELETE SET NULL,
    CONSTRAINT fk_req_user FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE SET NULL,
    INDEX idx_req_status (status),
    INDEX idx_req_created (created_at)
);

-- Лог админских действий
CREATE TABLE audit_log (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    op          ENUM('INSERT','UPDATE','DELETE','LOGIN') NOT NULL,
    table_name  VARCHAR(40) NOT NULL,
    message     VARCHAR(255),
    user_id     INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at)
);


-- ============================================================
-- Сиды — справочные данные. Пользователи и зависимое — в seed.py.
-- ============================================================

INSERT INTO countries (code, name, is_hot) VALUES
    ('TR', 'Турция',  1),
    ('EG', 'Египет',  1),
    ('AE', 'ОАЭ',     0),
    ('TH', 'Таиланд', 0),
    ('GR', 'Греция',  1),
    ('CY', 'Кипр',    0),
    ('IT', 'Италия',  0),
    ('GE', 'Грузия',  0);

INSERT INTO article_categories (slug, name) VALUES
    ('news',     'Новости'),
    ('advice',   'Советы'),
    ('industry', 'Индустрия'),
    ('places',   'Места');

-- Места отдыха: пара стран целиком + города
INSERT INTO destinations (country_id, city, slug, title, summary, description,
                          best_season, avg_temperature, flight_time,
                          cover_label, lat, lng, is_featured) VALUES
    (1, NULL, 'turtsiya',
     'Турция',
     'Самое популярное направление: пляжи Эгейского и Средиземного моря, всё включено и недорого.',
     'Турция давно превратилась в туристический хаб. Сюда летают ради пляжного отдыха и истории — Стамбул, Эфес, Каппадокия. Большинство отелей работают по системе «всё включено», а перелёт занимает 3–4 часа.',
     'апрель–октябрь', '+28 °C летом', '3–4 ч',
     'Турция — побережье', 38.9637, 35.2433, 1),

    (1, 'Анталия', 'antalya',
     'Анталия',
     'Главный курорт Турции: широкие пляжи, аквапарки, ночная жизнь и десятки отелей 5★.',
     'Анталия делится на районы: Кемер, Белек, Сиде, Аланья. Каждый со своим характером — Кемер у гор, Белек для гольфа и спа, Сиде с античными руинами.',
     'май–сентябрь', '+30 °C летом', '3 ч 30 мин',
     'Анталия — бухты', 36.8841, 30.7056, 1),

    (2, 'Хургада', 'hurghada',
     'Хургада',
     'Главный курорт Красного моря: коралловые рифы, дайвинг и круглогодичное солнце.',
     'Хургада подходит для тех, кто хочет море и солнце даже зимой. Глубоководные рифы — мечта дайверов, а в августе на пляжах +35 °C.',
     'круглый год', '+25–35 °C', '4 ч 30 мин',
     'Хургада — рифы', 27.2579, 33.8116, 0),

    (3, 'Дубай', 'dubai',
     'Дубай',
     'Город будущего в пустыне: небоскрёбы, шопинг и пляжи Персидского залива.',
     'Дубай впечатляет масштабом — Burj Khalifa, искусственные острова, гигантские моллы. Лучшее время — ноябрь–март, когда нет изнуряющей жары.',
     'ноябрь–март', '+22 °C зимой', '5 ч 30 мин',
     'Дубай — небоскрёбы', 25.2048, 55.2708, 1),

    (4, 'Пхукет', 'phuket',
     'Пхукет',
     'Самый известный остров Таиланда: тропические пляжи, рынки и соседние Пхи-Пхи.',
     'Пхукет хорош плотной инфраструктурой: бары Патонга, тихие бухты, экскурсии на острова Пхи-Пхи и Симиланы. Лететь 9–10 часов, но ради этих закатов — стоит.',
     'ноябрь–апрель', '+30 °C', '9 ч',
     'Пхукет — пляж', 7.9519, 98.3381, 0),

    (5, NULL, 'gretsiya',
     'Греция',
     'Колыбель Европы и идеальное Эгейское море. Континентальная часть и сотни островов.',
     'В Греции есть всё — пляжный отдых на Крите и Родосе, антика в Афинах, белоснежная Санторини. И при этом средиземноморская кухня, которая сама по себе достопримечательность.',
     'май–октябрь', '+27 °C летом', '3 ч 50 мин',
     'Греция — острова', 39.0742, 21.8243, 1),

    (7, 'Рим', 'rome',
     'Рим',
     'Вечный город. Собор Святого Петра, Колизей, фонтаны и пицца на каждом углу.',
     'Рим — для тех, кто хочет погружения в историю. Три-четыре дня — минимум, чтобы успеть Ватикан, Колизей, форумы и не торопясь поужинать в Трастевере.',
     'апрель–июнь, сентябрь–октябрь', '+25 °C весной', '4 ч',
     'Рим — Колизей', 41.9028, 12.4964, 0),

    (8, 'Батуми', 'batumi',
     'Батуми',
     'Грузинская «Маленькая Дубай» на Чёрном море: набережная, башни и хинкали.',
     'Батуми за десять лет превратился из тихого приморья в курорт с современной набережной, отелями международных брендов и насыщенной едой.',
     'июнь–сентябрь', '+27 °C летом', '2 ч 30 мин',
     'Батуми — пляж', 41.6517, 41.6406, 0);

-- Экскурсии и пакеты
INSERT INTO excursions (destination_id, slug, title, kind, summary, description, program,
                        duration, price_from, languages, group_size,
                        is_featured, cover_label) VALUES
    (2, 'kapadokiya-iz-antalii', 'Каппадокия за один день', 'excursion',
     'Долины, скальные церкви и подземный город — однодневная экскурсия из Анталии или Кемера.',
     'Перелёт в Кайсери, обзор знаменитых долин Гёреме, остановка в скальных церквях и спуск в подземный город Каймаклы. Возвращение поздним вечером того же дня.',
     'Сбор группы 04:30 — переезд в аэропорт Анталии — рейс в Кайсери — долины Гёреме — обед — подземный город Каймаклы — фабрика ковров — обратный рейс.',
     '18 часов', 16500, 'русский, английский', 'до 24 человек', 1, 'Каппадокия — шары'),

    (2, 'demre-mira-keklin', 'Демре, Мира, Кекова', 'excursion',
     'Древняя Ликия за день: руины Миры, церковь Святого Николая и затонувший город.',
     'Маршрут проходит по местам древней Ликии. Сначала церковь Святого Николая в Демре, затем амфитеатр и скальные гробницы Миры, потом морская прогулка над затонувшим городом Кекова.',
     'Выезд из отеля — Демре — церковь Св. Николая — Мира — обед — морская прогулка над Кековой — возвращение.',
     '10 часов', 4500, 'русский', 'до 30 человек', 0, 'Кекова — лодка'),

    (3, 'vyhod-na-rife', 'Дайвинг на коралловом рифе', 'excursion',
     'Однодневный выход на риф Гифтун: 2 погружения, обед на катере, snorkeling.',
     'Один из лучших рифов Красного моря в часе хода от Хургады. Программа подходит и для опытных, и для тех, кто хочет попробовать снорклинг.',
     '07:30 трансфер в порт — выход в море — погружение №1 — обед — погружение №2 — возвращение к 17:00.',
     '10 часов', 5800, 'русский, английский', 'до 20 человек', 1, 'риф — снорклинг'),

    (4, 'pustynya-safari', 'Сафари по пустыне Дубая', 'excursion',
     'Багги по дюнам, бедуинский лагерь, ужин под звёздами и шоу с танцем живота.',
     'Классическая вечерняя программа в эмиратах. Плюс — катание на верблюде и хна по желанию.',
     '15:30 встреча — переезд в пустыню — багги — закат — лагерь — ужин — шоу — возврат к 22:00.',
     '6 часов', 7200, 'русский, английский', 'до 6 человек на машину', 0, 'дюны — джип'),

    (5, 'kruiz-po-ostrovam', 'Круиз по островам Эгейского моря', 'package',
     '5-дневный круиз: Миконос, Делос, Парос, Санторини. Тур-пакет с проживанием на лайнере.',
     'Морское путешествие классом «комфорт». Пять дней — пять островов. Программа включает экскурсии в портах, ужины с видом на Эгейское море и одну ночёвку на берегу Санторини.',
     'День 1: Афины — посадка на лайнер. День 2: Миконос. День 3: Делос + Парос. День 4: Санторини. День 5: возвращение в Афины.',
     '5 дней / 4 ночи', 78000, 'русский, английский', 'индивидуально', 1, 'Эгейское море'),

    (7, 'rim-za-3-dnya', 'Рим за три дня', 'package',
     '3-дневный мини-пакет с гидом: Ватикан, Колизей, фонтаны, музеи, Трастевере.',
     'Программа для первого посещения. Каждый день — пешая обзорка с историком и свободное время до и после.',
     'День 1: Колизей и Форумы. День 2: Ватикан и Музеи. День 3: барочный центр + Трастевере.',
     '3 дня', 42000, 'русский', 'до 12 человек', 0, 'Рим — Ватикан'),

    (8, 'gruzinskoe-vino-i-kuhnya', 'Гастротур по Грузии', 'package',
     'Винные погреба Кахетии, мастер-класс по хинкали, ужин в семье. 4 дня.',
     'Камерный тур по Кахетии и Тбилиси. Знакомство с историей виноделия и грузинской кухни через дегустации и мастер-классы.',
     'День 1: Тбилиси, обзорная и ужин. День 2: Кахетия, винодельни. День 3: мастер-класс по хинкали. День 4: вылет.',
     '4 дня / 3 ночи', 36000, 'русский', 'до 8 человек', 1, 'Грузия — погреб');

-- Статьи (привязаны к категориям и местам)
INSERT INTO articles (slug, category_id, destination_id, title, summary, body, author,
                      cover_label, reading_time, is_published, is_featured, views, published_at) VALUES
    ('vizy-2026', 3, NULL,
     'Безвизовые направления — гайд 2026',
     'Свежий обзор стран с безвизовым въездом и упрощёнными процедурами на 2026 год.',
     'В 2026 году список доступных без визы направлений почти не изменился, но появились нюансы. Турция и Грузия — по-прежнему самые удобные варианты. Египет и ОАЭ выдают визу по прилёте. Подробности и сроки — в карточках ниже.',
     'Анна Громова', 'обложка — паспорта', 5, 1, 1, 1820,
     NOW() - INTERVAL 2 DAY),

    ('top-5-mest-leto-2026', 4, NULL,
     'Топ-5 направлений для пляжного отдыха летом 2026',
     'Рейтинг направлений редакции «Кругосвет» — без рекламы, по соотношению цены и качества.',
     'Каждое лето читатели спрашивают одно и то же: куда полететь, чтобы было море, не очень дорого и без проблем с визой. Мы собрали пять направлений, которые удовлетворят почти всех.',
     'Игорь Лебедев', 'обложка — пляж', 7, 1, 1, 2410,
     NOW() - INTERVAL 5 DAY),

    ('cappadocia-guide', 4, 2,
     'Каппадокия за один день: реально ли, и стоит ли ехать',
     'Личный опыт редакции: летим на рассвете в Кайсери и возвращаемся в Анталию ночью.',
     'Утренний рейс — пять утра в аэропорту Анталии. Через час с небольшим — Кайсери. Дальше автобус, и долины Гёреме открываются как декорации к фильму.',
     'Анна Громова', 'обложка — шары', 8, 1, 0, 980,
     NOW() - INTERVAL 8 DAY),

    ('phuket-rains', 2, 5,
     'Когда не стоит лететь на Пхукет: гид по сезонам',
     'Высокий сезон — ноябрь–апрель. Что происходит остальные полгода — разбираемся.',
     'С мая по октябрь на Пхукете дождевой сезон. Это не значит, что все 24 часа льёт — но утро солнечное, а к обеду грозы становятся обыденностью. Мы провели две недели в августе и расскажем как это.',
     'Михаил Орлов', 'обложка — пальмы', 6, 1, 0, 612,
     NOW() - INTERVAL 12 DAY),

    ('industriya-cifry-q1-2026', 3, NULL,
     'Туриндустрия 2026: цифры за первый квартал',
     'Аналитика бронирований, средний чек и популярные направления в январе–марте.',
     'Первый квартал 2026 года показал рост числа бронирований на 14% год к году. Лидер по динамике — Грузия (+38%), за ней Турция (+22%) и ОАЭ (+11%). Средний чек на пляжный тур вырос на 9% — отражение общей инфляции в индустрии.',
     'Редакция «Кругосвет»', 'обложка — графики', 4, 1, 0, 433,
     NOW() - INTERVAL 1 DAY),

    ('sovety-pervyy-raz', 2, NULL,
     'Первый раз за границей: 9 советов, которые сэкономят нервы',
     'Маленькие лайфхаки для тех, кто едет за пределы России впервые.',
     'Самая популярная ошибка — не сделать копии паспорта. Вторая — не разменять валюту заранее. Сводный гайд для новичков.',
     'Анна Громова', 'обложка — чемодан', 5, 1, 0, 1250,
     NOW() - INTERVAL 14 DAY);
