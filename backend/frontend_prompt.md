# TeleHealth Frontend Application Prompt

Copy and paste the following prompt into Stitch (or any other React/Next.js UI generator) to build the frontend for this backend.

***

**System Prompt / Master Instruction:**

You are an expert React/Next.js frontend developer building the UI for a "Rural TeleHealth Access System". The backend API is built with FastAPI and runs on `http://localhost:8000`. The frontend must be responsive, accessible, and use a clean, modern medical UI aesthetic (Tailwind CSS recommended).

The system involves four main user roles: **Patient**, **Doctor**, **ASHA Worker**, and **Super Admin**.

Please generate the following pages and components based on the described API endpoints. Use Axios or fetch for API calls, and context/zustand for state management (especially holding JWT tokens).

### 1. Unified Landing Page (`/`)
*   **Description:** The main entry point of the application.
*   **UI Components:**
    *   Hero section explaining the Rural TeleHealth system.
    *   Four prominent login/register portals: "I am a Patient", "I am a Doctor", "I am an ASHA Worker", "Hospital Administration".

### 2. Patient Portal
*   **Patient Registration (`/patient/register`)**
    *   **Fields:** Full Name, Age, Gender, Phone Number, Village, District, State, Pincode, Blood Group, Existing Conditions (comma-separated list), Allergies, Emergency Contact Name, Emergency Contact Phone.
    *   **API Action:** `POST /patients/register`
*   **Patient Login (`/patient/login`)**
    *   **Fields:** Phone Number.
    *   **Action:** Triggers `POST /auth/patient/send-otp`. Shows an OTP input field upon success.
    *   **OTP Verification:** Input 6-digit OTP, calls `POST /auth/patient/verify-otp`. Saves JWT token context.
*   **Patient Dashboard (`/patient/dashboard`)**
    *   **Overview:** Welcomes the patient (fetches `GET /patients/me`).
    *   **Actions:**
        *   **Book Appointment:** Select from a list of Doctors (`GET /doctors/`), date, time, and symptoms. (`POST /appointments/book`).
        *   **My Appointments:** List upcoming and past appointments (`GET /appointments/patient/{id}`).
        *   **My Records:** View past prescriptions and diagnosis (`GET /records/patient/{id}`).
        *   **AI Symptom Checker:** A text box to enter symptoms, calling `POST /ai/symptom-check`. Shows emergency alerts if applicable.
        *   **Voice Symptom Recoder:** A microphone button to record audio, uploads via `POST /voice-report/upload`.

### 3. Doctor Portal
*   **Doctor Login (`/doctor/login`)**
    *   **Fields:** Email, Password.
    *   **API Action:** `POST /auth/doctor/login`. Saves JWT token.
*   **Doctor Dashboard (`/doctor/dashboard`)**
    *   **Overview:** Shows doctor's details and availability toggle (`GET /doctors/me`, `PATCH /doctors/{id}/availability`).
    *   **My Appointments:** A list of upcoming appointments (`GET /appointments/doctor/{id}`). Each appointment row has a "Start Consultation" button.
*   **Consultation Room (`/doctor/consultation/{patient_id}`)**
    *   **Vitals Panel:** Shows the latest vitals collected by ASHA workers (`GET /vitals/latest/{patient_id}`) and auto-calculated risk alerts (`POST /ai/patient-risk`).
    *   **Voice Reports Panel:** Shows translated English transcriptions of rural patient voice symptoms (`GET /voice-report/patient/{patient_id}`).
    *   **Medical History Panel:** Past records (`GET /records/patient/{patient_id}`).
    *   **Prescription Form:** Inputs for Diagnosis, Prescription (list), and clinical Notes. Submits to `POST /records/create` and updates appointment status to 'completed' (`PATCH /appointments/{id}/status`).

### 4. ASHA Worker (Community Worker) Portal
*   **ASHA Registration (`/asha/register`)**
    *   **Fields:** Full Name, Phone, Village, District, State, Assigned Population, Years Experience.
    *   **API Action:** `POST /asha/register`
*   **ASHA Dashboard (`/asha/dashboard`)**
    *   **Action:** "Add Patient Vitals" button.
*   **Record Vitals Form (`/asha/record-vitals`)**
    *   **Fields:** Patient ID (searchable/text input), ASHA ID (auto-filled), Systolic BP, Diastolic BP, Heart Rate, Temperature, SpO2, Blood Sugar, Weight, Height, Respiratory Rate, Symptoms (text), Notes.
    *   **API Action:** `POST /vitals/add`. Shows immediate critical alerts returned from the backend (calculated BMI, alerts).

### 5. Super Admin Portal (Hospital Admin)
*   **Admin Login (`/admin/login`)**
    *   **Fields:** Email, Password. (Static Backend credentials).
    *   **API Action:** `POST /auth/admin/login`. Saves JWT token.
*   **Admin Dashboard (`/admin/dashboard`)**
    *   **Action 1:** Register New Doctor. Form with Full Name, Specialization, Hospital, Phone, Email, Password, Experience, Fee, Available Days. (`POST /doctors/register` - requires Admin Auth header).
    *   **Action 2: Emergency Triage Dashboard.** A live-updating table that hits `GET /alerts/high-risk-patients` to display patients with HIGH or CRITICAL risk scores in red/orange badges, along with their risk scores.

### 6. Pharmacy & Inventory Portal
*   **Pharmacy Dashboard (`/pharmacy`)**
    *   Register Pharmacy Form (`POST /pharmacies/register`).
    *   Add Medicine Directory (`POST /medicines/add`).
    *   Update Inventory Form: Select Pharmacy, Select Medicine, Input Stock Quantity (`POST /pharmacies/inventory/update`).
    *   Medicine Locator: Search for a medicine name (`GET /medicines/availability/{name}`) to find nearby stock for patients.

**Technical Requirements:**
*   Always include the `Authorization: Bearer <token>` header for protected routes (Admin, Doctor, Patient tracking).
*   Handle errors gracefully (e.g., 401 Unauthorized redirects to login).
*   Use standard Tailwind colors: Red for critical/emergencies, Blue for doctors, Green for ASHA workers, Teal for patients.
