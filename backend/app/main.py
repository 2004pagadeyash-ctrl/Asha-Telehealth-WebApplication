from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app import models
from app.routers import patient, patient_auth, doctor, appointment, record, pharmacy, ai, sync, asha, vitals, voice_reports, admin_auth, doctor_auth, ai_risk, payments

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup on shutdown (if any)

app = FastAPI(
    title="AAROGYA — Rural TeleHealth Platform",
    description="AI-powered healthcare backend connecting rural India to quality medical care.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient.router)
app.include_router(patient_auth.router)
app.include_router(admin_auth.router)
app.include_router(doctor_auth.router)
app.include_router(doctor.router)
app.include_router(appointment.router)
app.include_router(record.router)
app.include_router(pharmacy.router)
app.include_router(ai.router)
app.include_router(sync.router)
app.include_router(asha.router)
app.include_router(vitals.router)
app.include_router(voice_reports.router)
app.include_router(ai_risk.router)
app.include_router(payments.router)

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)

@app.get("/", tags=["health"])
def root():
    return {"message": "AAROGYA Backend is running 🏥", "status": "ok"}