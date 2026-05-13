"""
Здесь живут расширения Flask.
Вынес отдельно, чтобы избежать circular import между app.py и models.py.
"""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
