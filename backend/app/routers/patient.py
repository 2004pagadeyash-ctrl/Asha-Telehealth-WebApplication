from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientResponse
from app.dependencies.auth import get_current_patient

router = APIRouter(
    prefix="/patients",
    tags=["patients"]
)

def generate_patient_id(db: Session) -> str:
    current_year = datetime.now().year
    prefix = f"PAT-{current_year}-"
    
    # Query to fetch the last patient created with the current year's prefix
    last_patient = db.query(Patient).filter(Patient.patient_id.like(f"{prefix}%")).order_by(Patient.id.desc()).first()
    
    if last_patient:
        last_id_num = int(last_patient.patient_id.split("-")[-1])
        new_id_num = last_id_num + 1
    else:
        new_id_num = 1
        
    # Format exactly to 4 digits (e.g., 0001, 0002)
    return f"{prefix}{str(new_id_num).zfill(4)}"


@router.post("/register", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(patient_in: PatientCreate, db: Session = Depends(get_db)):
    # Check if a patient with the same phone number already exists
    existing_patient = db.query(Patient).filter(Patient.phone == patient_in.phone).first()
    if existing_patient:
        raise HTTPException(status_code=400, detail="Patient with this phone number already exists")
    
    patient_id_str = generate_patient_id(db)
    
    db_patient = Patient(
        **patient_in.dict(),
        patient_id=patient_id_str
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    return db_patient


@router.get("/me", response_model=PatientResponse)
def get_me(current_patient: Patient = Depends(get_current_patient)):
    """
    Protected endpoint — returns the profile of the currently logged-in patient.
    Requires:  Authorization: Bearer <access_token>
    """
    return current_patient


@router.get("/", response_model=list[PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    """Return all registered patients."""
    return db.query(Patient).order_by(Patient.id.desc()).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient_by_id(patient_id: str, db: Session = Depends(get_db)):
    """Return patient by patient_id string."""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

