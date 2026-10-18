from __future__ import annotations
from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import EmailPasswordRequest, AdminLoginResponse
from app.core.config import settings
from app.utils.security import verify_password
from app.utils.jwt import create_access_token
from datetime import timedelta

router = APIRouter(prefix="/auth/admin", tags=["Admin Auth"])

@router.post("/login", response_model=AdminLoginResponse)
def admin_login(creds: EmailPasswordRequest):
    if creds.email != settings.ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )
    
    if not verify_password(creds.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": creds.email, "role": "admin"},
        expires_delta=access_token_expires
    )
    
    return {
        "message": "Admin login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "role": "admin"
    }
