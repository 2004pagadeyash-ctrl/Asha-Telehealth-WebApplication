import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAllPatients, getPatientById, getPatientRecords,
  getPatientVitals, createRecord, getPatientVoiceReports
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

const PatientHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Patient detail data
  const [records, setRecords] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [voiceReports, setVoiceReports] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('records'); // 'records', 'vitals', 'prescribe'

  // New Consultation / Prescription Form
  const [diagnosis, setDiagnosis] = useState('');
  const [medInput, setMedInput] = useState('');
  const [medsList, setMedsList] = useState([]);
  const [notes, setNotes] = useState('');
  const [savingRecord, setSavingRecord] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await getAllPatients();
      setPatients(res.data);
      if (res.data.length > 0) {
        selectPatient(res.data[0]);
      }
    } catch (err) {
      console.log('Failed to fetch patients', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setDetailLoading(true);
    try {
      const [recRes, vitRes, voiceRes] = await Promise.allSettled([
        getPatientRecords(patient.patient_id),
        getPatientVitals(patient.patient_id),
        getPatientVoiceReports(patient.patient_id),
      ]);

      setRecords(recRes.status === 'fulfilled' ? recRes.value.data : []);
      setVitals(vitRes.status === 'fulfilled' ? vitRes.value.data : []);
      setVoiceReports(voiceRes.status === 'fulfilled' ? voiceRes.value.data : []);
    } catch (err) {
      console.log('Detail load error', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddMed = () => {
    if (!medInput.trim()) return;
    setMedsList([...medsList, medInput.trim()]);
    setMedInput('');
  };

  const handleRemoveMed = (index) => {
    setMedsList(medsList.filter((_, i) => i !== index));
  };

  const handleSavePrescription = async () => {
    if (!selectedPatient) return;
    if (!diagnosis.trim()) {
      Alert.alert('Missing Field', 'Please enter a clinical diagnosis.');
      return;
    }

    try {
      setSavingRecord(true);
      await createRecord({
        patient_id: selectedPatient.patient_id,
        doctor_id: user?.id || 'DOC-DEFAULT',
        diagnosis: diagnosis.trim(),
        prescription: medsList,
        notes: notes.trim()
      });

      Alert.alert('Success', 'Medical record & prescription saved successfully!');
      setDiagnosis('');
      setMedsList([]);
      setNotes('');
      // Refresh patient records
      const recRes = await getPatientRecords(selectedPatient.patient_id);
      setRecords(recRes.data);
      setActiveTab('records');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save record.');
    } finally {
      setSavingRecord(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.full_name && p.full_name.toLowerCase().includes(q)) ||
      (p.patient_id && p.patient_id.toLowerCase().includes(q)) ||
      (p.village && p.village.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  });

  return (
    <View style={styles.container}>
      <Header
        title="Patient Records"
        subtitle="Clinical History & Prescriptions"
        roleColor={colors.green}
        rightIcon="menu"
        onRightPress={() => navigation.toggleDrawer()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search & Patient Select Strip */}
        <GlassCard style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Select or Search Patient</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID, name, or phone..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.green} style={{ marginVertical: 14 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientChips}>
              {filteredPatients.map(p => {
                const isSelected = selectedPatient?.patient_id === p.patient_id;
                return (
                  <TouchableOpacity
                    key={p.patient_id}
                    style={[styles.patientChip, isSelected && styles.patientChipActive]}
                    onPress={() => selectPatient(p)}
                  >
                    <View style={[styles.avatar, isSelected && { backgroundColor: 'rgba(0,242,169,0.2)' }]}>
                      <Ionicons name="person" size={16} color={isSelected ? colors.green : colors.textSecondary} />
                    </View>
                    <View>
                      <Text style={[styles.chipName, isSelected && { color: colors.green }]}>{p.full_name}</Text>
                      <Text style={styles.chipSub}>{p.patient_id} • {p.village || 'Village'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {filteredPatients.length === 0 && (
                <Text style={styles.noPatientsText}>No matching patients found.</Text>
              )}
            </ScrollView>
          )}
        </GlassCard>

        {/* Selected Patient Banner */}
        {selectedPatient && (
          <GlassCard style={[styles.patientHeaderCard, { marginTop: 16 }]} accent>
            <View style={styles.pHeaderRow}>
              <View style={styles.pHeaderLeft}>
                <Text style={styles.patientName}>{selectedPatient.full_name}</Text>
                <Text style={styles.patientId}>{selectedPatient.patient_id} • {selectedPatient.gender}, {selectedPatient.age} yrs</Text>
              </View>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>{selectedPatient.blood_group || 'O+'}</Text>
              </View>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.colLabel}>Village / District</Text>
                <Text style={styles.colVal}>{selectedPatient.village || 'N/A'}, {selectedPatient.district || 'N/A'}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.colLabel}>Phone</Text>
                <Text style={styles.colVal}>{selectedPatient.phone || 'N/A'}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.colLabel}>Allergies</Text>
                <Text style={[styles.colVal, { color: colors.orange }]}>
                  {Array.isArray(selectedPatient.allergies) && selectedPatient.allergies.length > 0
                    ? selectedPatient.allergies.join(', ')
                    : 'None reported'}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.colLabel}>Conditions</Text>
                <Text style={[styles.colVal, { color: colors.cyan }]}>
                  {Array.isArray(selectedPatient.existing_conditions) && selectedPatient.existing_conditions.length > 0
                    ? selectedPatient.existing_conditions.join(', ')
                    : 'None'}
                </Text>
              </View>
            </View>

            {/* Segmented Control */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'records' && styles.tabBtnActive]}
                onPress={() => setActiveTab('records')}
              >
                <Ionicons name="document-text" size={15} color={activeTab === 'records' ? colors.green : colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
                  Past Records ({records.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'vitals' && styles.tabBtnActive]}
                onPress={() => setActiveTab('vitals')}
              >
                <Ionicons name="pulse" size={15} color={activeTab === 'vitals' ? colors.green : colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'vitals' && styles.tabTextActive]}>
                  Vitals ({vitals.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'prescribe' && styles.tabBtnActive]}
                onPress={() => setActiveTab('prescribe')}
              >
                <Ionicons name="pencil" size={15} color={activeTab === 'prescribe' ? colors.green : colors.textSecondary} />
                <Text style={[styles.tabText, activeTab === 'prescribe' && styles.tabTextActive]}>
                  + Prescribe
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Tab 1: Past Medical Records */}
        {activeTab === 'records' && (
          <View style={{ marginTop: 16 }}>
            {detailLoading ? (
              <ActivityIndicator color={colors.green} size="large" style={{ marginVertical: 30 }} />
            ) : records.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="file-tray-outline" size={40} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No Previous Records Found</Text>
                <Text style={styles.emptySub}>Tap "+ Prescribe" to record a new assessment or prescription.</Text>
              </GlassCard>
            ) : (
              records.map(r => (
                <GlassCard key={r.record_id} style={styles.recordCard}>
                  <View style={styles.recHeader}>
                    <View style={styles.recIconBg}>
                      <Ionicons name="medical" size={20} color={colors.green} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recDiagnosis}>{r.diagnosis || 'Clinical Consult'}</Text>
                      <Text style={styles.recDate}>
                        {r.consultation_date ? new Date(r.consultation_date).toLocaleDateString('en-IN') : 'Date Unknown'} • Dr. {r.doctor_id}
                      </Text>
                    </View>
                  </View>

                  {Array.isArray(r.prescription) && r.prescription.length > 0 && (
                    <View style={styles.prescBox}>
                      <Text style={styles.prescTitle}>Prescribed Medications:</Text>
                      {r.prescription.map((p, i) => (
                        <View key={i} style={styles.medRow}>
                          <Ionicons name="ellipse" size={6} color={colors.green} style={{ marginTop: 6 }} />
                          <Text style={styles.medText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {r.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesTitle}>Doctor's Clinical Notes:</Text>
                      <Text style={styles.notesText}>{r.notes}</Text>
                    </View>
                  ) : null}
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Vitals History */}
        {activeTab === 'vitals' && (
          <View style={{ marginTop: 16 }}>
            {detailLoading ? (
              <ActivityIndicator color={colors.green} size="large" style={{ marginVertical: 30 }} />
            ) : vitals.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Ionicons name="heart-outline" size={40} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No Vitals Recorded Yet</Text>
                <Text style={styles.emptySub}>ASHA workers record field vitals (BP, SpO2, Temperature).</Text>
              </GlassCard>
            ) : (
              vitals.map(v => (
                <GlassCard key={v.vitals_id || Math.random()} style={styles.vitalCard}>
                  <View style={styles.vitalHeader}>
                    <Text style={styles.vitalDate}>
                      Recorded {v.recorded_at ? new Date(v.recorded_at).toLocaleString('en-IN') : 'Recently'}
                    </Text>
                    {v.recorded_by && <Text style={styles.vitalBy}>by {v.recorded_by}</Text>}
                  </View>
                  <View style={styles.vitalRow}>
                    <View style={styles.vStat}>
                      <Text style={styles.vLabel}>Blood Pressure</Text>
                      <Text style={[styles.vVal, { color: colors.cyan }]}>
                        {v.systolic_bp || '--'}/{v.diastolic_bp || '--'} mmHg
                      </Text>
                    </View>
                    <View style={styles.vStat}>
                      <Text style={styles.vLabel}>Oxygen (SpO2)</Text>
                      <Text style={[styles.vVal, { color: colors.green }]}>{v.spo2 ? `${v.spo2}%` : '--'}</Text>
                    </View>
                    <View style={styles.vStat}>
                      <Text style={styles.vLabel}>Heart Rate</Text>
                      <Text style={styles.vVal}>{v.heart_rate ? `${v.heart_rate} bpm` : '--'}</Text>
                    </View>
                    <View style={styles.vStat}>
                      <Text style={styles.vLabel}>Temperature</Text>
                      <Text style={styles.vVal}>{v.temperature ? `${v.temperature}°C` : '--'}</Text>
                    </View>
                  </View>
                  {v.blood_sugar && (
                    <Text style={styles.sugarText}>Blood Sugar: <Text style={{ color: colors.orange, fontWeight: '700' }}>{v.blood_sugar} mg/dL</Text></Text>
                  )}
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* Tab 3: Prescribe / Write Record */}
        {activeTab === 'prescribe' && selectedPatient && (
          <GlassCard style={[styles.formCard, { marginTop: 16 }]}>
            <Text style={styles.formHeader}>Write Clinical Consultation & Rx</Text>
            <Text style={styles.formSub}>Patient: {selectedPatient.full_name} ({selectedPatient.patient_id})</Text>

            <InputField
              label="Diagnosis / Assessment *"
              placeholder="E.g., Acute Bronchitis, Type 2 Diabetes follow-up"
              value={diagnosis}
              onChangeText={setDiagnosis}
              style={{ marginBottom: 12 }}
            />

            <Text style={styles.label}>Add Prescribed Medicines</Text>
            <View style={styles.medAddRow}>
              <TextInput
                style={styles.medInput}
                placeholder="E.g., Paracetamol 500mg 1-0-1 after meals"
                placeholderTextColor={colors.textMuted}
                value={medInput}
                onChangeText={setMedInput}
                onSubmitEditing={handleAddMed}
              />
              <TouchableOpacity style={styles.addMedBtn} onPress={handleAddMed}>
                <Ionicons name="add" size={20} color="#000" />
                <Text style={styles.addMedBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {medsList.length > 0 && (
              <View style={styles.medsChipsContainer}>
                {medsList.map((med, idx) => (
                  <View key={idx} style={styles.medPill}>
                    <Text style={styles.medPillText}>{med}</Text>
                    <TouchableOpacity onPress={() => handleRemoveMed(idx)}>
                      <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <InputField
              label="Doctor's Instructions & Diet Advice"
              placeholder="E.g., Drink warm fluids, avoid cold water, review in 5 days."
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ minHeight: 90, marginTop: 12 }}
            />

            <GradientButton
              title="Save & Issue Prescription"
              gradient={colors.gradientGreen}
              loading={savingRecord}
              onPress={handleSavePrescription}
              style={{ marginTop: 20 }}
            />
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },

  searchCard: { padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 42, marginBottom: 12 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, marginLeft: 8 },

  patientChips: { gap: 10, paddingVertical: 4 },
  patientChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#0D1526', borderWidth: 1, borderColor: colors.borderAccent },
  patientChipActive: { borderColor: colors.green, backgroundColor: 'rgba(0,242,169,0.1)' },
  avatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  chipName: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  chipSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  noPatientsText: { color: colors.textMuted, fontSize: 13, padding: 10 },

  // Selected Patient Header
  patientHeaderCard: { padding: 18, borderRadius: 18 },
  pHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  pHeaderLeft: { flex: 1 },
  patientName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  patientId: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  bloodBadge: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bloodText: { color: '#EF4444', fontSize: 14, fontWeight: '800' },

  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, marginBottom: 16 },
  detailCol: { width: '47%' },
  colLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  colVal: { fontSize: 13, color: colors.textPrimary, fontWeight: '500', marginTop: 2 },

  // Tabs
  tabsRow: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingTop: 14 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
  tabBtnActive: { backgroundColor: 'rgba(0,242,169,0.15)', borderWidth: 1, borderColor: colors.green },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.green, fontWeight: '700' },

  // Cards
  recordCard: { padding: 16, borderRadius: 14, marginBottom: 12 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  recIconBg: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,242,169,0.1)', alignItems: 'center', justifyContent: 'center' },
  recDiagnosis: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  recDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  prescBox: { backgroundColor: 'rgba(0,242,169,0.05)', padding: 12, borderRadius: 10, marginBottom: 10 },
  prescTitle: { color: colors.green, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  medRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  medText: { color: colors.textPrimary, fontSize: 13 },
  notesBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 },
  notesTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  notesText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },

  vitalCard: { padding: 16, borderRadius: 14, marginBottom: 12 },
  vitalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  vitalDate: { color: colors.textMuted, fontSize: 12 },
  vitalBy: { color: colors.purple, fontSize: 12, fontWeight: '600' },
  vitalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vStat: { width: '47%', backgroundColor: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 },
  vLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  vVal: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 3 },
  sugarText: { color: colors.textSecondary, fontSize: 12, marginTop: 8 },

  emptyCard: { padding: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },

  // Prescribe Form
  formCard: { padding: 18, borderRadius: 16 },
  formHeader: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  formSub: { fontSize: 13, color: colors.green, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  medAddRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  medInput: { flex: 1, backgroundColor: colors.bgInput, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44, color: colors.textPrimary, fontSize: 13 },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
  addMedBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },
  medsChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  medPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,242,169,0.1)', borderWidth: 1, borderColor: 'rgba(0,242,169,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  medPillText: { color: colors.textPrimary, fontSize: 12, fontWeight: '500' },
});

export default PatientHistoryScreen;
