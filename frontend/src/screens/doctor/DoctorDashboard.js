import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, ActivityIndicator, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorAppointments, updateAppointmentStatus, updateDoctorAvailability, getDoctorVitals, createRecord } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

// WebView only on native — must be AFTER imports to avoid bundle error
const WebViewComponent = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

const DoctorDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'video', 'audio', 'in-person'
  const [vitalsList, setVitalsList] = useState([]);

  // In-Call Prescription State
  const [rxModal, setRxModal] = useState(false);
  const [rxMeds, setRxMeds] = useState([]);
  const [medInput, setMedInput] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxLoading, setRxLoading] = useState(false);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const res = await getDoctorAppointments(user.id);
      // Sort so 'pending' and 'confirmed' are at top
      const sorted = res.data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
      setAppointments(sorted);

      const vitalsRes = await getDoctorVitals(user.id);
      setVitalsList(vitalsRes.data || []);
    } catch (err) {
      console.log("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  const toggleAvailability = async (val) => {
    setIsAvailable(val);
    try {
      await updateDoctorAvailability(user.id, val);
    } catch(err) {
      setIsAvailable(!val); // revert on fail
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      loadDocs();
    } catch (err) {
      console.log("Error updating status");
    }
  };

  // Dummy AI logic for demo purposes — extracting key terms from symptom strings
  const generateAIAssistantSummary = (symptoms) => {
    if (!symptoms) return "No symptoms provided.";
    const txt = symptoms.toLowerCase();
    let condition = "General Consultation";
    if (txt.includes("fever") && txt.includes("cough")) condition = "Possible Viral/Flu";
    if (txt.includes("chest pain") || txt.includes("breath")) condition = "CRITICAL: Cardiac/Respiratory Check Required";
    if (txt.includes("sugar") || txt.includes("diabetes")) condition = "Diabetic Review";
    return condition;
  };

  const handleSavePrescription = async () => {
    const appt = appointments.find(a => a.appointment_id === activeVideo);
    if (!appt) return alert("Error finding active appointment.");
    
    try {
      setRxLoading(true);
      await createRecord({
        patient_id: appt.patient_id,
        doctor_id: user.id,
        diagnosis: rxNotes ? "Teleconsultation Assessment" : "General Consult",
        prescription: rxMeds,
        notes: rxNotes
      });
      alert("Prescription saved successfully to Patient Records!");
      setRxModal(false);
      setRxMeds([]);
      setRxNotes('');
    } catch (err) {
      alert("Failed to save prescription. " + (err.response?.data?.detail || err.message));
    } finally {
      setRxLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Clinic" subtitle="Doctor Portal" roleColor={colors.green} rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
      >

        <GlassCard style={styles.controlCard} accent>
          <View style={styles.ctrlHeader}>
            <View>
              <Text style={styles.ctrlTitle}>Taking New Consultations</Text>
              <Text style={styles.ctrlDesc}>You are currently {isAvailable ? 'visible' : 'hidden'} to patients.</Text>
            </View>
            <Switch 
              value={isAvailable} 
              onValueChange={toggleAvailability} 
              trackColor={{ false: '#3e3e3e', true: 'rgba(0,242,169,0.5)' }} 
              thumbColor={isAvailable ? colors.green : '#f4f3f4'}
            />
          </View>
        </GlassCard>

        {/* Assigned Vitals from ASHA */}
        {vitalsList.length > 0 && (
          <View style={{marginBottom: 30}}>
            <Text style={styles.sectionTitle}>Recently Assigned Patient Reports</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 16}}>
              {vitalsList.map((item) => (
                <GlassCard key={item.vitals.vitals_id} style={{width: 280, padding: 16}}>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>{item.vitals.patient_id}</Text>
                    <Text style={{color: colors.textMuted, fontSize: 12}}>{new Date(item.vitals.recorded_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6}}>
                    <Text style={{color: colors.textSecondary, fontSize: 13}}>BP: <Text style={{color: '#00C9FF', fontWeight: 'bold'}}>{item.vitals.systolic_bp}/{item.vitals.diastolic_bp}</Text></Text>
                    <Text style={{color: colors.textSecondary, fontSize: 13}}>SpO2: <Text style={{color: '#00f2a9', fontWeight: 'bold'}}>{item.vitals.spo2}%</Text></Text>
                  </View>
                  <Text style={{color: colors.textSecondary, fontSize: 13, marginBottom: 10}}>Temp: <Text style={{color: '#fff', fontWeight: 'bold'}}>{item.vitals.temperature}°C</Text></Text>
                  {item.alerts && item.alerts.length > 0 && (
                     <View style={{backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: 8, borderRadius: 8}}>
                        {item.alerts.map((a, i) => <Text key={i} style={{color: '#EF4444', fontSize: 11}}>{a}</Text>)}
                     </View>
                  )}
                </GlassCard>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Queue & AI Summaries</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['all', 'video', 'audio', 'in-person'].map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'in-person' ? 'Personal Visit' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + ' Call'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={colors.green} size="large" style={{ marginTop: 40 }} />
        ) : appointments.filter(a => filter === 'all' || a.consultation_type === filter).length === 0 ? (
          <Text style={styles.emptyText}>No {filter !== 'all' ? filter : ''} appointments in queue.</Text>
        ) : (
          appointments.filter(a => filter === 'all' || a.consultation_type === filter).map(a => (
            <GlassCard key={a.appointment_id} style={styles.apptCard}>
              <View style={styles.apptHeader}>
                <Text style={styles.pName}>{a.patient_id}</Text>
                <StatusBadge status={a.status} />
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{a.appointment_date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="videocam" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{a.consultation_type.toUpperCase()}</Text>
                </View>
              </View>

              {/* AI Doctor Assistant Summary Box */}
              <View style={styles.aiBox}>
                <View style={styles.aiTitleRow}>
                  <Ionicons name="sparkles" size={14} color={colors.purple} />
                  <Text style={styles.aiTitle}>AI Patient Summary</Text>
                </View>
                <Text style={styles.aiRaw}>Raw Input: "{a.symptoms || 'None'}"</Text>
                <Text style={styles.aiResult}>Assessment: {generateAIAssistantSummary(a.symptoms)}</Text>
              </View>

              {/* Actions */}
              {a.status === 'pending' && (
                <View style={styles.actionRow}>
                  <GradientButton title="Confirm" gradient={colors.gradientGreen} onPress={() => handleStatusUpdate(a.appointment_id, 'confirmed')} style={{ flex: 1 }} />
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleStatusUpdate(a.appointment_id, 'cancelled')}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {a.status === 'confirmed' && a.consultation_type !== 'in-person' && (
                <GradientButton 
                  title={`Start ${a.consultation_type === 'video' ? 'Video' : 'Audio'} Call`}
                  gradient={colors.gradientBlue} 
                  icon={a.consultation_type === 'video' ? 'videocam' : 'call'}
                  onPress={() => setActiveVideo(a.appointment_id)}
                  style={{ marginTop: 10 }}
                />
              )}

              {a.status === 'confirmed' && (
                <TouchableOpacity style={styles.completeBtn} onPress={() => handleStatusUpdate(a.appointment_id, 'completed')}>
                  <Text style={styles.completeBtnText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}

            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Embedded Jitsi Call */}
      <Modal visible={!!activeVideo} animationType="slide">
        <View style={styles.videoContainer}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoTitle}>Teleconsultation</Text>
            <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity onPress={() => setRxModal(true)} style={[styles.closeBtn, {backgroundColor: colors.purple}]}>
                <Text style={styles.closeText}>+ Prescribe</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveVideo(null)} style={styles.closeBtn}>
                <Text style={styles.closeText}>End Call</Text>
              </TouchableOpacity>
            </View>
          </View>
          {activeVideo && (
            Platform.OS === 'web' ? (
              <iframe
                src={`https://meet.jit.si/AshaTeleHealth_${activeVideo}`}
                style={{ flex: 1, border: 0, width: '100%', height: '100%' }}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                allowFullScreen
              />
            ) : (
              WebViewComponent && <WebViewComponent
                source={{ uri: `https://meet.jit.si/AshaTeleHealth_${activeVideo}` }}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
              />
            )
          )}
        </View>
      </Modal>

      {/* In-Call Prescription Modal */}
      {rxModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write Prescription</Text>
              <TouchableOpacity onPress={() => setRxModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
                <View style={{flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingHorizontal: 12}}>
                  <Text style={{color: colors.textMuted, fontSize: 12, marginTop: 10}}>Medicine Name & Dose (e.g. Paracetamol 500mg 1-0-1)</Text>
                  {/* Let's just use a normal InputField from our UI components */}
                </View>
              </View>

              <View style={{flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16}}>
                 <View style={{flex: 1}}>
                    <Text style={{fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6}}>Medicine Name & Dose</Text>
                    <View style={{backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 50, justifyContent:'center'}}>
                      {/* Using React Native standard TextInput injected if needed, but wait, InputField takes onChangeText */}
                      <TextInput 
                        style={{color: '#fff', fontSize: 14, height: '100%'}} 
                        placeholder="E.g., Paracetamol 500mg (1-0-1)" 
                        placeholderTextColor={colors.textMuted}
                        value={medInput}
                        onChangeText={setMedInput}
                      />
                    </View>
                 </View>
                 <TouchableOpacity 
                   style={{backgroundColor: colors.cyan, height: 50, paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center'}}
                   onPress={() => {
                     if(medInput.trim()){ setRxMeds([...rxMeds, medInput.trim()]); setMedInput(''); }
                   }}
                 >
                   <Text style={{color: '#000', fontWeight: 'bold'}}>Add</Text>
                 </TouchableOpacity>
              </View>

              {rxMeds.length > 0 && (
                <View style={{marginBottom: 20, padding: 10, backgroundColor: 'rgba(0,201,255,0.05)', borderRadius: 8}}>
                  {rxMeds.map((m, idx) => (
                    <View key={idx} style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4}}>
                      <Text style={{color: '#fff'}}>• {m}</Text>
                      <TouchableOpacity onPress={() => setRxMeds(rxMeds.filter((_, i) => i !== idx))}>
                        <Ionicons name="trash" size={16} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={{fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6}}>Consultation Notes / Diagnosis</Text>
              <View style={{backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, minHeight: 100, marginBottom: 20}}>
                <TextInput 
                  style={{color: '#fff', fontSize: 14, paddingTop: 12, paddingBottom: 12}} 
                  placeholder="Rest 3 days, drink water..." 
                  placeholderTextColor={colors.textMuted}
                  multiline
                  value={rxNotes}
                  onChangeText={setRxNotes}
                />
              </View>

              <GradientButton 
                title="Save & Send to Patient" 
                gradient={colors.gradientBlue}
                onPress={handleSavePrescription}
                loading={rxLoading}
              />
            </ScrollView>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 16 },
  
  controlCard: { padding: 20, marginBottom: 30, borderColor: 'rgba(0,242,169,0.3)' },
  ctrlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctrlTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  ctrlDesc: { color: colors.textSecondary, fontSize: 13 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },

  filterRow: { flexDirection: 'row', marginBottom: 20, flexGrow: 0 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: 'rgba(0,242,169,0.15)', borderColor: colors.green },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: colors.green, fontWeight: '700' },

  apptCard: { padding: 18, marginBottom: 16 },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pName: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  
  detailsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  aiBox: { backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)' },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { color: colors.purple, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  aiRaw: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 6 },
  aiResult: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: colors.red, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rejectText: { color: colors.red, fontSize: 14, fontWeight: '700' },

  completeBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
  completeBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  videoContainer: { flex: 1, backgroundColor: '#000' },
  videoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#111' },
  videoTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { backgroundColor: colors.red, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '700' },
  webview: { flex: 1, backgroundColor: '#000' },
  
  modalOverlay: { position: 'absolute', top:0, bottom:0, left:0, right:0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: '#0F1729', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default DoctorDashboard;
