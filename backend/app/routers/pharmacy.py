from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.pharmacy import Pharmacy, PharmacyInventory
from app.models.medicine import Medicine
from app.schemas.pharmacy import (
    PharmacyCreate, PharmacyResponse,
    MedicineCreate, MedicineResponse,
    InventoryCreate, InventoryResponse
)
from app.utils.id_generator import generate_id

router = APIRouter(tags=["pharmacy & medicines"])


# ─── Pharmacy endpoints ────────────────────────────────────────────────────────

@router.post("/pharmacies/register", response_model=PharmacyResponse, status_code=status.HTTP_201_CREATED)
def register_pharmacy(pharmacy_in: PharmacyCreate, db: Session = Depends(get_db)):
    pharmacy_id = generate_id(db, Pharmacy, "pharmacy_id", "PHM")
    db_pharmacy = Pharmacy(**pharmacy_in.dict(), pharmacy_id=pharmacy_id)
    db.add(db_pharmacy)
    db.commit()
    db.refresh(db_pharmacy)
    return db_pharmacy


@router.get("/pharmacies", response_model=list[PharmacyResponse])
def get_all_pharmacies(db: Session = Depends(get_db)):
    return db.query(Pharmacy).all()


@router.get("/pharmacies/nearby", response_model=list[PharmacyResponse])
def get_nearby_pharmacies(district: Optional[str] = Query(None), state: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Pharmacy)
    if district:
        query = query.filter(Pharmacy.district.ilike(f"%{district}%"))
    if state:
        query = query.filter(Pharmacy.state.ilike(f"%{state}%"))
    results = query.all()
    if not results:
        raise HTTPException(status_code=404, detail="No pharmacies found in this area")
    return results


# ─── Medicine endpoints ────────────────────────────────────────────────────────

@router.post("/medicines/add", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def add_medicine(med_in: MedicineCreate, db: Session = Depends(get_db)):
    existing = db.query(Medicine).filter(Medicine.name.ilike(med_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Medicine already exists")
    medicine_id = generate_id(db, Medicine, "medicine_id", "MED")
    db_medicine = Medicine(**med_in.dict(), medicine_id=medicine_id)
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine


@router.get("/medicines", response_model=list[MedicineResponse])
def get_all_medicines(db: Session = Depends(get_db)):
    return db.query(Medicine).all()


@router.get("/medicines/search", response_model=list[MedicineResponse])
def search_medicines(name: str = Query(..., description="Medicine name to search"), db: Session = Depends(get_db)):
    results = db.query(Medicine).filter(Medicine.name.ilike(f"%{name}%")).all()
    if not results:
        raise HTTPException(status_code=404, detail="No medicines found matching the query")
    return results


@router.get("/medicines/availability/{medicine_name}")
def check_medicine_availability(medicine_name: str, db: Session = Depends(get_db)):
    medicine = db.query(Medicine).filter(Medicine.name.ilike(f"%{medicine_name}%")).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    inventory_items = (
        db.query(PharmacyInventory, Pharmacy)
        .join(Pharmacy, PharmacyInventory.pharmacy_id == Pharmacy.pharmacy_id)
        .filter(PharmacyInventory.medicine_id == medicine.medicine_id)
        .filter(PharmacyInventory.stock_quantity > 0)
        .all()
    )

    available_at = [
        {"pharmacy": pharmacy.name, "district": pharmacy.district, "stock": inv.stock_quantity}
        for inv, pharmacy in inventory_items
    ]

    return {
        "medicine": medicine.name,
        "available_at": available_at if available_at else "Not available at any pharmacy right now"
    }


# ─── Inventory endpoint ────────────────────────────────────────────────────────

@router.post("/pharmacies/inventory/update", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def update_inventory(inv_in: InventoryCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(PharmacyInventory)
        .filter_by(pharmacy_id=inv_in.pharmacy_id, medicine_id=inv_in.medicine_id)
        .first()
    )
    if existing:
        existing.stock_quantity = inv_in.stock_quantity
        db.commit()
        db.refresh(existing)
        return existing

    db_inv = PharmacyInventory(**inv_in.dict())
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv
