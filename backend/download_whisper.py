import os
import sys

from app.services.speech_to_text import _get_model

print("Triggering pre-download of Whisper medium model into the venv...")
model = _get_model()
print("Model path:", model)
print("Download completed!")
