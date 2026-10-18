from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["AI Symptom Checker"])


# Simple rule-based symptom triage for hackathon
SYMPTOM_MAP = {
    "fever": {"conditions": ["viral fever", "flu", "typhoid", "malaria"], "recommendation": "consult doctor"},
    "headache": {"conditions": ["migraine", "tension headache", "dehydration"], "recommendation": "rest and hydration, consult if persistent"},
    "body pain": {"conditions": ["viral fever", "flu", "dengue"], "recommendation": "consult doctor"},
    "cough": {"conditions": ["common cold", "bronchitis", "asthma", "COVID-19"], "recommendation": "consult doctor if cough persists more than 3 days"},
    "chest pain": {"conditions": ["cardiac issue", "acid reflux", "anxiety"], "recommendation": "seek emergency medical attention immediately"},
    "vomiting": {"conditions": ["food poisoning", "gastroenteritis", "migraine"], "recommendation": "stay hydrated, consult doctor if severe"},
    "diarrhea": {"conditions": ["food poisoning", "gastroenteritis", "IBS"], "recommendation": "oral rehydration, consult doctor if blood in stool"},
    "rash": {"conditions": ["allergy", "chickenpox", "eczema", "scabies"], "recommendation": "consult doctor for diagnosis"},
    "breathlessness": {"conditions": ["asthma", "heart failure", "COVID-19", "anemia"], "recommendation": "seek emergency medical attention immediately"},
    "fatigue": {"conditions": ["anemia", "diabetes", "thyroid disorder", "depression"], "recommendation": "consult doctor for blood tests"},
    "cold": {"conditions": ["common cold", "flu", "sinusitis"], "recommendation": "rest and fluids, consult if no improvement in 5 days"},
    "nausea": {"conditions": ["gastroenteritis", "pregnancy", "migraine", "food poisoning"], "recommendation": "stay hydrated, rest, consult if persistent"},
    "diabetes": {"conditions": ["type 2 diabetes flare-up", "hypoglycemia"], "recommendation": "monitor blood sugar, consult doctor"},
    "joint pain": {"conditions": ["arthritis", "gout", "dengue", "chikungunya"], "recommendation": "consult doctor, avoid self-medication"},
}


class SymptomRequest(BaseModel):
    symptoms: str


@router.post("/symptom-check")
def symptom_check(request: SymptomRequest):
    input_text = request.symptoms.lower()

    matched_conditions = set()
    recommendation = "consult doctor"

    for keyword, data in SYMPTOM_MAP.items():
        if keyword in input_text:
            matched_conditions.update(data["conditions"])
            recommendation = data["recommendation"]

    # Flag emergency
    emergency_keywords = ["chest pain", "breathlessness", "unconscious", "paralysis", "stroke"]
    is_emergency = any(kw in input_text for kw in emergency_keywords)

    if is_emergency:
        recommendation = "EMERGENCY: Please call an ambulance or go to the nearest hospital immediately."

    return {
        "symptoms_received": request.symptoms,
        "possible_conditions": list(matched_conditions) if matched_conditions else ["Unable to identify — please consult a doctor"],
        "recommendation": recommendation,
        "disclaimer": "This is an AI-based preliminary assessment only. Always consult a qualified doctor."
    }
