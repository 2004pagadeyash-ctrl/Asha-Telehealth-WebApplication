from app.core.database import SessionLocal
from app.services.risk_engine import calculate_risk_score
from app.models.patient import Patient

db = SessionLocal()
print("Starting debug run...")
try:
    patients = db.query(Patient).all()
    for p in patients:
        print("Checking", p.patient_id)
        res = calculate_risk_score(p.patient_id, db)
        print("Result:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
