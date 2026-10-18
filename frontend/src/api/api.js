import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
const PC_IP = '192.168.1.6'; // Your PC's current LAN IP
const BASE_URL = Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `http://${PC_IP}:8000`;
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// ── Auth ────────────────────────────────────────
export const sendOTP = (phone) => api.post('/auth/patient/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/patient/verify-otp', { phone, otp });
export const doctorLogin = (email, password) => api.post('/auth/doctor/login', { email, password });
export const adminLogin = (email, password) => api.post('/auth/admin/login', { email, password });

// ── Patients ────────────────────────────────────
export const registerPatient = (data) => api.post('/patients/register', data);
export const getMe = () => api.get('/patients/me');
export const getAllPatients = () => api.get('/patients/');
export const getPatientById = (id) => api.get(`/patients/${id}`);

// ── Doctors ─────────────────────────────────────
export const getAllDoctors = () => api.get('/doctors/');
export const getDoctorsBySpec = (s) => api.get(`/doctors/specialization/${s}`);
export const registerDoctor = (data) => api.post('/doctors/register', data);
export const updateDoctorAvailability = (doctor_id, status) =>
  api.patch(`/doctors/${doctor_id}/availability`, { availability_status: status });
export const getDoctorSchedule = (doctorId) =>
  api.get(`/doctors/${doctorId}/availability-schedule`);


// ── Appointments ─────────────────────────────────
export const bookAppointment = (data) => api.post('/appointments/book', data);
export const getPatientAppointments = (pid) => api.get(`/appointments/patient/${pid}`);
export const getDoctorAppointments = (did) => api.get(`/appointments/doctor/${did}`);
export const updateAppointmentStatus = (aid, status) =>
  api.patch(`/appointments/${aid}/status`, { status });
export const cancelAppointment = (aid) => api.delete(`/appointments/${aid}`);

// ── Medical Records ───────────────────────────────
export const createRecord = (data) => api.post('/records/create', data);
export const getPatientRecords = (pid) => api.get(`/records/patient/${pid}`);

// ── Vitals ────────────────────────────────────────
export const addVitals = (data) => api.post('/vitals/add', data);
export const getPatientVitals = (pid) => api.get(`/vitals/patient/${pid}`);
export const getLatestVitals = (pid) => api.get(`/vitals/latest/${pid}`);
export const getDoctorVitals = (did) => api.get(`/vitals/doctor/${did}`);

// ── AI ────────────────────────────────────────────
export const checkSymptoms = (symptoms) => api.post('/ai/symptom-check', { symptoms });
export const getPatientRisk = (patient_id) => api.post('/ai/patient-risk', { patient_id });
export const getHighRiskPatients = () => api.get('/alerts/high-risk-patients');

// ── Pharmacy ──────────────────────────────────────
export const getAllPharmacies = () => api.get('/pharmacies');
export const getNearbyPharmacies = (district) => api.get(`/pharmacies/nearby?district=${district}`);
export const checkMedicineAvailability = (name) => api.get(`/medicines/availability/${name}`);
export const searchMedicines = (name) => api.get(`/medicines/search?name=${name}`);
export const registerPharmacy = (data) => api.post('/pharmacies/register', data);
export const addMedicine = (data) => api.post('/medicines/add', data);
export const updateInventory = (data) => api.post('/pharmacies/inventory/update', data);
export const getAllMedicines = () => api.get('/medicines');

// ── ASHA ──────────────────────────────────────────
export const getAllAshaWorkers = () => api.get('/asha/');
export const getAshaWorker = (id) => api.get(`/asha/${id}`);
export const registerAshaWorker = (data) => api.post('/asha/register', data);
export const ashaLogin = (phone) => api.post('/asha/login', { phone });

// ── Voice Reports ─────────────────────────────────
export const getPatientVoiceReports = (pid) => api.get(`/voice-report/patient/${pid}`);

// ── Sync ──────────────────────────────────────────
export const syncRecords = (records) => api.post('/sync/patient-records', { records });
