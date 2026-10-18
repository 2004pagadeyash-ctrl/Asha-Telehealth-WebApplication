from __future__ import annotations
"""
Speech-to-Text Service using OpenAI Whisper (local model).

Model: "medium"   — better accuracy, slightly slower
Task:  "translate" — converts ANY language speech directly into English text

This means:
  Hindi speech  → English text (direct translation by Whisper)
  English speech → English text (passthrough)
  Any language → English text

No internet required after model download.
"""
import os
from typing import Optional

# Lazy-load Whisper to avoid slow startup on every request
_model = None
_whisper_available = False

try:
    import whisper as _whisper_lib
    _whisper_available = True
except ImportError:
    _whisper_available = False


def _get_model():
    """Load Whisper model once and cache it (singleton)."""
    global _model
    if _model is None:
        if not _whisper_available:
            raise RuntimeError("Whisper is not installed. Run: pip install openai-whisper")
        print("[Whisper] Loading 'medium' model (first-time download may take a moment)...")
        # Ensure it downloads into the venv folder instead of user cache
        download_root = os.path.join(os.path.dirname(__file__), "..", "..", "venv", "whisper_models")
        os.makedirs(download_root, exist_ok=True)
        _model = _whisper_lib.load_model("medium", download_root=download_root)
        print("[Whisper] Model loaded successfully.")
    return _model


def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe an audio file using Whisper.

    Returns a dict with:
        original_transcription : str  — text in the detected language
        translated_text        : str  — text in English (via Whisper translate task)
        detected_language      : str  — ISO language code, e.g. "hi", "en"
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model = _get_model()

    # Task "translate" → always outputs English
    result = model.transcribe(audio_path, task="translate")
    translated_text    = result.get("text", "").strip()
    detected_language  = result.get("language", "unknown")

    # For original transcription (in native language), run transcription task
    original_result    = model.transcribe(audio_path, task="transcribe")
    original_text      = original_result.get("text", "").strip()

    return {
        "original_transcription": original_text,
        "translated_text": translated_text,
        "detected_language": detected_language,
    }


def whisper_available() -> bool:
    return _whisper_available
