# 🏥 Rural TeleHealth Access System — API Routes Reference

> **Base URL:** `http://localhost:8000`
> **Interactive Docs (Swagger UI):** `http://localhost:8000/docs`
> **Total Endpoints:** 33

---

## 📑 Table of Contents

| # | Module | Endpoints |
|---|---|---|
| — | Health Check | `GET /` |
| 1–2 | 👤 Patient | register, me (protected) |
| 3–5 | 🔐 Auth | send-otp, verify-otp |
| 6–10 | 🩺 Doctors | register, list, get, specialization, availability |
| 11–15 | 📅 Appointments | book, list, status, delete |
| 16–18 | 📋 Medical Records | create, list, get |
| 19–22 | 💊 Pharmacy | register, list, nearby, inventory |
| 23–26 | 💉 Medicines | add, list, search, availability |
| 27–28 | 🤖 AI | symptom-check, patient-risk, high-risk-patients |
| 29 | 📶 Sync | offline batch sync |
| 30–32 | 🧑‍⚕️ ASHA Workers | register, list, get |
| 33–35 | 💓 Vitals | add, history, latest |
| 36–38 | 🎤 Voice Reports | upload, patient history, get |

---

## 🔍 Health Check

### GET /
```
GET http://localhost:8000/
```
**Response:**
```json
{
  "message": "Rural TeleHealth Backend is running 🏥",
  "status": "ok"
}
```

---

## 👤 Patient Module

### 1. Register Patient
```
POST http://localhost:8000/patients/register
Content-Type: application/json
```
**Request Body:**
```json
{
  "full_name": "Ramesh Patil",
  "age": 45,
  "gender": "Male",
  "phone": "9876543210",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "pincode": "147201",
  "blood_group": "O+",
  "existing_conditions": ["Diabetes"],
  "allergies": ["Penicillin"],
  "current_medications": ["Metformin"],
  "emergency_contact_name": "Suresh Patil",
  "emergency_contact_phone": "9876543211",
  "preferred_language": "Hindi"
}
```
**Response:**
```json
{
  "id": 1,
  "patient_id": "PAT-2026-0001",
  "full_name": "Ramesh Patil",
  "age": 45,
  "gender": "Male",
  "phone": "9876543210",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "pincode": "147201",
  "blood_group": "O+",
  "existing_conditions": ["Diabetes"],
  "allergies": ["Penicillin"],
  "current_medications": ["Metformin"],
  "emergency_contact_name": "Suresh Patil",
  "emergency_contact_phone": "9876543211",
  "preferred_language": "Hindi"
}
```

---

### 2. Get My Profile 🔒 *(JWT Protected)*
```
GET http://localhost:8000/patients/me
Authorization: Bearer <access_token>
```
> 🔑 Requires the JWT token from **verify-otp** step. Copy the `access_token` and add it as the Authorization header.

**Response:**
```json
{
  "id": 1,
  "patient_id": "PAT-2026-0001",
  "full_name": "Ramesh Patil",
  "age": 45,
  "gender": "Male",
  "phone": "9876543210",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "pincode": "147201",
  "blood_group": "O+",
  "existing_conditions": ["Diabetes"],
  "allergies": ["Penicillin"],
  "current_medications": ["Metformin"],
  "emergency_contact_name": "Suresh Patil",
  "emergency_contact_phone": "9876543211",
  "preferred_language": "Hindi"
}
```
**Error (invalid/missing token):**
```json
{ "detail": "Invalid or expired token" }
```

---

## 🔐 Patient Authentication

### 3. Send OTP
```
POST http://localhost:8000/auth/patient/send-otp
Content-Type: application/json
```
**Request Body:**
```json
{ "phone": "9876543210" }
```
**Response:**
```json
{
  "message": "OTP sent successfully",
  "phone": "9876543210"
}
```
> ⚠️ Check your **server terminal** for the OTP — it's printed as a simulated SMS.

---

### 4. Verify OTP & Login
```
POST http://localhost:8000/auth/patient/verify-otp
Content-Type: application/json
```
**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```
> Replace `123456` with the OTP printed in your server console.

**Response:**
```json
{
  "message": "Login successful",
  "access_token": "<jwt_token_here>",
  "token_type": "bearer",
  "patient_id": "PAT-2026-0001"
}
```

---

## 🩺 Doctors Module

### 5. Register Doctor
```
POST http://localhost:8000/doctors/register
Content-Type: application/json
```
**Request Body:**
```json
{
  "full_name": "Dr. Anjali Sharma",
  "specialization": "General Physician",
  "hospital_name": "Patiala Civil Hospital",
  "hospital_address": "Near Bus Stand, Patiala, Punjab",
  "phone": "9988776655",
  "email": "anjali.sharma@hospital.com",
  "experience_years": 12,
  "consultation_fee": 200,
  "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "available_time_slots": ["09:00-12:00", "14:00-17:00"]
}
```
**Response:**
```json
{
  "doctor_id": "DOC-2026-0001",
  "full_name": "Dr. Anjali Sharma",
  "specialization": "General Physician",
  "hospital_name": "Patiala Civil Hospital",
  "phone": "9988776655",
  "email": "anjali.sharma@hospital.com",
  "experience_years": 12,
  "consultation_fee": 200,
  "availability_status": true,
  "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "available_time_slots": ["09:00-12:00", "14:00-17:00"],
  "created_at": "2026-03-12T12:00:00"
}
```

---

### 6. Get All Doctors
```
GET http://localhost:8000/doctors/
```

---

### 7. Get Doctor by ID
```
GET http://localhost:8000/doctors/DOC-2026-0001
```

---

### 8. Get Doctors by Specialization
```
GET http://localhost:8000/doctors/specialization/General Physician
```

---

### 9. Update Doctor Availability
```
PATCH http://localhost:8000/doctors/DOC-2026-0001/availability
Content-Type: application/json
```
**Request Body:**
```json
{ "availability_status": false }
```

---

## 📅 Appointments Module

### 10. Book Appointment
```
POST http://localhost:8000/appointments/book
Content-Type: application/json
```
**Request Body:**
```json
{
  "patient_id": "PAT-2026-0001",
  "doctor_id": "DOC-2026-0001",
  "symptoms": "fever, headache, body pain for 3 days",
  "consultation_type": "video",
  "appointment_date": "2026-03-15",
  "appointment_time": "10:00:00"
}
```
> `consultation_type` options: `audio` | `video` | `chat`

**Response:**
```json
{
  "appointment_id": "APT-2026-0001",
  "patient_id": "PAT-2026-0001",
  "doctor_id": "DOC-2026-0001",
  "symptoms": "fever, headache, body pain for 3 days",
  "consultation_type": "video",
  "status": "pending",
  "appointment_date": "2026-03-15",
  "appointment_time": "10:00:00",
  "created_at": "2026-03-12T12:00:00"
}
```

---

### 11. Get Appointments for a Patient
```
GET http://localhost:8000/appointments/patient/PAT-2026-0001
```

---

### 12. Get Appointments for a Doctor
```
GET http://localhost:8000/appointments/doctor/DOC-2026-0001
```

---

### 13. Update Appointment Status
```
PATCH http://localhost:8000/appointments/APT-2026-0001/status
Content-Type: application/json
```
**Request Body:**
```json
{ "status": "confirmed" }
```
> `status` options: `pending` | `confirmed` | `completed` | `cancelled`

---

### 14. Delete / Cancel Appointment
```
DELETE http://localhost:8000/appointments/APT-2026-0001
```
**Response:**
```json
{ "message": "Appointment APT-2026-0001 deleted successfully" }
```

---

## 📋 Medical Records Module

### 15. Create Medical Record
```
POST http://localhost:8000/records/create
Content-Type: application/json
```
**Request Body:**
```json
  {
    "patient_id": "PAT-2026-0001",
    "doctor_id": "DOC-2026-0001",
    "diagnosis": "Viral Fever with mild dehydration",
    "prescription": [
      "Paracetamol 500mg twice a day",
      "ORS sachets",
      "Rest for 3 days"
    ],
    "notes": "Patient should avoid cold food. Follow up after 5 days if no improvement."
  }
```
**Response:**
```json
{
  "record_id": "REC-2026-0001",
  "patient_id": "PAT-2026-0001",
  "doctor_id": "DOC-2026-0001",
  "diagnosis": "Viral Fever with mild dehydration",
  "prescription": ["Paracetamol 500mg twice a day", "ORS sachets", "Rest for 3 days"],
  "notes": "Patient should avoid cold food. Follow up after 5 days if no improvement.",
  "consultation_date": "2026-03-12T12:00:00"
}
```

---

### 16. Get All Records for a Patient
```
GET http://localhost:8000/records/patient/PAT-2026-0001
```

---

### 17. Get a Specific Medical Record
```
GET http://localhost:8000/records/REC-2026-0001
```

---

## 💊 Pharmacy Module

### 18. Register Pharmacy
```
POST http://localhost:8000/pharmacies/register
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Nabha Medical Store",
  "address": "Main Bazaar, Nabha",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "phone": "9876501234",
  "latitude": 30.3765,
  "longitude": 76.1445
}
```
**Response:**
```json
{
  "pharmacy_id": "PHM-2026-0001",
  "name": "Nabha Medical Store",
  "address": "Main Bazaar, Nabha",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "phone": "9876501234",
  "latitude": 30.3765,
  "longitude": 76.1445,
  "created_at": "2026-03-12T12:00:00"
}
```

---

### 19. Get All Pharmacies
```
GET http://localhost:8000/pharmacies
```

---

### 20. Get Nearby Pharmacies
```
GET http://localhost:8000/pharmacies/nearby?district=Patiala
GET http://localhost:8000/pharmacies/nearby?state=Punjab
GET http://localhost:8000/pharmacies/nearby?district=Patiala&state=Punjab
```

---

### 21. Update Pharmacy Inventory (Add / Restock)
```
POST http://localhost:8000/pharmacies/inventory/update
Content-Type: application/json
```
**Request Body:**
```json
{
  "pharmacy_id": "PHM-2026-0001",
  "medicine_id": "MED-2026-0001",
  "stock_quantity": 50
}
```
> If the medicine already exists in this pharmacy's inventory, the stock quantity is **updated**. Otherwise a new inventory entry is created.

---

## 💉 Medicines Module

### 22. Add Medicine
```
POST http://localhost:8000/medicines/add
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Paracetamol",
  "description": "Used to treat fever and mild to moderate pain",
  "manufacturer": "Sun Pharma"
}
```
**Response:**
```json
{
  "medicine_id": "MED-2026-0001",
  "name": "Paracetamol",
  "description": "Used to treat fever and mild to moderate pain",
  "manufacturer": "Sun Pharma"
}
```

---

### 23. Get All Medicines
```
GET http://localhost:8000/medicines
```

---

### 24. Search Medicine by Name
```
GET http://localhost:8000/medicines/search?name=Paracetamol
```

---

### 25. Check Medicine Availability Across Pharmacies
```
GET http://localhost:8000/medicines/availability/Paracetamol
```
**Response:**
```json
{
  "medicine": "Paracetamol",
  "available_at": [
    {
      "pharmacy": "Nabha Medical Store",
      "district": "Patiala",
      "stock": 50
    }
  ]
}
```

---

## 🤖 AI Symptom Checker

### 26. Check Symptoms
```
POST http://localhost:8000/ai/symptom-check
Content-Type: application/json
```

**Single symptom:**
```json
{ "symptoms": "fever" }
```

**Multiple symptoms:**
```json
{ "symptoms": "fever headache body pain" }
```

**Emergency:**
```json
{ "symptoms": "chest pain breathlessness" }
```

**Normal Response:**
```json
{
  "symptoms_received": "fever headache body pain",
  "possible_conditions": ["viral fever", "flu", "migraine", "dengue"],
  "recommendation": "consult doctor",
  "disclaimer": "This is an AI-based preliminary assessment only. Always consult a qualified doctor."
}
```

**Emergency Response:**
```json
{
  "symptoms_received": "chest pain breathlessness",
  "possible_conditions": ["cardiac issue", "asthma", "COVID-19"],
  "recommendation": "EMERGENCY: Please call an ambulance or go to the nearest hospital immediately.",
  "disclaimer": "This is an AI-based preliminary assessment only. Always consult a qualified doctor."
}
```

---

## 📶 Offline Sync

### 27. Sync Patient Records (Batch Upload)
```
POST http://localhost:8000/sync/patient-records
Content-Type: application/json
```
> **Purpose:** Mobile apps in rural/low-connectivity areas store records offline and bulk-upload when internet is available.

**Request Body:**
```json
{
  "records": [
    {
      "patient_id": "PAT-2026-0001",
      "doctor_id": "DOC-2026-0001",
      "diagnosis": "Viral fever",
      "prescription": ["Paracetamol", "Rest"],
      "notes": "Drink fluids",
      "consultation_date": "2026-03-12T10:30:00"
    },
    {
      "patient_id": "PAT-2026-0001",
      "doctor_id": "DOC-2026-0002",
      "diagnosis": "Cold",
      "prescription": ["Cetrizine"],
      "notes": "Avoid cold drinks",
      "consultation_date": "2026-03-11T09:00:00"
    }
  ]
}
```

**Response (first sync):**
```json
{
  "message": "Records synced successfully",
  "records_synced": 2,
  "records_skipped": 0
}
```

**Response (re-sync — idempotent):**
```json
{
  "message": "Records synced successfully",
  "records_synced": 0,
  "records_skipped": 2
}
```
> ✅ Duplicate detection is based on `patient_id + doctor_id + consultation_date`. Safe to call multiple times — won't create duplicates.

---

## 🧑‍⚕️ ASHA Workers Module

### 28. Register ASHA Worker
```
POST http://localhost:8000/asha/register
Content-Type: application/json
```
**Request Body:**
```json
{
  "full_name": "Sunita Devi",
  "phone": "9876540001",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "assigned_population": 1200,
  "years_experience": 5
}
```
**Response:**
```json
{
  "asha_id": "ASHA-2026-0001",
  "full_name": "Sunita Devi",
  "phone": "9876540001",
  "village": "Nabha",
  "district": "Patiala",
  "state": "Punjab",
  "assigned_population": 1200,
  "years_experience": 5,
  "created_at": "2026-03-12T12:00:00"
}
```

---

### 29. Get All ASHA Workers
```
GET http://localhost:8000/asha/
```

---

### 30. Get ASHA Worker by ID
```
GET http://localhost:8000/asha/ASHA-2026-0001
```

---

## 💓 Patient Vitals Module

### 31. Add Patient Vitals
```
POST http://localhost:8000/vitals/add
Content-Type: application/json
```
**Request Body:**
```json
{
  "patient_id": "PAT-2026-0001",
  "asha_id": "ASHA-2026-0001",
  "systolic_bp": 120,
  "diastolic_bp": 80,
  "heart_rate": 72,
  "temperature": 37.2,
  "spo2": 98,
  "blood_sugar": 110,
  "weight": 65,
  "height": 170,
  "respiratory_rate": 16,
  "symptoms": "mild headache",
  "notes": "patient stable"
}
```
> 🧮 `bmi` is **auto-calculated** from `weight` and `height` — do not pass it manually.

**Response (normal vitals — no alerts):**
```json
{
  "vitals": {
    "vitals_id": "VIT-2026-0001",
    "patient_id": "PAT-2026-0001",
    "asha_id": "ASHA-2026-0001",
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "heart_rate": 72,
    "temperature": 37.2,
    "spo2": 98,
    "blood_sugar": 110,
    "weight": 65.0,
    "height": 170.0,
    "bmi": 22.49,
    "respiratory_rate": 16,
    "symptoms": "mild headache",
    "notes": "patient stable",
    "recorded_at": "2026-03-12T12:00:00"
  },
  "alerts": []
}
```

**Test with critical vitals (triggers all alerts):**
```json
{
  "patient_id": "PAT-2026-0001",
  "asha_id": "ASHA-2026-0001",
  "systolic_bp": 170,
  "diastolic_bp": 100,
  "heart_rate": 115,
  "temperature": 39.2,
  "spo2": 89,
  "blood_sugar": 215,
  "weight": 95,
  "height": 165,
  "respiratory_rate": 27,
  "symptoms": "chest discomfort, breathlessness",
  "notes": "patient appears distressed"
}
```
**Response alerts:**
```json
{
  "vitals": { "...": "auto-populated" },
  "alerts": [
    "⚠️ High blood pressure detected. Doctor consultation recommended.",
    "🚨 Low oxygen level detected. Immediate medical attention advised.",
    "⚠️ Elevated heart rate (tachycardia). Doctor review recommended.",
    "⚠️ High fever detected. Immediate care required.",
    "🚨 Very high blood sugar. Diabetic emergency possible. Immediate medical attention.",
    "⚠️ Obesity detected (BMI ≥ 30). Lifestyle counselling recommended.",
    "🚨 High respiratory rate. Possible respiratory distress. Seek attention."
  ]
}
```

---

### 32. Get Full Vitals History for a Patient
```
GET http://localhost:8000/vitals/patient/PAT-2026-0001
```
> Returns all vitals sorted **newest first**, each entry includes its alerts.

---

### 33. Get Latest Vitals for a Patient
```
GET http://localhost:8000/vitals/latest/PAT-2026-0001
```
> Returns only the **most recent** vitals reading.
> Ideal for doctors to review before writing a consultation record.

---

## 🚨 Health Alert Reference

| Vital | Threshold | Level | Message |
|---|---|---|---|
| Systolic BP | > 160 | ⚠️ | Doctor consultation recommended |
| Systolic BP | < 90 | ⚠️ | Monitor closely |
| SpO2 | < 92 | 🚨 | Immediate medical attention |
| SpO2 | < 95 | ⚠️ | Monitor closely |
| Heart Rate | > 100 | ⚠️ | Tachycardia — Doctor review |
| Heart Rate | < 50 | ⚠️ | Bradycardia — Doctor review |
| Temperature | ≥ 38.5°C | ⚠️ | High fever — Immediate care |
| Temperature | ≥ 37.5°C | ⚠️ | Mild fever — Monitor |
| Temperature | < 36.0°C | ⚠️ | Hypothermia risk |
| Blood Sugar | > 200 | 🚨 | Diabetic emergency |
| Blood Sugar | > 140 | ⚠️ | Elevated — Doctor consult |
| Blood Sugar | < 70 | 🚨 | Hypoglycemia — Immediate |
| BMI | ≥ 30 | ⚠️ | Obesity counselling |
| BMI | ≥ 25 | ℹ️ | Overweight — diet advised |
| BMI | < 18.5 | ⚠️ | Underweight — nutrition |
| Respiratory Rate | > 24 | 🚨 | Respiratory distress |
| Low Resp Rate | resp_rate < 12 | ⚠️ | Low rate — monitor breathing |

---

## 🎤 Voice Symptom Reports

### 34. Upload Voice Report (Speech-to-Text)
```
POST http://localhost:8000/voice-report/upload
Content-Type: multipart/form-data
```
**Form Data Payload:**
- `patient_id` (text): `PAT-2026-0001`
- `audio_file` (file): *Select an audio file (e.g., .wav, .mp3, .m4a)*

> **Features:** Automatically detects Hindi or English, translates to English, and extracts symptom keywords.

**Expected Response (Hindi Input Example):**
```json
{
  "report_id": "VOICE-2026-0001",
  "patient_id": "PAT-2026-0001",
  "audio_file_path": "e:\\EdTech\\backend\\uploads\\voice_reports\\VOICE-2026-0001.wav",
  "original_transcription": "मुझे तीन दिन से बुखार है और सिर दर्द भी है।",
  "translated_text": "I have had fever for three days and also have a headache.",
  "detected_language": "hi",
  "possible_symptoms": [
    "fever",
    "headache"
  ],
  "created_at": "2026-03-12T12:00:00"
}
```

---

### 35. Get Voice Reports for Patient
```
GET http://localhost:8000/voice-report/patient/PAT-2026-0001
```
> Returns a list of all voice symptom reports submitted by the patient, sorted newest first.

---

### 36. Get Specific Voice Report
```
GET http://localhost:8000/voice-report/VOICE-2026-0001
```

---

## 🚨 AI Risk Triage

### 37. Evaluate Patient Risk
```
POST http://localhost:8000/ai/patient-risk
Content-Type: application/json
```
**Request Body:**
```json
{
  "patient_id": "PAT-2026-0001"
}
```
> Evaluates patient health risk using vitals, symptoms, and medical history. Identifies critical emergencies using rule-based scoring.

**Expected Response:**
```json
{
  "patient_id": "PAT-2026-0001",
  "risk_score": 72,
  "risk_level": "HIGH",
  "alerts": [
    "Slightly low oxygen",
    "High fever"
  ],
  "recommendation": "Urgent doctor consultation recommended"
}
```

---

### 38. Get High-Risk Patients
```
GET http://localhost:8000/alerts/high-risk-patients
```
> Returns a list of all patients currently classified as HIGH or CRITICAL risk based on the latest data.

**Expected Response:**
```json
[
  {
    "patient_id": "PAT-2026-0001",
    "risk_score": 85,
    "risk_level": "CRITICAL"
  }
]
```

---

## 🆔 ID Format Reference

| Entity | Format | Example |
|---|---|---|
| Patient | `PAT-YYYY-XXXX` | `PAT-2026-0001` |
| Doctor | `DOC-YYYY-XXXX` | `DOC-2026-0001` |
| Appointment | `APT-YYYY-XXXX` | `APT-2026-0001` |
| Medical Record | `REC-YYYY-XXXX` | `REC-2026-0001` |
| Pharmacy | `PHM-YYYY-XXXX` | `PHM-2026-0001` |
| Medicine | `MED-YYYY-XXXX` | `MED-2026-0001` |
| ASHA Worker | `ASHA-YYYY-XXXX` | `ASHA-2026-0001` |
| Patient Vitals | `VIT-YYYY-XXXX` | `VIT-2026-0001` |
| Voice Report | `VOICE-YYYY-XXXX` | `VOICE-2026-0001` |

---

## 🗺️ Complete API Surface

| # | Method | Route | Auth | Module |
|---|---|---|---|---|
| — | `GET` | `/` | ❌ | Health |
| 1 | `POST` | `/patients/register` | ❌ | Patients |
| 2 | `GET` | `/patients/me` | ✅ JWT | Patients |
| 3 | `POST` | `/auth/patient/send-otp` | ❌ | Auth |
| 4 | `POST` | `/auth/patient/verify-otp` | ❌ | Auth |
| 5 | `POST` | `/doctors/register` | ❌ | Doctors |
| 6 | `GET` | `/doctors/` | ❌ | Doctors |
| 7 | `GET` | `/doctors/{doctor_id}` | ❌ | Doctors |
| 8 | `GET` | `/doctors/specialization/{spec}` | ❌ | Doctors |
| 9 | `PATCH` | `/doctors/{doctor_id}/availability` | ❌ | Doctors |
| 10 | `POST` | `/appointments/book` | ❌ | Appointments |
| 11 | `GET` | `/appointments/patient/{id}` | ❌ | Appointments |
| 12 | `GET` | `/appointments/doctor/{id}` | ❌ | Appointments |
| 13 | `PATCH` | `/appointments/{id}/status` | ❌ | Appointments |
| 14 | `DELETE` | `/appointments/{id}` | ❌ | Appointments |
| 15 | `POST` | `/records/create` | ❌ | Records |
| 16 | `GET` | `/records/patient/{id}` | ❌ | Records |
| 17 | `GET` | `/records/{record_id}` | ❌ | Records |
| 18 | `POST` | `/pharmacies/register` | ❌ | Pharmacy |
| 19 | `GET` | `/pharmacies` | ❌ | Pharmacy |
| 20 | `GET` | `/pharmacies/nearby` | ❌ | Pharmacy |
| 21 | `POST` | `/pharmacies/inventory/update` | ❌ | Pharmacy |
| 22 | `POST` | `/medicines/add` | ❌ | Medicines |
| 23 | `GET` | `/medicines` | ❌ | Medicines |
| 24 | `GET` | `/medicines/search` | ❌ | Medicines |
| 25 | `GET` | `/medicines/availability/{name}` | ❌ | Medicines |
| 26 | `POST` | `/ai/symptom-check` | ❌ | AI |
| 27 | `POST` | `/sync/patient-records` | ❌ | Sync |
| 28 | `POST` | `/asha/register` | ❌ | ASHA |
| 29 | `GET` | `/asha/` | ❌ | ASHA |
| 30 | `GET` | `/asha/{asha_id}` | ❌ | ASHA |
| 31 | `POST` | `/vitals/add` | ❌ | Vitals |
| 32 | `GET` | `/vitals/patient/{patient_id}` | ❌ | Vitals |
| 33 | `GET` | `/vitals/latest/{patient_id}` | ❌ | Vitals |
| 34 | `POST` | `/voice-report/upload` | ❌ | Voice |
| 35 | `GET` | `/voice-report/patient/{patient_id}` | ❌ | Voice |
| 36 | `GET` | `/voice-report/{report_id}` | ❌ | Voice |
| 37 | `POST` | `/ai/patient-risk` | ❌ | AI Risk |
| 38 | `GET` | `/alerts/high-risk-patients` | ❌ | AI Risk |

---

## ✅ Recommended Testing Order (End-to-End Flow)

```
── Patient Onboarding ──────────────────────────────────────────────────
 1. POST /patients/register                  → Create a patient
 2. POST /auth/patient/send-otp              → Request OTP (check terminal)
 3. POST /auth/patient/verify-otp            → Login → copy JWT token
 4. GET  /patients/me                        → Verify JWT works ✅

── Doctor Setup ────────────────────────────────────────────────────────
 5. POST /doctors/register                   → Add a doctor
 6. GET  /doctors/                           → List all doctors
 7. GET  /doctors/specialization/General...  → Filter by specialization
 8. PATCH /doctors/DOC-..../availability     → Toggle availability

── ASHA Community Health Round ─────────────────────────────────────────
 9. POST /asha/register                      → Register ASHA worker
10. POST /vitals/add                         → Record patient vitals
11. GET  /vitals/latest/PAT-...              → Verify alerts & BMI auto-calc

── Remote Consultation ─────────────────────────────────────────────────
12. POST /appointments/book                  → Book appointment
13. GET  /appointments/patient/PAT-...       → View upcoming appointments
14. GET  /vitals/patient/PAT-...             → Doctor reviews vitals history
15. POST /voice-report/upload                → Patient records audio symptoms
16. GET  /voice-report/patient/PAT-...       → Doctor reviews voice transcribed symptoms
17. PATCH /appointments/APT-.../status       → Set status to "confirmed"
18. POST /records/create                     → Doctor writes prescription
19. GET  /records/patient/PAT-...            → View full medical history
20. PATCH /appointments/APT-.../status       → Set status to "completed"

── AI Triage ───────────────────────────────────────────────────────────
19. POST /ai/symptom-check                   → Symptom triage (try emergency!)

── Pharmacy & Medicine ─────────────────────────────────────────────────
20. POST /pharmacies/register                → Register a pharmacy
21. POST /medicines/add                      → Add Paracetamol
22. POST /pharmacies/inventory/update        → Stock 50 units
23. GET  /medicines/availability/Paracetamol → Check stock across pharmacies
24. GET  /medicines/search?name=Para         → Search partial name
25. GET  /pharmacies/nearby?district=Patiala → Find nearby pharmacies

── Offline Sync ────────────────────────────────────────────────────────
26. POST /sync/patient-records               → Batch sync 2 records
27. POST /sync/patient-records               → Re-sync → skipped = 2 (idempotent)
```

---

> 💡 **Tip:** Open `http://localhost:8000/docs` for live Swagger UI — paste requests directly in the browser.
>
> 🔒 For `GET /patients/me`, click **Authorize** in Swagger UI and enter your Bearer token.
