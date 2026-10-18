from __future__ import annotations
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from datetime import datetime
from app.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doctor_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    hospital_name = Column(String, nullable=True)
    hospital_address = Column(String, nullable=True)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    password_hash = Column(String, nullable=False, server_default="") # server_default temporarily for alembic
    experience_years = Column(Integer, nullable=True)
    consultation_fee = Column(Integer, nullable=True)
    availability_status = Column(Boolean, default=True)
    available_days = Column(JSON, nullable=True)
    available_time_slots = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
