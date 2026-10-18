import sys
import time
import json
import threading
import requests
import uvicorn
from app.main import app

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


PORT = 8008
BASE = f"http://127.0.0.1:{PORT}"
TS = str(int(time.time()))[-6:]

results = []
failures = []

def log_test(label, ok, status, detail=""):
    results.append(ok)
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] [{status}] {label}")
    if not ok:
        failures.append(label)
        if detail:
            print(f"         DETAIL: {detail}")

def check(label, resp, expected_status, expected_key=None):
    status = resp.status_code
    ok = (status == expected_status)
    try:
        data = resp.json()
    except Exception:
        data = {"text": resp.text}
    if ok and expected_key:
        ok = (expected_key in data)
    log_test(label, ok, status, str(data)[:200] if not ok else "")
    return data

def run_tests():
    global results, failures
    print("\n" + "="*70)
    print("      [+] AAROGYA TELEHEALTH - FULL AUTOMATED TEST SUITE")
    print("="*70)

    # 1. Health Check
    print("\n--- 1. HEALTH CHECK ---")
    r = requests.get(f"{BASE}/")
    check("GET / (Health Check)", r, 200, "status")

    # 2. Patient Module
    print("\n--- 2. PATIENT MODULE ---")
    phone_pat = f"99{TS}"
    r = requests.post(f"{BASE}/patients/register", json={
        "full_name": f"Patient Alpha {TS}",
        "age": 42, "gender": "Female",
        "phone": phone_pat,
        "village": "Rampur", "district": "Patiala", "state": "Punjab",
        "pincode": "147001", "blood_group": "A+",
        "existing_conditions": ["Asthma"],
        "allergies": ["Sulfa"],
        "current_medications": ["Inhaler"],
        "emergency_contact_name": "Kin", "emergency_contact_phone": f"98{TS}",
        "preferred_language": "Hindi"
    })
    pat_data = check("POST /patients/register", r, 201, "patient_id")
    patient_id = pat_data.get("patient_id")
    print(f"         Registered: {patient_id}")

    # Duplicate check
    r_dup = requests.post(f"{BASE}/patients/register", json={
        "full_name": "Dup Patient", "age": 30, "gender": "Male", "phone": phone_pat
    })
    check("POST /patients/register (duplicate -> 400)", r_dup, 400)


    # Get All Patients
    r_all_pat = requests.get(f"{BASE}/patients/")
    check("GET /patients/ (List all registered patients)", r_all_pat, 200)

    # Get Patient by ID
    r_single_pat = requests.get(f"{BASE}/patients/{patient_id}")
    check(f"GET /patients/{patient_id} (Fetch patient by ID)", r_single_pat, 200, "full_name")

    # 3. Patient Auth
    print("\n--- 3. PATIENT AUTH ---")
    r_otp = requests.post(f"{BASE}/auth/patient/send-otp", json={"phone": phone_pat})
    check("POST /auth/patient/send-otp", r_otp, 200, "message")

    r_wrong_otp = requests.post(f"{BASE}/auth/patient/verify-otp", json={"phone": phone_pat, "otp": "000000"})
    check("POST /auth/patient/verify-otp (wrong OTP -> 400)", r_wrong_otp, 400)

    r_me_unauth = requests.get(f"{BASE}/patients/me", headers={"Authorization": "Bearer invalid_token"})
    check("GET /patients/me (invalid token -> 401)", r_me_unauth, 401)

    # 4. Admin Auth
    print("\n--- 4. ADMIN AUTH ---")
    r_admin = requests.post(f"{BASE}/auth/admin/login", json={
        "email": "admin@admin.com",
        "password": "123456"
    })
    admin_data = check("POST /auth/admin/login", r_admin, 200, "access_token")
    admin_token = admin_data.get("access_token", "")


    # 5. Doctor Module
    print("\n--- 5. DOCTOR MODULE ---")
    phone_doc = f"91{TS}"
    doc_email = f"dr{TS}@telehealth.org"
    r_doc_reg = requests.post(f"{BASE}/doctors/register", json={
        "full_name": f"Dr. Vikram {TS}",
        "specialization": "Cardiology",
        "hospital_name": "District Civil Hospital",
        "hospital_address": "Main Road",
        "phone": phone_doc,
        "email": doc_email,
        "password": "DocSecretPassword123!",
        "experience_years": 12,
        "consultation_fee": 250,
        "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "available_time_slots": ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
    })
    doc_data = check("POST /doctors/register", r_doc_reg, 201, "doctor_id")
    doctor_id = doc_data.get("doctor_id")
    print(f"         Registered: {doctor_id}")

    r_docs = requests.get(f"{BASE}/doctors/")
    check("GET /doctors/ (List all doctors)", r_docs, 200)

    r_doc_id = requests.get(f"{BASE}/doctors/{doctor_id}")
    check(f"GET /doctors/{doctor_id}", r_doc_id, 200, "full_name")

    r_doc_spec = requests.get(f"{BASE}/doctors/specialization/Cardiology")
    check("GET /doctors/specialization/Cardiology", r_doc_spec, 200)

    r_doc_login = requests.post(f"{BASE}/auth/doctor/login", json={
        "email": doc_email,
        "password": "DocSecretPassword123!"
    })
    doc_auth = check("POST /auth/doctor/login", r_doc_login, 200, "access_token")
    doc_token = doc_auth.get("access_token", "")

    r_doc_me = requests.get(f"{BASE}/doctors/me", headers={"Authorization": f"Bearer {doc_token}"})
    check("GET /doctors/me (Doctor JWT Profile)", r_doc_me, 200, "doctor_id")

    # 6. Doctor Availability Schedule
    print("\n--- 6. DOCTOR AVAILABILITY SCHEDULE & BOOKING ---")
    r_sched = requests.get(f"{BASE}/doctors/{doctor_id}/availability-schedule")
    sched_data = check(f"GET /doctors/{doctor_id}/availability-schedule", r_sched, 200, "available_days")
    print(f"         Working days: {sched_data.get('available_days')}")
    print(f"         Daily slots: {sched_data.get('available_time_slots')}")
    print(f"         Current booked slots count: {len(sched_data.get('booked_slots', []))}")

    # Book an appointment
    appt_date = "2026-11-05"
    appt_time = "10:00 AM"
    r_book = requests.post(f"{BASE}/appointments/book", json={
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "symptoms": "Chest tightness and fatigue",
        "consultation_type": "video",
        "appointment_date": appt_date,
        "appointment_time": appt_time,
        "is_low_cost_request": True
    })
    appt_data = check("POST /appointments/book", r_book, 201, "appointment_id")
    appt_id = appt_data.get("appointment_id")
    print(f"         Booked: {appt_id}")

    # Verify that availability schedule now reflects the booked slot!
    r_sched_after = requests.get(f"{BASE}/doctors/{doctor_id}/availability-schedule")
    sched_after = check("GET /doctors/{id}/availability-schedule (Verify booked slot appears)", r_sched_after, 200)
    has_slot = any(b.get("date") == appt_date and b.get("time") == appt_time for b in sched_after.get("booked_slots", []))
    log_test("VERIFY booked slot tracked in availability schedule", has_slot, 200)

    # Patient appointments
    r_pat_appts = requests.get(f"{BASE}/appointments/patient/{patient_id}")
    check(f"GET /appointments/patient/{patient_id}", r_pat_appts, 200)

    # Doctor appointments
    r_doc_appts = requests.get(f"{BASE}/appointments/doctor/{doctor_id}")
    check(f"GET /appointments/doctor/{doctor_id}", r_doc_appts, 200)

    # Update appointment status
    r_status = requests.patch(f"{BASE}/appointments/{appt_id}/status", json={"status": "confirmed"})
    check(f"PATCH /appointments/{appt_id}/status (confirmed)", r_status, 200, "status")

    # 7. ASHA Worker Module
    print("\n--- 7. ASHA WORKER MODULE ---")
    phone_asha = f"92{TS}"
    r_asha_reg = requests.post(f"{BASE}/asha/register", json={
        "full_name": f"Sunita Devi {TS}",
        "phone": phone_asha,
        "village": "Rampur",
        "district": "Patiala",
        "state": "Punjab",
        "assigned_population": 850,
        "years_experience": 5
    })
    asha_data = check("POST /asha/register", r_asha_reg, 201, "asha_id")
    asha_id = asha_data.get("asha_id")

    r_ashas = requests.get(f"{BASE}/asha/")
    check("GET /asha/ (List all ASHA workers)", r_ashas, 200)

    r_asha_single = requests.get(f"{BASE}/asha/{asha_id}")
    check(f"GET /asha/{asha_id}", r_asha_single, 200, "full_name")

    r_asha_login = requests.post(f"{BASE}/asha/login", json={"phone": phone_asha})
    check("POST /asha/login", r_asha_login, 200, "asha_id")

    # 8. Vitals Module
    print("\n--- 8. VITALS MODULE ---")
    r_vitals = requests.post(f"{BASE}/vitals/add", json={
        "patient_id": patient_id,
        "asha_id": asha_id,
        "assigned_doctor_id": doctor_id,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "heart_rate": 74,
        "spo2": 99,
        "temperature": 36.8,
        "blood_sugar": 98,
        "weight": 65,
        "height": 165
    })
    vit_res = check("POST /vitals/add (Normal vitals)", r_vitals, 201, "vitals")

    r_pat_vit = requests.get(f"{BASE}/vitals/patient/{patient_id}")
    check(f"GET /vitals/patient/{patient_id}", r_pat_vit, 200)

    r_latest_vit = requests.get(f"{BASE}/vitals/latest/{patient_id}")
    check(f"GET /vitals/latest/{patient_id}", r_latest_vit, 200, "vitals")

    r_doc_vit = requests.get(f"{BASE}/vitals/doctor/{doctor_id}")
    check(f"GET /vitals/doctor/{doctor_id}", r_doc_vit, 200)

    # 9. Medical Records Module
    print("\n--- 9. MEDICAL RECORDS MODULE ---")
    r_rec = requests.post(f"{BASE}/records/create", json={
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "diagnosis": "Mild Bronchial Spasm",
        "prescription": ["Levocetirizine 5mg 0-0-1", "Salbutamol Inhaler 2 puffs PRN"],
        "notes": "Patient advised steam inhalation and review in 1 week."
    })
    rec_data = check("POST /records/create", r_rec, 201, "record_id")
    record_id = rec_data.get("record_id")

    r_pat_recs = requests.get(f"{BASE}/records/patient/{patient_id}")
    check(f"GET /records/patient/{patient_id}", r_pat_recs, 200)

    r_rec_id = requests.get(f"{BASE}/records/{record_id}")
    check(f"GET /records/{record_id}", r_rec_id, 200, "diagnosis")

    # 10. Pharmacy & Medicine Module
    print("\n--- 10. PHARMACY & MEDICINE MODULE ---")
    r_pharm_reg = requests.post(f"{BASE}/pharmacies/register", json={
        "name": f"Aarogya Jan Aushadhi Kendra {TS}",
        "address": "Opposite Civil Hospital",
        "village": "Rampur",
        "district": "Patiala",
        "state": "Punjab",
        "phone": f"93{TS}",
        "latitude": 30.34,
        "longitude": 76.38
    })
    pharm_data = check("POST /pharmacies/register", r_pharm_reg, 201, "pharmacy_id")
    pharmacy_id = pharm_data.get("pharmacy_id")

    r_pharms = requests.get(f"{BASE}/pharmacies")
    check("GET /pharmacies (List all pharmacies)", r_pharms, 200)

    r_nearby = requests.get(f"{BASE}/pharmacies/nearby?district=Patiala")
    check("GET /pharmacies/nearby?district=Patiala", r_nearby, 200)

    # Add Medicine
    med_name = f"Paracetamol_{TS}"
    r_med_add = requests.post(f"{BASE}/medicines/add", json={
        "name": med_name,
        "description": "Analgesic and Antipyretic",
        "manufacturer": "Cipla",
        "type": "Tablet",
        "price_per_unit": 1.5,
        "is_generic": True
    })
    med_data = check("POST /medicines/add", r_med_add, 201, "medicine_id")
    med_id = med_data.get("medicine_id")

    r_meds = requests.get(f"{BASE}/medicines")
    check("GET /medicines (List all medicines)", r_meds, 200)

    r_med_search = requests.get(f"{BASE}/medicines/search?name={med_name}")
    check(f"GET /medicines/search?name={med_name}", r_med_search, 200)

    # Update Inventory
    r_inv = requests.post(f"{BASE}/pharmacies/inventory/update", json={
        "pharmacy_id": pharmacy_id,
        "medicine_id": med_id,
        "stock_quantity": 500
    })
    check("POST /pharmacies/inventory/update", r_inv, 201, "stock_quantity")

    # Check Medicine Availability across Pharmacies
    r_avail = requests.get(f"{BASE}/medicines/availability/{med_name}")
    check(f"GET /medicines/availability/{med_name}", r_avail, 200, "available_at")

    # 11. AI Modules
    print("\n--- 11. AI MODULES ---")
    r_symptom = requests.post(f"{BASE}/ai/symptom-check", json={
        "symptoms": "high fever, severe body ache, chills"
    })
    check("POST /ai/symptom-check", r_symptom, 200, "possible_conditions")

    r_risk = requests.post(f"{BASE}/ai/patient-risk", json={
        "patient_id": patient_id
    })
    check("POST /ai/patient-risk", r_risk, 200, "risk_level")

    r_alerts = requests.get(f"{BASE}/alerts/high-risk-patients")
    check("GET /alerts/high-risk-patients", r_alerts, 200)

    # 12. Payments Module
    print("\n--- 12. PAYMENTS MODULE ---")
    r_order = requests.post(f"{BASE}/payments/create-order", json={
        "amount": 25000,
        "currency": "INR",
        "receipt": f"rcpt_{TS}"
    })
    check("POST /payments/create-order", r_order, 200, "order_id")

    # 13. Offline Sync Module
    print("\n--- 13. OFFLINE SYNC MODULE ---")
    r_sync = requests.post(f"{BASE}/sync/patient-records", json={
        "records": [{
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "diagnosis": "Offline Field Consult",
            "prescription": ["Cetirizine 10mg"],
            "notes": "Logged while offline in remote village",
            "consultation_date": "2026-10-10T12:00:00"
        }]
    })
    check("POST /sync/patient-records (Batch sync)", r_sync, 200, "records_synced")

    # 14. Cleanup / Cancellation
    print("\n--- 14. APPOINTMENT CANCELLATION ---")
    r_del = requests.delete(f"{BASE}/appointments/{appt_id}")
    check(f"DELETE /appointments/{appt_id}", r_del, 200)

    # Final summary
    total = len(results)
    passed = sum(1 for r in results if r)
    failed = sum(1 for r in results if not r)

    print("\n" + "="*70)
    print(f"  [RESULT] TEST SUITE COMPLETED: {total} TOTAL CHECKS")
    print(f"  [+] PASSED: {passed}")
    print(f"  [-] FAILED: {failed}")
    print("="*70)

    if failures:
        print("\n  Failures encountered:")
        for f in failures:
            print(f"    - {f}")
        return False
    else:
        print("\n  [SUCCESS] 100% OF ALL SYSTEM FUNCTIONS AND ENDPOINTS PASSED!")
        return True


if __name__ == "__main__":
    # Start server in thread
    config = uvicorn.Config(app=app, host="127.0.0.1", port=PORT, log_level="error")
    server = uvicorn.Server(config)
    th = threading.Thread(target=server.run, daemon=True)
    th.start()

    # Wait for server ready
    ready = False
    for _ in range(30):
        try:
            r = requests.get(f"{BASE}/", timeout=1)
            if r.status_code == 200:
                ready = True
                break
        except Exception:
            time.sleep(0.2)

    if not ready:
        print("ERROR: Could not connect to test server")
        sys.exit(1)

    try:
        success = run_tests()
    finally:
        server.should_exit = True
        th.join(timeout=2)

    sys.exit(0 if success else 1)
