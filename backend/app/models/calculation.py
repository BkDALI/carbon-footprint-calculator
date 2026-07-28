from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func

from app.database.database import Base


class Calculation(Base):
    __tablename__ = "calculations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, nullable=True)
    input_data = Column(JSON, nullable=False)   # ce que l'utilisateur a saisi
    breakdown = Column(JSON, nullable=False)    # émissions par catégorie
    total_co2eq_kg = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())