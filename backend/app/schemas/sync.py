from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PatientSyncRecord(BaseModel):
    """Schema for a single offline medical record to be synced."""
    patient_id: str
    doctor_id: str
    diagnosis: str
    prescription: Optional[List[str]] = []
    notes: Optional[str] = None
    consultation_date: datetime


class SyncRequest(BaseModel):
    """Batch sync request containing multiple offline records."""
    records: List[PatientSyncRecord]


class SyncResponse(BaseModel):
    """Lightweight response to minimise bandwidth."""
    message: str
    records_synced: int
    records_skipped: int
