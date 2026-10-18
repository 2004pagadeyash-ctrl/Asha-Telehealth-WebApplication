from __future__ import annotations
from sqlalchemy import Column, Integer, String, Sequence, Date, JSON
from app.core.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)

    # Location Fields
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)

    # Medical Fields
    blood_group = Column(String, nullable=True)
    existing_conditions = Column(JSON, nullable=True)
    allergies = Column(JSON, nullable=True)
    current_medications = Column(JSON, nullable=True)

    # Emergency Contact
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)

    # Other
    preferred_language = Column(String, nullable=True)
