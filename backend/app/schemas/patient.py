from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional

class PatientBase(BaseModel):
    full_name: str
    age: int
    gender: str
    phone: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    blood_group: Optional[str] = None
    existing_conditions: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    patient_id: str

    class Config:
        orm_mode = True
        from_attributes = True
