from __future__ import annotations
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.patient import Patient
from app.schemas.auth import PhoneRequest, OTPVerify, LoginResponse
from app.utils.jwt import create_access_token
from app.utils.sms import send_sms

router = APIRouter(
    prefix="/auth/patient",
    tags=["patient auth"]
)

# Temporary in-memory OTP storage (for production, use Redis)
otp_store = {}


@router.post("/send-otp")
def send_otp(request: PhoneRequest):
    # Generate random 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Store OTP in dictionary
    otp_store[request.phone] = otp

    # Send real SMS via Fast2SMS (falls back to console simulation if not configured)
    message = f"Your AAROGYA TeleHealth OTP is: {otp}. Valid for 10 minutes. Do not share this with anyone."
    sms_sent = send_sms(request.phone, message)

    if sms_sent:
        # In production: do NOT return OTP in the response (security risk)
        # During development (simulation mode), return it so the frontend can autofill
        from app.utils.sms import _FAST2SMS_CONFIGURED
        response = {"message": "OTP sent successfully", "phone": request.phone}
        if not _FAST2SMS_CONFIGURED:
            # Dev mode: expose OTP so developer can test without a real phone
            response["otp"] = otp
        return response
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to send OTP via SMS. Please try again."
        )


@router.post("/verify-otp", response_model=LoginResponse)
def verify_otp(request: OTPVerify, db: Session = Depends(get_db)):
    # 1. Check if phone exists in OTP store
    if request.phone not in otp_store:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP not sent or expired")

    # 2. Check if OTP matches
    if otp_store[request.phone] != request.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    # 3. Query patients table using phone number
    patient = db.query(Patient).filter(Patient.phone == request.phone).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found. Please register first.")

    # 4. Generate JWT access token
    access_token = create_access_token(
        data={"patient_id": patient.patient_id, "phone": patient.phone}
    )

    # 5. Invalidate OTP after successful login
    del otp_store[request.phone]

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "patient_id": patient.patient_id
    }
