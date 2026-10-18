from __future__ import annotations
from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.patient_vitals import PatientVitals
from app.models.voice_report import VoiceReport

def calculate_risk_score(patient_id: str, db: Session) -> dict:
    """
    Evaluates patient health risk using vitals, symptoms, and medical history.
    Implements a rule-based AI triage scoring system.
    """
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        return None

    # Fetch latest vitals and voice report
    vitals = db.query(PatientVitals).filter(PatientVitals.patient_id == patient_id).order_by(PatientVitals.recorded_at.desc()).first()
    voice_report = db.query(VoiceReport).filter(VoiceReport.patient_id == patient_id).order_by(VoiceReport.created_at.desc()).first()

    score = 0
    alerts = []
    is_critical_override = False
    
    # 1. Evaluate Vitals
    if vitals:
        if vitals.spo2 is not None:
            if vitals.spo2 < 88:
                alerts.append("CRITICAL: Severe Low Oxygen")
                is_critical_override = True
            elif vitals.spo2 < 90:
                alerts.append("Low oxygen level")
                score += 40
            elif vitals.spo2 < 95:
                alerts.append("Slightly low oxygen")
                score += 20
                
        if vitals.temperature is not None:
            if vitals.temperature > 39:
                alerts.append("High fever")
                score += 25
            elif vitals.temperature > 38:
                alerts.append("Mild fever")
                score += 15
                
        if vitals.heart_rate is not None:
            if vitals.heart_rate > 120:
                alerts.append("High heart rate")
                score += 25
            elif vitals.heart_rate > 100:
                alerts.append("Elevated heart rate")
                score += 15

    # 2. Evaluate Symptoms (from Voice Report)
    if voice_report and voice_report.possible_symptoms:
        symptoms = [s.lower() for s in voice_report.possible_symptoms]
        
        # Check specific severe symptoms
        if "breathlessness" in symptoms or "severe breathlessness" in symptoms:
            alerts.append("CRITICAL: Breathlessness detected")
            if "severe breathlessness" in symptoms:
                is_critical_override = True
            score += 30
            
        if "chest pain" in symptoms:
            alerts.append("CRITICAL: Chest pain detected")
            is_critical_override = True
            score += 30
            
        if "fever" in symptoms:
            score += 10
            
        if "cough" in symptoms:
            score += 5

    # 3. Evaluate Medical History
    if patient.existing_conditions:
        conditions = [cond.lower() for cond in patient.existing_conditions]
        if "diabetes" in conditions:
            score += 10
        if "hypertension" in conditions:
            score += 10

    # 4. Classify Risk Level
    if is_critical_override or score >= 80:
        risk_level = "CRITICAL"
        recommendation = "Immediate emergency medical attention required"
        score = max(score, 80) # Ensure score reflects CRITICAL visually
    elif score >= 60:
        risk_level = "HIGH"
        recommendation = "Urgent doctor consultation recommended"
    elif score >= 30:
        risk_level = "MEDIUM"
        recommendation = "Doctor consultation recommended"
    else:
        risk_level = "LOW"
        recommendation = "Routine monitoring"

    return {
        "patient_id": patient_id,
        "risk_score": score,
        "risk_level": risk_level,
        "alerts": alerts,
        "recommendation": recommendation
    }
