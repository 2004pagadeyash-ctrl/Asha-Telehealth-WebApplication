from __future__ import annotations
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from datetime import datetime
from app.core.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    record_id = Column(String, unique=True, index=True, nullable=False)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.doctor_id"), nullable=False)
    diagnosis = Column(Text, nullable=True)
    prescription = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    consultation_date = Column(DateTime, default=datetime.utcnow)
