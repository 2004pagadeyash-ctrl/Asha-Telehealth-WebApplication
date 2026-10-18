from __future__ import annotations
from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    appointment_id = Column(String, unique=True, index=True, nullable=False)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.doctor_id"), nullable=False)
    symptoms = Column(Text, nullable=True)
    consultation_type = Column(String, nullable=False)   # audio | video | chat
    status = Column(String, default="pending")           # pending | confirmed | completed | cancelled
    appointment_date = Column(String, nullable=True)
    appointment_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
