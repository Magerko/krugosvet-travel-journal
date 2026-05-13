"""
Точка входа Flask-приложения «Кругосвет».
Информационный туристический портал: новости, экскурсии, места отдыха, заявки.
"""

from pathlib import Path

from flask import Flask, send_from_directory, jsonify

from config import Config
from extensions import db


# Папка с фронтом — она лежит рядом с backend/, на уровень выше
FRONTEND_DIR = (Path(__file__).parent.parent / "frontend").resolve()


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    db.init_app(app)

    # Импортируем модели, чтобы SQLAlchemy их зарегистрировала
    from models import (  # noqa: F401
        Country, Destination, Excursion,
        Article, ArticleCategory,
        User, Comment, Favorite, ConsultRequest, AuditLog,
    )

    # Регистрация Blueprint'ов
    from routes.auth         import bp as auth_bp
    from routes.destinations import bp as dest_bp
    from routes.excursions   import bp as exc_bp
    from routes.articles     import bp as art_bp
    from routes.favorites    import bp as fav_bp
    from routes.requests_    import bp as req_bp
    from routes.admin        import bp as admin_bp
    from routes.misc         import bp as misc_bp

    app.register_blueprint(auth_bp,  url_prefix="/api/auth")
    app.register_blueprint(dest_bp,  url_prefix="/api/destinations")
    app.register_blueprint(exc_bp,   url_prefix="/api/excursions")
    app.register_blueprint(art_bp,   url_prefix="/api/articles")
    app.register_blueprint(fav_bp,   url_prefix="/api/favorites")
    app.register_blueprint(req_bp,   url_prefix="/api/requests")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(misc_bp,  url_prefix="/api")

    # CLI: flask --app app seed
    @app.cli.command("seed")
    def cli_seed():
        from seed import seed_users_and_demo
        seed_users_and_demo()

    # ---------- Раздача фронта ----------
    @app.route("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/excursions")
    def page_excursions():
        return send_from_directory(FRONTEND_DIR, "excursions.html")

    @app.route("/excursions/<slug>")
    def page_excursion_detail(slug):
        # slug читается из URL фронтом
        return send_from_directory(FRONTEND_DIR, "excursion.html")

    @app.route("/destinations")
    def page_destinations():
        return send_from_directory(FRONTEND_DIR, "destinations.html")

    @app.route("/destinations/<slug>")
    def page_destination_detail(slug):
        return send_from_directory(FRONTEND_DIR, "destination.html")

    @app.route("/news")
    def page_news():
        return send_from_directory(FRONTEND_DIR, "news.html")

    @app.route("/news/<slug>")
    def page_news_detail(slug):
        return send_from_directory(FRONTEND_DIR, "article.html")

    @app.route("/auth")
    def page_auth():
        return send_from_directory(FRONTEND_DIR, "auth.html")

    @app.route("/cabinet")
    def page_cabinet():
        return send_from_directory(FRONTEND_DIR, "cabinet.html")

    @app.route("/admin")
    def page_admin():
        return send_from_directory(FRONTEND_DIR, "admin.html")

    @app.route("/contacts")
    def page_contacts():
        return send_from_directory(FRONTEND_DIR, "contacts.html")

    @app.route("/<path:filename>")
    def static_files(filename):
        return send_from_directory(FRONTEND_DIR, filename)

    # ---------- Обработчики ошибок ----------
    @app.errorhandler(404)
    def not_found(_e):
        return jsonify(error="not_found"), 404

    @app.errorhandler(500)
    def server_error(e):
        app.logger.exception(e)
        return jsonify(error="server_error"), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
