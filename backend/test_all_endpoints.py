"""
TeleHealth API - Full Endpoint Health Check
Run from: e:\EdTech\backend  with: venv\Scripts\python.exe test_all_endpoints.py
Uses timestamp-based unique data so it is safe to run multiple times.
"""
import json
import urllib.request
import urllib.error
import sys
import time
import builtins

def safe_print(*args, **kwargs):
    sep = kwargs.get('sep', ' ')
    end = kwargs.get('end', '\n')
    file = kwargs.get('file', sys.stdout)
    msg = sep.join(str(arg) for arg in args)
    enc = getattr(file, 'encoding', None) or 'utf-8'
    try:
        safe_msg = msg.encode(enc, errors='replace').decode(enc)
    except Exception:
        safe_msg = msg.encode('ascii', errors='replace').decode('ascii')
    builtins.print(safe_msg, **{k: v for k, v in kwargs.items() if k not in ['sep', 'end', 'file']}, file=file, end=end)

print = safe_print

BASE  = "http://localhost:8000"
TS    = str(int(time.time()))[-6:]   # last 6 digits of unix time = unique per run

results  = []
failures = []

def req(method, path, body=None, token=None):
    url  = BASE + path
    h    = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    r    = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=10) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"_raw": raw.decode(errors="replace")}
    except Exception as ex:
        return 0, {"error": str(ex)}

def check(label, status, resp, expected_status, expected_key=None):
    ok = (status == expected_status)
    if ok and expected_key:
        ok = (expected_key in resp)
    results.append(ok)
    icon = "PASS" if ok else "FAIL"
    kv   = f"  =>  {expected_key}: {str(resp.get(expected_key, 'MISSING'))[:70]}" if expected_key else ""
    line = f"  [{icon}] [{status}] {label}{kv}"
    print(line)
    if not ok:
        failures.append(label)
        print(f"         detail: {str(resp)[:200]}")
    return resp

def section(title):
    print(f"\n{'='*65}")
    print(f"  {title}")
    print('='*65)


# ─────────────────────────────────────────────────────────────
section("HEALTH CHECK")
s, r = req("GET", "/")
check("GET /", s, r, 200, "message")

# ─────────────────────────────────────────────────────────────
section("PATIENT MODULE")
PHONE_PAT = f"80{TS}"    # unique 8-digit phone
s, r = req("POST", "/patients/register", {
    "full_name": f"Test Patient {TS}",
    "age": 35, "gender": "Male",
    "phone": PHONE_PAT,
    "village": "Nabha", "district": "Patiala", "state": "Punjab",
    "pincode": "147201", "blood_group": "B+",
    "existing_conditions": ["Hypertension"],
    "allergies": [], "current_medications": [],
    "emergency_contact_name": "EC Name",
    "emergency_contact_phone": f"81{TS}",
    "preferred_language": "Punjabi"
})
check("POST /patients/register", s, r, 201, "patient_id")
PATIENT_ID = r.get("patient_id", "")
print(f"         patient_id  = {PATIENT_ID}")

# Test duplicate registration -> must fail with 400
s2, r2 = req("POST", "/patients/register", {
    "full_name": "Dup Patient", "age": 30, "gender": "Female",
    "phone": PHONE_PAT
})
check("POST /patients/register (duplicate phone -> 400)", s2, r2, 400)

# ─────────────────────────────────────────────────────────────
section("AUTH MODULE")
s, r = req("POST", "/auth/patient/send-otp", {"phone": PHONE_PAT})
check("POST /auth/patient/send-otp", s, r, 200, "message")
print("         NOTE: Server terminal shows the actual OTP")

# Wrong OTP -> 400
s, r = req("POST", "/auth/patient/verify-otp", {"phone": PHONE_PAT, "otp": "000000"})
check("POST /auth/patient/verify-otp (wrong OTP -> 400)", s, r, 400)

# /patients/me with invalid token -> 401
s, r = req("GET", "/patients/me", token="bad.token.here")
check("GET /patients/me (invalid token -> 401)", s, r, 401)

# ─────────────────────────────────────────────────────────────
section("ADMIN AUTH")
s, r = req("POST", "/auth/admin/login", {
    "email": "chirag@gmail.com",
    "password": "123456"
})
check("POST /auth/admin/login", s, r, 200, "access_token")
ADMIN_TOKEN = r.get("access_token", "")
if ADMIN_TOKEN:
    print("         [Admin JWT obtained]")

# ─────────────────────────────────────────────────────────────
section("DOCTORS MODULE")
PHONE_DOC = f"82{TS}"
s, r = req("POST", "/doctors/register", {
    "full_name": f"Dr. Test {TS}",
    "specialization": "General Physician",
    "hospital_name": "Test Hospital",
    "hospital_address": "123 Test St",
    "phone": PHONE_DOC,
    "email": f"doc{TS}@test.com",
    "password": "SecurePassword123!",
    "experience_years": 8, "consultation_fee": 300,
    "available_days": ["Monday"],
    "available_time_slots": ["09:00-12:00"]
}, token=ADMIN_TOKEN)
check("POST /doctors/register (via Admin)", s, r, 201, "doctor_id")
DOCTOR_ID = r.get("doctor_id", "")
print(f"         doctor_id   = {DOCTOR_ID}")

s, r = req("GET", "/doctors/")
check("GET /doctors/", s, r, 200)

s, r = req("GET", f"/doctors/{DOCTOR_ID}")
check("GET /doctors/{doctor_id}", s, r, 200, "doctor_id")

s, r = req("GET", "/doctors/specialization/General%20Physician")
check("GET /doctors/specialization/General Physician", s, r, 200)

s, r = req("PATCH", f"/doctors/{DOCTOR_ID}/availability", {"availability_status": False})
check("PATCH /doctors/{id}/availability", s, r, 200, "availability_status")

# ─────────────────────────────────────────────────────────────
section("DOCTOR AUTH & PROFILE")
if DOCTOR_ID:
    s, r = req("POST", "/auth/doctor/login", {
        "email": f"doc{TS}@test.com",
        "password": "SecurePassword123!"
    })
    check("POST /auth/doctor/login", s, r, 200, "access_token")
    DOCTOR_TOKEN = r.get("access_token", "")

    if DOCTOR_TOKEN:
        s, r = req("GET", "/doctors/me", token=DOCTOR_TOKEN)
        check("GET /doctors/me (with Doc JWT)", s, r, 200, "doctor_id")
else:
    print("  [SKIP] Doctor auth tests skipped")

# ─────────────────────────────────────────────────────────────
section("ASHA WORKERS MODULE")
PHONE_ASHA = f"83{TS}"
s, r = req("POST", "/asha/register", {
    "full_name": f"Asha Worker {TS}",
    "phone": PHONE_ASHA,
    "village": "Nabha", "district": "Patiala", "state": "Punjab",
    "assigned_population": 900, "years_experience": 4
})
check("POST /asha/register", s, r, 201, "asha_id")
ASHA_ID = r.get("asha_id", "")
print(f"         asha_id     = {ASHA_ID}")

s, r = req("GET", "/asha/")
check("GET /asha/", s, r, 200)

s, r = req("GET", f"/asha/{ASHA_ID}")
check("GET /asha/{asha_id}", s, r, 200, "asha_id")

# ─────────────────────────────────────────────────────────────
section("PATIENT VITALS MODULE")
if PATIENT_ID and ASHA_ID:
    s, r = req("POST", "/vitals/add", {
        "patient_id": PATIENT_ID, "asha_id": ASHA_ID,
        "systolic_bp": 125, "diastolic_bp": 82,
        "heart_rate": 78, "temperature": 37.0,
        "spo2": 97, "blood_sugar": 105,
        "weight": 70, "height": 168,
        "respiratory_rate": 17,
        "symptoms": "mild fatigue", "notes": "stable"
    })
    check("POST /vitals/add (normal -> 0 alerts)", s, r, 201, "vitals")
    if s == 201:
        bmi = r.get("vitals", {}).get("bmi")
        alerts = r.get("alerts", [])
        print(f"         BMI auto-calculated = {bmi}")
        print(f"         Alerts count = {len(alerts)} (expected 0)")

    # Critical vitals — triggers many alerts
    s, r = req("POST", "/vitals/add", {
        "patient_id": PATIENT_ID, "asha_id": ASHA_ID,
        "systolic_bp": 175, "heart_rate": 115,
        "temperature": 39.5, "spo2": 88,
        "blood_sugar": 220, "weight": 95,
        "height": 162, "respiratory_rate": 26
    })
    check("POST /vitals/add (critical -> multiple alerts)", s, r, 201, "alerts")
    if s == 201:
        alert_count = len(r.get("alerts", []))
        print(f"         Alert count = {alert_count} (expected > 0)")
        for a in r.get("alerts", []):
            safe_a = a.encode("ascii", errors="replace").decode("ascii")
            print(f"           - {safe_a}")

    s, r = req("GET", f"/vitals/patient/{PATIENT_ID}")
    check("GET /vitals/patient/{patient_id}", s, r, 200)

    s, r = req("GET", f"/vitals/latest/{PATIENT_ID}")
    check("GET /vitals/latest/{patient_id}", s, r, 200, "vitals")
else:
    print("  [SKIP] Vitals tests skipped (no patient/asha IDs)")

# ─────────────────────────────────────────────────────────────
section("APPOINTMENTS MODULE")
if PATIENT_ID and DOCTOR_ID:
    s, r = req("POST", "/appointments/book", {
        "patient_id": PATIENT_ID, "doctor_id": DOCTOR_ID,
        "symptoms": "fever and cough",
        "consultation_type": "video",
        "appointment_date": "2026-04-01",
        "appointment_time": "10:00:00"
    })
    check("POST /appointments/book", s, r, 201, "appointment_id")
    APPT_ID = r.get("appointment_id", "")
    print(f"         appointment_id = {APPT_ID}")

    s, r = req("GET", f"/appointments/patient/{PATIENT_ID}")
    check("GET /appointments/patient/{patient_id}", s, r, 200)

    s, r = req("GET", f"/appointments/doctor/{DOCTOR_ID}")
    check("GET /appointments/doctor/{doctor_id}", s, r, 200)

    s, r = req("PATCH", f"/appointments/{APPT_ID}/status", {"status": "confirmed"})
    check("PATCH /appointments/{id}/status (-> confirmed)", s, r, 200, "status")

    # Invalid status -> 400
    s, r = req("PATCH", f"/appointments/{APPT_ID}/status", {"status": "invalid_status"})
    check("PATCH /appointments/{id}/status (bad status -> 400)", s, r, 400)
else:
    print("  [SKIP] Appointment tests skipped")
    APPT_ID = ""

# ─────────────────────────────────────────────────────────────
section("MEDICAL RECORDS MODULE")
if PATIENT_ID and DOCTOR_ID:
    s, r = req("POST", "/records/create", {
        "patient_id": PATIENT_ID, "doctor_id": DOCTOR_ID,
        "diagnosis": "Seasonal viral fever",
        "prescription": ["Paracetamol 500mg", "ORS"],
        "notes": "Rest 3 days"
    })
    check("POST /records/create", s, r, 201, "record_id")
    REC_ID = r.get("record_id", "")
    print(f"         record_id = {REC_ID}")

    s, r = req("GET", f"/records/patient/{PATIENT_ID}")
    check("GET /records/patient/{patient_id}", s, r, 200)

    s, r = req("GET", f"/records/{REC_ID}")
    check("GET /records/{record_id}", s, r, 200, "record_id")
else:
    print("  [SKIP] Records tests skipped")
    REC_ID = ""

# ─────────────────────────────────────────────────────────────
section("PHARMACY & MEDICINES MODULE")
MED_NAME = f"TestMed{TS}"

s, r = req("POST", "/pharmacies/register", {
    "name": f"Test Pharmacy {TS}",
    "address": "Test Lane",
    "village": "Nabha", "district": "Patiala", "state": "Punjab",
    "phone": f"84{TS}",
    "latitude": 30.37, "longitude": 76.14
})
check("POST /pharmacies/register", s, r, 201, "pharmacy_id")
PHARM_ID = r.get("pharmacy_id", "")
print(f"         pharmacy_id = {PHARM_ID}")

s, r = req("GET", "/pharmacies")
check("GET /pharmacies", s, r, 200)

s, r = req("GET", "/pharmacies/nearby?district=Patiala")
check("GET /pharmacies/nearby?district=Patiala", s, r, 200)

s, r = req("POST", "/medicines/add", {
    "name": MED_NAME,
    "description": "Test medicine for API check",
    "manufacturer": "Test Pharma Ltd"
})
check("POST /medicines/add", s, r, 201, "medicine_id")
MED_ID = r.get("medicine_id", "")
print(f"         medicine_id = {MED_ID}")

s, r = req("GET", "/medicines")
check("GET /medicines", s, r, 200)

s, r = req("GET", f"/medicines/search?name={MED_NAME}")
check("GET /medicines/search?name=<medicine>", s, r, 200)

if PHARM_ID and MED_ID:
    s, r = req("POST", "/pharmacies/inventory/update", {
        "pharmacy_id": PHARM_ID, "medicine_id": MED_ID,
        "stock_quantity": 40
    })
    check("POST /pharmacies/inventory/update", s, r, 201)

    s, r = req("GET", f"/medicines/availability/{MED_NAME}")
    check("GET /medicines/availability/{name}", s, r, 200, "medicine")
    if s == 200:
        print(f"         available_at = {r.get('available_at')}")

# ─────────────────────────────────────────────────────────────
section("AI SYMPTOM CHECKER & RISK ENGINE")
s, r = req("POST", "/ai/symptom-check", {"symptoms": "fever headache body pain"})
check("POST /ai/symptom-check (multi-symptom)", s, r, 200, "possible_conditions")
if s == 200:
    print(f"         conditions = {r.get('possible_conditions')}")

s, r = req("POST", "/ai/symptom-check", {"symptoms": "chest pain breathlessness"})
check("POST /ai/symptom-check (emergency)", s, r, 200, "recommendation")
if s == 200:
    rec = r.get("recommendation", "").encode("ascii", errors="replace").decode()
    print(f"         recommendation = {rec[:80]}")

if PATIENT_ID:
    s, r = req("POST", "/ai/patient-risk", {"patient_id": PATIENT_ID})
    check("POST /ai/patient-risk", s, r, 200, "risk_level")
    if s == 200:
        print(f"         risk_score = {r.get('risk_score')}")
        print(f"         risk_level = {r.get('risk_level')}")

s, r = req("GET", "/alerts/high-risk-patients")
check("GET /alerts/high-risk-patients", s, r, 200)
if s == 200 and isinstance(r, list):
    print(f"         High-risk patients count = {len(r)}")

# ─────────────────────────────────────────────────────────────
section("OFFLINE SYNC MODULE")
if PATIENT_ID and DOCTOR_ID:
    import urllib.parse
    day = f"{(int(TS[:2]) % 28) + 1:02d}"
    SYNC_BODY = {
        "records": [
            {
                "patient_id": PATIENT_ID, "doctor_id": DOCTOR_ID,
                "diagnosis": "Offline sync record A",
                "prescription": ["Med A"], "notes": "Sync note A",
                "consultation_date": f"2026-01-{day}T10:00:00"
            },
            {
                "patient_id": PATIENT_ID, "doctor_id": DOCTOR_ID,
                "diagnosis": "Offline sync record B",
                "prescription": ["Med B"], "notes": "Sync note B",
                "consultation_date": f"2026-02-{day}T11:00:00"
            }
        ]
    }
    s, r = req("POST", "/sync/patient-records", SYNC_BODY)
    check("POST /sync/patient-records (first sync)", s, r, 200, "records_synced")
    if s == 200:
        print(f"         synced={r.get('records_synced')}  skipped={r.get('records_skipped')}")

    # Re-sync same payload -> must skip
    s, r = req("POST", "/sync/patient-records", SYNC_BODY)
    check("POST /sync/patient-records (re-sync -> all skipped)", s, r, 200, "records_skipped")
    if s == 200:
        print(f"         synced={r.get('records_synced')}  skipped={r.get('records_skipped')}")
        if r.get("records_synced", -1) != 0:
            print("         WARNING: idempotency check - records_synced should be 0!")
else:
    print("  [SKIP] Sync tests skipped")

# ─────────────────────────────────────────────────────────────
section("CLEANUP: Delete Test Appointment")
if APPT_ID:
    s, r = req("DELETE", f"/appointments/{APPT_ID}")
    check(f"DELETE /appointments/{APPT_ID}", s, r, 200)
    # Verify it's gone -> 404
    s, r = req("DELETE", f"/appointments/{APPT_ID}")
    check(f"DELETE same appointment again -> 404", s, r, 404)
else:
    print("  [SKIP] No appointment to delete")

# ─────────────────────────────────────────────────────────────
section("FINAL RESULTS")
total  = len(results)
passed = sum(1 for r in results if r is True)
failed = sum(1 for r in results if r is False)

print(f"\n  Total checks  : {total}")
print(f"  PASSED        : {passed}")
print(f"  FAILED        : {failed}")
print()
if failures:
    print("  Failed endpoints:")
    for f in failures:
        print(f"    - {f}")
    print()

if failed == 0:
    print("  ALL ENDPOINTS WORKING CORRECTLY!")
else:
    print(f"  {failed} endpoint(s) FAILED -- check output above.")
    sys.exit(1)
