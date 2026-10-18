from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PharmacyCreate(BaseModel):
    name: str
    address: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PharmacyResponse(PharmacyCreate):
    pharmacy_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryCreate(BaseModel):
    pharmacy_id: str
    medicine_id: str
    stock_quantity: int


class InventoryResponse(InventoryCreate):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


class MedicineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    type: Optional[str] = None
    price_per_unit: Optional[float] = None
    is_generic: Optional[bool] = False


class MedicineResponse(MedicineCreate):
    medicine_id: str

    class Config:
        from_attributes = True
