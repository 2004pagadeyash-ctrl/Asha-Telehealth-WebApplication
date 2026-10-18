from __future__ import annotations
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class PatientVitals(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    vitals_id = Column(String, unique=True, index=True, nullable=False)

    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    asha_id = Column(String, ForeignKey("asha_workers.asha_id"), nullable=False)
    assigned_doctor_id = Column(String, ForeignKey("doctors.doctor_id"), nullable=True)

    # BP
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)

    # Heart & Oxygen
    heart_rate = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)

    # Temperature & Sugar
    temperature = Column(Float, nullable=True)
    blood_sugar = Column(Integer, nullable=True)

    # Body Measurements
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)   # auto-calculated

    # Clinical notes
    symptoms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    recorded_at = Column(DateTime, default=datetime.utcnow)
