from __future__ import annotations
import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")

# FORCE SIMULATION MODE for demo/testing (Bypasses network errors)
_FAST2SMS_CONFIGURED = False


def send_sms(phone: str, message: str) -> bool:
    """
    Send a real SMS via Fast2SMS (Indian SMS gateway - any number, no pre-verification).
    Falls back to console simulation if API key is not configured.
    """

    # Strip +91 or 0 prefix if present; Fast2SMS needs 10-digit Indian number
    clean_phone = phone.strip()
    if clean_phone.startswith("+91"):
        clean_phone = clean_phone[3:]
    elif clean_phone.startswith("91") and len(clean_phone) == 12:
        clean_phone = clean_phone[2:]
    elif clean_phone.startswith("0"):
        clean_phone = clean_phone[1:]

    if _FAST2SMS_CONFIGURED:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {
                "route": "q",           # Quick Transactional route (OTP/alerts)
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": clean_phone
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            data = response.json()

            if data.get("return"):
                print(f"[SMS OK] Real SMS sent to {phone} via Fast2SMS")
                return True
            else:
                print(f"[SMS ERROR] Fast2SMS error: {data}")
                return False

        except Exception as e:
            print(f"[SMS ERROR] Fast2SMS exception: {e}")
            return False

    else:
        # Development fallback: log to console
        print(f"\n{'='*45}")
        print(f"[SMS SIMULATION] add FAST2SMS_API_KEY to .env for real SMS")
        print(f"Timestamp : {time.ctime()}")
        print(f"To        : {phone}")
        print(f"Message   : {message}")
        print(f"{'='*45}\n")
        return True
