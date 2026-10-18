from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    symptoms: Optional[str] = None
    consultation_type: str  # audio | video | chat
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str  # pending | confirmed | completed | cancelled


class AppointmentResponse(AppointmentCreate):
    appointment_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
