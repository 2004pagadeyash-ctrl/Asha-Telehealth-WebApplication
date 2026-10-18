from __future__ import annotations
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.voice_report import VoiceReport
from app.models.patient import Patient
from app.schemas.voice_report import VoiceReportResponse
from app.utils.id_generator import generate_id
from app.services.speech_to_text import transcribe_audio, whisper_available
from app.services.symptom_extractor import extract_symptoms

router = APIRouter(prefix="/voice-report", tags=["Voice Symptom Reports"])

# ─── Upload directory ──────────────────────────────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "voice_reports")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=VoiceReportResponse, status_code=status.HTTP_201_CREATED)
async def upload_voice_report(
    patient_id: str = Form(...),
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a voice audio file containing symptom description.

    - Accepts: WAV, MP3, M4A, OGG, WEBM
    - Whisper automatically detects language and translates to English
    - Symptoms are extracted from the English transcription
    - If Whisper is not yet installed, file is saved and a placeholder is returned
    """
    # 1. Validate patient exists
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient '{patient_id}' not found")

    # 2. Generate report ID early so we can name the file with it
    report_id = generate_id(db, VoiceReport, "report_id", "VOICE")

    # 3. Save audio file
    allowed_ext = {".wav", ".mp3", ".m4a", ".ogg", ".webm", ".flac"}
    _, ext = os.path.splitext(audio_file.filename or ".wav")
    ext = ext.lower() if ext else ".wav"
    if ext not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(allowed_ext)}"
        )

    save_path = os.path.join(UPLOAD_DIR, f"{report_id}{ext}")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(audio_file.file, f)

    # 4. Run Whisper transcription
    original_transcription = None
    translated_text        = None
    detected_language      = None
    possible_symptoms      = []

    if whisper_available():
        try:
            result = transcribe_audio(save_path)
            original_transcription = result["original_transcription"]
            translated_text        = result["translated_text"]
            detected_language      = result["detected_language"]
            possible_symptoms      = extract_symptoms(translated_text)
            print(f"[VoiceReport] {report_id} | lang={detected_language} | symptoms={possible_symptoms}")
        except Exception as e:
            print(f"[VoiceReport] Whisper error: {e}")
            original_transcription = "Transcription failed"
            translated_text        = "Transcription failed"
    else:
        # Whisper still downloading / not yet available — save file, return placeholder
        print("[VoiceReport] Whisper not available — file saved, transcription pending")
        original_transcription = "[Whisper not available — transcription pending]"
        translated_text        = "[Whisper not available — transcription pending]"
        detected_language      = "unknown"

    # 5. Persist to database
    db_report = VoiceReport(
        report_id              = report_id,
        patient_id             = patient_id,
        audio_file_path        = save_path,
        original_transcription = original_transcription,
        translated_text        = translated_text,
        detected_language      = detected_language,
        possible_symptoms      = possible_symptoms,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return db_report


@router.get("/patient/{patient_id}", response_model=List[VoiceReportResponse])
def get_patient_voice_reports(patient_id: str, db: Session = Depends(get_db)):
    """Return all voice reports for a patient, newest first."""
    reports = (
        db.query(VoiceReport)
        .filter(VoiceReport.patient_id == patient_id)
        .order_by(VoiceReport.created_at.desc())
        .all()
    )
    if not reports:
        raise HTTPException(status_code=404, detail="No voice reports found for this patient")
    return reports


@router.get("/{report_id}", response_model=VoiceReportResponse)
def get_voice_report(report_id: str, db: Session = Depends(get_db)):
    """Return a single voice report by ID."""
    report = db.query(VoiceReport).filter(VoiceReport.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Voice report not found")
    return report
