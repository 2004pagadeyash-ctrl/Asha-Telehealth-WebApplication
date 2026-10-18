from __future__ import annotations
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base


class AshaWorker(Base):
    __tablename__ = "asha_workers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asha_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    assigned_population = Column(Integer, nullable=True)
    years_experience = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
