from sqlalchemy.schema import CreateTable
from app.core.database import engine, Base

# Import all models so they are registered with Base.metadata
from app.models import (
    user, doctor, patient, record, medicine, 
    voice_report, patient_vitals, pharmacy, 
    appointment, asha_worker
)

with open("schema.sql", "w") as f:
    for table in Base.metadata.sorted_tables:
        f.write(str(CreateTable(table).compile(engine)) + ";\n\n")
