from app.database.database import Base, engine

from app.models.user import User
from app.models.calculation import Calculation
# Importer tous les modèles ici
from app.models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)