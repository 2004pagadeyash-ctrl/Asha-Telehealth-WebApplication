from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VitalsCreate(BaseModel):
    patient_id: str
    asha_id: str
    assigned_doctor_id: Optional[str] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    spo2: Optional[int] = None
    blood_sugar: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    respiratory_rate: Optional[int] = None
    symptoms: Optional[str] = None
    notes: Optional[str] = None


class VitalsResponse(VitalsCreate):
    vitals_id: str
    bmi: Optional[float] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class VitalsWithAlerts(BaseModel):
    vitals: VitalsResponse
    alerts: List[str]
