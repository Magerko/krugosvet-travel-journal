"""
Модели SQLAlchemy. Структура повторяет schema.sql.

Идея проекта: информационный туристический портал.
- destinations  — места отдыха (страны и города)
- excursions    — экскурсии и тур-пакеты
- articles      — новости и статьи
- comments      — комментарии (полиморфные: к статье или экскурсии)
- favorites     — избранное (полиморфное: статья / экскурсия / место)
- consult_requests — заявки на консультацию по экскурсии
"""

from datetime import datetime
from extensions import db


class Country(db.Model):
    __tablename__ = "countries"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(2), nullable=False, unique=True)
    name = db.Column(db.String(80), nullable=False)
    is_hot = db.Column(db.Boolean, default=False)

    destinations = db.relationship("Destination", back_populates="country")

    def to_dict(self):
        return {"id": self.id, "code": self.code, "name": self.name, "is_hot": bool(self.is_hot)}


class Destination(db.Model):
    __tablename__ = "destinations"

    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.Integer, db.ForeignKey("countries.id"), nullable=False)
    city = db.Column(db.String(80))                 # NULL = страна целиком
    slug = db.Column(db.String(120), nullable=False, unique=True)
    title = db.Column(db.String(160), nullable=False)
    summary = db.Column(db.String(500))
    description = db.Column(db.Text)
    best_season = db.Column(db.String(80))
    avg_temperature = db.Column(db.String(40))
    flight_time = db.Column(db.String(40))
    cover_label = db.Column(db.String(80), default="фото")
    lat = db.Column(db.Numeric(9, 6))
    lng = db.Column(db.Numeric(9, 6))
    is_featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    country = db.relationship("Country", back_populates="destinations")
    excursions = db.relationship("Excursion", back_populates="destination")
    articles = db.relationship("Article", back_populates="destination")

    def to_dict(self, full=False):
        d = {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "summary": self.summary,
            "city": self.city,
            "country": self.country.name if self.country else None,
            "country_code": self.country.code if self.country else None,
            "is_featured": bool(self.is_featured),
            "cover_label": self.cover_label,
        }
        if full:
            d["description"] = self.description
            d["best_season"] = self.best_season
            d["avg_temperature"] = self.avg_temperature
            d["flight_time"] = self.flight_time
            d["lat"] = float(self.lat) if self.lat else None
            d["lng"] = float(self.lng) if self.lng else None
        return d


class Excursion(db.Model):
    __tablename__ = "excursions"

    id = db.Column(db.Integer, primary_key=True)
    destination_id = db.Column(db.Integer, db.ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False)
    slug = db.Column(db.String(120), nullable=False, unique=True)
    title = db.Column(db.String(200), nullable=False)
    kind = db.Column(db.Enum("excursion", "package"), default="excursion", nullable=False)
    summary = db.Column(db.String(500))
    description = db.Column(db.Text)
    program = db.Column(db.Text)
    duration = db.Column(db.String(60))
    price_from = db.Column(db.Integer)            # NULL = "цена по запросу"
    languages = db.Column(db.String(120), default="русский")
    group_size = db.Column(db.String(60))
    is_featured = db.Column(db.Boolean, default=False)
    cover_label = db.Column(db.String(80), default="обложка")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    destination = db.relationship("Destination", back_populates="excursions")

    KIND_LABELS = {"excursion": "Экскурсия", "package": "Тур-пакет"}

    def to_dict(self, full=False):
        d = {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "kind": self.kind,
            "kind_label": self.KIND_LABELS.get(self.kind, self.kind),
            "summary": self.summary,
            "duration": self.duration,
            "price_from": self.price_from,
            "is_featured": bool(self.is_featured),
            "cover_label": self.cover_label,
            "destination": {
                "id": self.destination.id,
                "title": self.destination.title,
                "city": self.destination.city,
                "country": self.destination.country.name if self.destination.country else None,
                "slug": self.destination.slug,
            } if self.destination else None,
        }
        if full:
            d["description"] = self.description
            d["program"] = self.program
            d["languages"] = self.languages
            d["group_size"] = self.group_size
        return d


class ArticleCategory(db.Model):
    __tablename__ = "article_categories"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(60), nullable=False, unique=True)
    name = db.Column(db.String(80), nullable=False)

    articles = db.relationship("Article", back_populates="category")

    def to_dict(self):
        return {"id": self.id, "slug": self.slug, "name": self.name}


class Article(db.Model):
    __tablename__ = "articles"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(160), nullable=False, unique=True)
    category_id = db.Column(db.Integer, db.ForeignKey("article_categories.id", ondelete="SET NULL"))
    destination_id = db.Column(db.Integer, db.ForeignKey("destinations.id", ondelete="SET NULL"))
    title = db.Column(db.String(220), nullable=False)
    summary = db.Column(db.String(500))
    body = db.Column(db.Text)
    author = db.Column(db.String(120), default="Редакция «Кругосвет»", nullable=False)
    cover_label = db.Column(db.String(80), default="обложка")
    reading_time = db.Column(db.Integer, default=5)
    is_published = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    views = db.Column(db.Integer, default=0)
    published_at = db.Column(db.DateTime, default=datetime.utcnow)

    category = db.relationship("ArticleCategory", back_populates="articles")
    destination = db.relationship("Destination", back_populates="articles")

    def to_dict(self, full=False):
        d = {
            "id": self.id,
            "slug": self.slug,
            "title": self.title,
            "summary": self.summary,
            "author": self.author,
            "cover_label": self.cover_label,
            "reading_time": self.reading_time,
            "is_published": bool(self.is_published),
            "is_featured": bool(self.is_featured),
            "views": self.views,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "category": self.category.to_dict() if self.category else None,
            "destination": {
                "id": self.destination.id,
                "title": self.destination.title,
                "slug": self.destination.slug,
            } if self.destination else None,
        }
        if full:
            d["body"] = self.body
        return d


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40))
    is_admin = db.Column(db.Boolean, default=False)
    avatar_letters = db.Column(db.String(4))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    comments = db.relationship("Comment", back_populates="user", cascade="all, delete-orphan")

    def initials(self):
        # Если в БД есть avatar_letters — используем их, иначе считаем по имени
        if self.avatar_letters:
            return self.avatar_letters
        parts = (self.full_name or "?").split()
        return ("".join(p[0] for p in parts[:2])).upper() or "?"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone,
            "is_admin": bool(self.is_admin),
            "initials": self.initials(),
        }


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    target_type = db.Column(db.Enum("article", "excursion"), nullable=False)
    target_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_approved = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="comments")

    def to_dict(self):
        # Имя выводим как "Имя Ф." — без полной фамилии для приватности
        name = "Аноним"
        if self.user:
            parts = self.user.full_name.split()
            if len(parts) >= 2:
                name = f"{parts[0]} {parts[1][0]}."
            elif parts:
                name = parts[0]
        return {
            "id": self.id,
            "body": self.body,
            "user_name": name,
            "user_initials": self.user.initials() if self.user else "?",
            "is_approved": bool(self.is_approved),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "target_type": self.target_type,
            "target_id": self.target_id,
        }


class Favorite(db.Model):
    __tablename__ = "favorites"

    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    target_type = db.Column(db.Enum("article", "excursion", "destination"), primary_key=True)
    target_id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ConsultRequest(db.Model):
    __tablename__ = "consult_requests"

    id = db.Column(db.Integer, primary_key=True)
    excursion_id = db.Column(db.Integer, db.ForeignKey("excursions.id", ondelete="SET NULL"))
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(40), nullable=False)
    desired_date = db.Column(db.Date)
    message = db.Column(db.Text)
    status = db.Column(db.Enum("new", "in_work", "done", "cancelled"), default="new", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    excursion = db.relationship("Excursion")
    user = db.relationship("User")

    STATUS_LABELS = {
        "new": "новая",
        "in_work": "в работе",
        "done": "обработана",
        "cancelled": "отменена",
    }

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "desired_date": self.desired_date.isoformat() if self.desired_date else None,
            "message": self.message,
            "status": self.status,
            "status_label": self.STATUS_LABELS.get(self.status, self.status),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "excursion": {
                "id": self.excursion.id,
                "title": self.excursion.title,
                "slug": self.excursion.slug,
            } if self.excursion else None,
        }


class AuditLog(db.Model):
    __tablename__ = "audit_log"

    id = db.Column(db.Integer, primary_key=True)
    op = db.Column(db.Enum("INSERT", "UPDATE", "DELETE", "LOGIN"), nullable=False)
    table_name = db.Column(db.String(40), nullable=False)
    message = db.Column(db.String(255))
    user_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "op": self.op,
            "table_name": self.table_name,
            "message": self.message,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
