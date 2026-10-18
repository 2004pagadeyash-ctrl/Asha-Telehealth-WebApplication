from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.asha_worker import AshaWorker
from app.schemas.asha_worker import AshaWorkerCreate, AshaWorkerResponse
from app.utils.id_generator import generate_id
from app.utils.jwt import create_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/asha", tags=["ASHA Workers"])


class AshaLoginRequest(BaseModel):
    phone: str


@router.post("/login")
def login_asha_worker(req: AshaLoginRequest, db: Session = Depends(get_db)):
    worker = db.query(AshaWorker).filter(AshaWorker.phone == req.phone).first()
    if not worker:
        raise HTTPException(status_code=404, detail="ASHA Worker not found with this phone number")
    token = create_access_token({"sub": worker.asha_id, "role": "asha"})
    return {
        "access_token": token,
        "asha_id": worker.asha_id,
        "full_name": worker.full_name,
        "village": worker.village,
        "district": worker.district
    }


@router.post("/register", response_model=AshaWorkerResponse, status_code=status.HTTP_201_CREATED)
def register_asha_worker(worker_in: AshaWorkerCreate, db: Session = Depends(get_db)):
    existing = db.query(AshaWorker).filter(AshaWorker.phone == worker_in.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="ASHA worker with this phone already exists")

    asha_id = generate_id(db, AshaWorker, "asha_id", "ASHA")
    db_worker = AshaWorker(**worker_in.dict(), asha_id=asha_id)
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker


@router.get("/", response_model=list[AshaWorkerResponse])
def get_all_asha_workers(db: Session = Depends(get_db)):
    return db.query(AshaWorker).all()


@router.get("/{asha_id}", response_model=AshaWorkerResponse)
def get_asha_worker(asha_id: str, db: Session = Depends(get_db)):
    worker = db.query(AshaWorker).filter(AshaWorker.asha_id == asha_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="ASHA worker not found")
    return worker
