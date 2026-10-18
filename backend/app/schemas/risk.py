from __future__ import annotations
from pydantic import BaseModel
from typing import List

class PatientRiskRequest(BaseModel):
    patient_id: str

class PatientRiskResponse(BaseModel):
    patient_id: str
    risk_score: int
    risk_level: str
    alerts: List[str]
    recommendation: str

class HighRiskPatientResponse(BaseModel):
    patient_id: str
    risk_score: int
    risk_level: str
    reasons: List[str] = []
    assessed_at: str = ""
