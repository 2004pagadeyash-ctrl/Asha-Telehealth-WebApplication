from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AshaWorkerCreate(BaseModel):
    full_name: str
    phone: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    assigned_population: Optional[int] = None
    years_experience: Optional[int] = None


class AshaWorkerResponse(AshaWorkerCreate):
    asha_id: str
    created_at: datetime

    class Config:
        from_attributes = True
