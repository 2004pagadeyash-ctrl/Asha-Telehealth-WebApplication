from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.doctor import Doctor
from app.schemas.auth import EmailPasswordRequest, DoctorLoginResponse
from app.utils.security import verify_password
from app.utils.jwt import create_access_token
from app.core.config import settings
from datetime import timedelta

router = APIRouter(prefix="/auth/doctor", tags=["Doctor Auth"])

@router.post("/login", response_model=DoctorLoginResponse)
def login_doctor(creds: EmailPasswordRequest, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.email == creds.email).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not verify_password(creds.password, doctor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": doctor.doctor_id, "role": "doctor"},
        expires_delta=access_token_expires
    )
    
    return {
        "message": "Doctor login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "doctor_id": doctor.doctor_id
    }
