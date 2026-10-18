from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.patient_vitals import PatientVitals
from app.models.patient import Patient
from app.schemas.patient_vitals import VitalsCreate, VitalsResponse, VitalsWithAlerts
from app.utils.id_generator import generate_id
from app.utils.sms import send_sms

router = APIRouter(prefix="/vitals", tags=["Patient Vitals"])


# ─── Alert Engine ──────────────────────────────────────────────────────────────

def generate_alerts(vitals: PatientVitals) -> List[str]:
    """Check vital signs and return list of health alert strings."""
    alerts = []

    # Blood Pressure
    if vitals.systolic_bp is not None:
        if vitals.systolic_bp > 160:
            alerts.append("⚠️ High blood pressure detected. Doctor consultation recommended.")
        elif vitals.systolic_bp < 90:
            alerts.append("⚠️ Low blood pressure detected. Monitor the patient closely.")

    # Oxygen Saturation
    if vitals.spo2 is not None:
        if vitals.spo2 < 92:
            alerts.append("🚨 Low oxygen level detected. Immediate medical attention advised.")
        elif vitals.spo2 < 95:
            alerts.append("⚠️ Slightly low oxygen saturation. Monitor closely.")

    # Heart Rate
    if vitals.heart_rate is not None:
        if vitals.heart_rate > 100:
            alerts.append("⚠️ Elevated heart rate (tachycardia). Doctor review recommended.")
        elif vitals.heart_rate < 50:
            alerts.append("⚠️ Low heart rate (bradycardia). Doctor review recommended.")

    # Temperature
    if vitals.temperature is not None:
        if vitals.temperature >= 38.5:
            alerts.append("⚠️ High fever detected. Immediate care required.")
        elif vitals.temperature >= 37.5:
            alerts.append("⚠️ Mild fever detected. Monitor and hydrate.")
        elif vitals.temperature < 36.0:
            alerts.append("⚠️ Low body temperature. Monitor patient for hypothermia.")

    # Blood Sugar
    if vitals.blood_sugar is not None:
        if vitals.blood_sugar > 200:
            alerts.append("🚨 Very high blood sugar. Diabetic emergency possible. Immediate medical attention.")
        elif vitals.blood_sugar > 140:
            alerts.append("⚠️ Elevated blood sugar. Doctor consultation recommended.")
        elif vitals.blood_sugar < 70:
            alerts.append("🚨 Low blood sugar (hypoglycemia). Immediate intervention needed.")

    # BMI
    if vitals.bmi is not None:
        if vitals.bmi >= 30:
            alerts.append("⚠️ Obesity detected (BMI ≥ 30). Lifestyle counselling recommended.")
        elif vitals.bmi >= 25:
            alerts.append("ℹ️ Overweight (BMI 25–29.9). Diet and exercise advised.")
        elif vitals.bmi < 18.5:
            alerts.append("⚠️ Underweight (BMI < 18.5). Nutritional support recommended.")

    # Respiratory Rate
    if vitals.respiratory_rate is not None:
        if vitals.respiratory_rate > 24:
            alerts.append("🚨 High respiratory rate. Possible respiratory distress. Seek attention.")
        elif vitals.respiratory_rate < 12:
            alerts.append("⚠️ Low respiratory rate. Monitor patient breathing.")

    return alerts


# ─── BMI Calculator ───────────────────────────────────────────────────────────

def calculate_bmi(weight: float | None, height: float | None) -> float | None:
    """BMI = weight(kg) / (height(cm)/100)^2"""
    if weight and height and height > 0:
        height_m = height / 100
        return round(weight / (height_m ** 2), 2)
    return None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/add", response_model=VitalsWithAlerts, status_code=status.HTTP_201_CREATED)
def add_vitals(vitals_in: VitalsCreate, db: Session = Depends(get_db)):
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.patient_id == vitals_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {vitals_in.patient_id} not found in system")

    # Ensure valid ASHA worker
    from app.models.asha_worker import AshaWorker
    asha = db.query(AshaWorker).filter(AshaWorker.asha_id == vitals_in.asha_id).first()
    if not asha:
        first_asha = db.query(AshaWorker).first()
        if first_asha:
            vitals_in.asha_id = first_asha.asha_id
        else:
            default_asha = AshaWorker(
                asha_id="ASHA-2026-0001",
                full_name="Community ASHA Worker",
                phone="9876543211",
                village="Community Center",
                district="District Health",
                state="State",
                assigned_population=1000,
                years_experience=3
            )
            db.add(default_asha)
            db.commit()
            vitals_in.asha_id = "ASHA-2026-0001"

    vitals_id = generate_id(db, PatientVitals, "vitals_id", "VIT")

    # Auto-calculate BMI
    bmi = calculate_bmi(vitals_in.weight, vitals_in.height)

    db_vitals = PatientVitals(
        **vitals_in.dict(),
        vitals_id=vitals_id,
        bmi=bmi,
    )
    db.add(db_vitals)
    db.commit()
    db.refresh(db_vitals)


    alerts = generate_alerts(db_vitals)

    # SMS Fallback notification for critical alerts
    if len(alerts) > 0:
        patient = db.query(Patient).filter(Patient.patient_id == vitals_in.patient_id).first()
        if patient and patient.phone:
            alert_count = len(alerts)
            msg = f"Asha TeleHealth ALERT: {alert_count} health warning(s) detected in your recent vitals check. Please consult a doctor immediately."
            send_sms(patient.phone, msg)

    return {"vitals": db_vitals, "alerts": alerts}


@router.get("/patient/{patient_id}", response_model=List[VitalsWithAlerts])
def get_patient_vitals(patient_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(PatientVitals)
        .filter(PatientVitals.patient_id == patient_id)
        .order_by(PatientVitals.recorded_at.desc())
        .all()
    )
    if not records:
        raise HTTPException(status_code=404, detail="No vitals found for this patient")

    return [{"vitals": v, "alerts": generate_alerts(v)} for v in records]


@router.get("/latest/{patient_id}", response_model=VitalsWithAlerts)
def get_latest_vitals(patient_id: str, db: Session = Depends(get_db)):
    latest = (
        db.query(PatientVitals)
        .filter(PatientVitals.patient_id == patient_id)
        .order_by(PatientVitals.recorded_at.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="No vitals found for this patient")

    return {"vitals": latest, "alerts": generate_alerts(latest)}


@router.get("/doctor/{doctor_id}", response_model=List[VitalsWithAlerts])
def get_doctor_vitals(doctor_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(PatientVitals)
        .filter(PatientVitals.assigned_doctor_id == doctor_id)
        .order_by(PatientVitals.recorded_at.desc())
        .all()
    )
    return [{"vitals": v, "alerts": generate_alerts(v)} for v in records]
