from __future__ import annotations
from pydantic import BaseModel

class PhoneRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class LoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    patient_id: str

class EmailPasswordRequest(BaseModel):
    email: str
    password: str

class AdminLoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    role: str

class DoctorLoginResponse(BaseModel):
    message: str
    access_token: str
    token_type: str
    doctor_id: str
