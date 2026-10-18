from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class RecordCreate(BaseModel):
    patient_id: str
    doctor_id: str
    diagnosis: Optional[str] = None
    prescription: Optional[List[str]] = []
    notes: Optional[str] = None


class RecordResponse(RecordCreate):
    record_id: str
    consultation_date: datetime

    class Config:
        from_attributes = True
