from __future__ import annotations
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class DoctorCreate(BaseModel):
    full_name: str
    specialization: str
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    phone: str
    email: Optional[str] = None
    password: str
    experience_years: Optional[int] = None
    consultation_fee: Optional[int] = None
    available_days: Optional[List[str]] = []
    available_time_slots: Optional[List[str]] = []


class DoctorAvailabilityUpdate(BaseModel):
    availability_status: bool


class DoctorResponse(BaseModel):
    full_name: str
    specialization: str
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    phone: str
    email: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[int] = None
    available_days: Optional[List[str]] = []
    available_time_slots: Optional[List[str]] = []
    doctor_id: str
    availability_status: bool
    created_at: datetime

    class Config:
        from_attributes = True
