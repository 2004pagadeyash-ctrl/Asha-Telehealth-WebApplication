from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class VoiceReportResponse(BaseModel):
    report_id: str
    patient_id: str
    audio_file_path: Optional[str] = None
    original_transcription: Optional[str] = None
    translated_text: Optional[str] = None
    detected_language: Optional[str] = None
    possible_symptoms: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True
