from __future__ import annotations
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from datetime import datetime
from app.core.database import Base


class VoiceReport(Base):
    __tablename__ = "voice_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(String, unique=True, index=True, nullable=False)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False)
    audio_file_path = Column(String, nullable=True)
    original_transcription = Column(Text, nullable=True)
    translated_text = Column(Text, nullable=True)
    detected_language = Column(String, nullable=True)
    possible_symptoms = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
