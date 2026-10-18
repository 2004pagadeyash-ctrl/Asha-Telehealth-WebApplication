from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.record import MedicalRecord
from app.models.patient import Patient
from app.schemas.record import RecordCreate, RecordResponse
from app.utils.id_generator import generate_id
from app.utils.sms import send_sms

router = APIRouter(prefix="/records", tags=["medical records"])


@router.post("/create", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(record_in: RecordCreate, db: Session = Depends(get_db)):
    record_id = generate_id(db, MedicalRecord, "record_id", "REC")
    db_record = MedicalRecord(**record_in.dict(), record_id=record_id)
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    # SMS Fallback for Prescriptions
    if record_in.prescription and len(record_in.prescription) > 0:
        patient = db.query(Patient).filter(Patient.patient_id == record_in.patient_id).first()
        if patient and patient.phone:
            meds_preview = ", ".join(record_in.prescription[:2])
            msg = f"Asha TeleHealth: Dr. {record_in.doctor_id} has issued a new prescription ({meds_preview}). Check app for details."
            send_sms(patient.phone, msg)

    return db_record


@router.get("/patient/{patient_id}", response_model=list[RecordResponse])
def get_patient_records(patient_id: str, db: Session = Depends(get_db)):
    records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this patient")
    return records


@router.get("/{record_id}", response_model=RecordResponse)
def get_record(record_id: str, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.record_id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return record
