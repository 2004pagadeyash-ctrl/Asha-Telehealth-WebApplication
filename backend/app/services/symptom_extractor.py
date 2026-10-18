from __future__ import annotations
"""
Symptom keyword extractor.
Scans transcribed English text for known medical symptom keywords.
"""

SYMPTOM_KEYWORDS = [
    "fever",
    "headache",
    "cough",
    "breathlessness",
    "chest pain",
    "vomiting",
    "fatigue",
    "dizziness",
    "body pain",
    "sore throat",
    "nausea",
    "cold",
    "rash",
    "joint pain",
    "weakness",
    "diarrhea",
    "stomach pain",
    "back pain",
    "runny nose",
    "swelling",
]


def extract_symptoms(text: str) -> list[str]:
    """
    Extract symptom keywords from English transcription text.
    Returns a list of matched symptoms.
    """
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for symptom in SYMPTOM_KEYWORDS:
        if symptom in text_lower:
            found.append(symptom)
    return found
