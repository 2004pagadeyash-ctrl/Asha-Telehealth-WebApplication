from __future__ import annotations
from sqlalchemy import Column, Integer, String, Text, Float, Boolean
from app.core.database import Base


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medicine_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    manufacturer = Column(String, nullable=True)
    type = Column(String, nullable=True)
    price_per_unit = Column(Float, nullable=True)
    is_generic = Column(Boolean, default=False)
