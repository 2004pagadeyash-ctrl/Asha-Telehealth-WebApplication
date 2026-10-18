from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.schemas.risk import PatientRiskRequest, PatientRiskResponse, HighRiskPatientResponse
from app.services.risk_engine import calculate_risk_score
from app.models.patient import Patient

router = APIRouter(tags=["AI Risk Triage"])

@router.post("/ai/patient-risk", response_model=PatientRiskResponse)
def evaluate_patient_risk(req: PatientRiskRequest, db: Session = Depends(get_db)):
    """
    Calculate the risk score and triage level for a specific patient.
    Aggregates data from latest vitals, voice symptom reports, and medical history.
    """
    result = calculate_risk_score(req.patient_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")
    return result

@router.get("/alerts/high-risk-patients", response_model=List[HighRiskPatientResponse])
def get_high_risk_patients(db: Session = Depends(get_db)):
    """
    Returns a list of all patients currently classified as HIGH or CRITICAL risk.
    Useful for a centralized hospital dashboard to prioritize emergency cases.
    """
    patients = db.query(Patient).all()
    high_risk_list = []
    
    for p in patients:
        res = calculate_risk_score(p.patient_id, db)
        if res and res["risk_level"] in ["HIGH", "CRITICAL"]:
            high_risk_list.append({
                "patient_id": res["patient_id"],
                "risk_score": res["risk_score"],
                "risk_level": res["risk_level"],
                "reasons": res.get("alerts", []),
                "assessed_at": datetime.utcnow().isoformat()
            })
            
    # Sort by risk score in descending order (highest risk first)
    high_risk_list.sort(key=lambda x: x["risk_score"], reverse=True)
    return high_risk_list
