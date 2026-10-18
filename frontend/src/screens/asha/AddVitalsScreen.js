import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { addVitals, getAllDoctors } from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

const AddVitalsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(true);
  const [docModal, setDocModal] = useState(false);

  const initialPatientId = route?.params?.patientId || '';

  const [form, setForm] = useState({
    patient_id: initialPatientId,
    assigned_doctor_id: '',
    systolic_bp: '',
    diastolic_bp: '',
    heart_rate: '',
    spo2: '',
    temperature: '',
    blood_sugar: '',
    weight: '',
    height: '',
  });

  React.useEffect(() => {
    if (route?.params?.patientId) {
      setForm(f => ({ ...f, patient_id: route.params.patientId }));
    }
  }, [route?.params?.patientId]);


  React.useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await getAllDoctors();
        const available = res.data.filter(d => d.availability_status !== false);
        setDoctors(available);
      } catch (err) { } finally { setFetchingDocs(false); }
    };
    fetchDocs();
  }, []);

  const handleChange = (key, val) => setForm({ ...form, [key]: val });

  const handleSubmit = async () => {
    if (!form.patient_id) {
      Alert.alert('Error', 'Patient ID is required');
      return;
    }

    const payload = {
      patient_id: form.patient_id,
      asha_id: user.id || 'ASHA-TEST',
      assigned_doctor_id: form.assigned_doctor_id || null,
      ...Object.fromEntries(
        Object.entries(form)
          .filter(([k]) => k !== 'patient_id' && k !== 'assigned_doctor_id')
          .map(([k, v]) => [k, v ? parseFloat(v) : null])
      )
    };

    try {
      setLoading(true);
      const res = await addVitals(payload);
      
      const alerts = res.data.alerts;
      const navBack = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Dashboard');
        }
      };

      if (alerts && alerts.length > 0) {
        Alert.alert('Health Alerts Detected!', alerts.join('\n\n'), [
          { text: 'OK', onPress: navBack }
        ]);
        if (Platform.OS === 'web') {
          navBack();
        }
      } else {
        Alert.alert('Success', 'Vitals recorded successfully.', [
          { text: 'OK', onPress: navBack }
        ]);
        if (Platform.OS === 'web') {
          navBack();
        }
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to submit vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Data Entry" subtitle="Record Vitals" roleColor={colors.purple} onBack={() => navigation.goBack()} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, width: '100%' }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={true}
        >
          
          <GlassCard style={styles.card}>
            <InputField label="Patient ID *" placeholder="E.g., PAT-2024-0001" value={form.patient_id} onChangeText={v => handleChange('patient_id', v)} autoCapitalize="characters" />
            
            <Text style={styles.label}>Assign to Doctor (Optional)</Text>
            <TouchableOpacity 
              style={styles.pickerTrigger} 
              onPress={() => !fetchingDocs && doctors.length > 0 && setDocModal(true)}
            >
              <Text style={[styles.triggerText, !form.assigned_doctor_id && { color: colors.textMuted }]}>
                {fetchingDocs ? "Loading doctors..." : 
                 doctors.length === 0 ? "No doctors available" :
                 (doctors.find(d => d.doctor_id === form.assigned_doctor_id)?.name ? `Dr. ${doctors.find(d => d.doctor_id === form.assigned_doctor_id).name}` : "Select a Doctor")}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            
            <View style={styles.row}>
              <InputField style={styles.half} label="Sys BP (mmHg)" placeholder="120" keyboardType="numeric" value={form.systolic_bp} onChangeText={v => handleChange('systolic_bp', v)} />
              <InputField style={styles.half} label="Dia BP (mmHg)" placeholder="80" keyboardType="numeric" value={form.diastolic_bp} onChangeText={v => handleChange('diastolic_bp', v)} />
            </View>

            <View style={styles.row}>
              <InputField style={styles.half} label="Heart Rate (bpm)" placeholder="72" keyboardType="numeric" value={form.heart_rate} onChangeText={v => handleChange('heart_rate', v)} />
              <InputField style={styles.half} label="SpO2 (%)" placeholder="98" keyboardType="numeric" value={form.spo2} onChangeText={v => handleChange('spo2', v)} />
            </View>

            <View style={styles.row}>
              <InputField style={styles.half} label="Temp (°C)" placeholder="37.0" keyboardType="numeric" value={form.temperature} onChangeText={v => handleChange('temperature', v)} />
              <InputField style={styles.half} label="Blood Sugar" placeholder="110" keyboardType="numeric" value={form.blood_sugar} onChangeText={v => handleChange('blood_sugar', v)} />
            </View>

            <View style={styles.row}>
              <InputField style={styles.half} label="Weight (kg)" placeholder="65" keyboardType="numeric" value={form.weight} onChangeText={v => handleChange('weight', v)} />
              <InputField style={styles.half} label="Height (cm)" placeholder="165" keyboardType="numeric" value={form.height} onChangeText={v => handleChange('height', v)} />
            </View>

            <GradientButton 
              title="Save & Analyze Vitals" 
              gradient={colors.gradientPurple}
              onPress={handleSubmit} 
              loading={loading}
              style={{ marginTop: 20 }}
            />
          </GlassCard>

        </ScrollView>
      </KeyboardAvoidingView>


      {docModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Doctor</Text>
              <TouchableOpacity onPress={() => setDocModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {doctors.map((item) => (
                <TouchableOpacity 
                  key={item.doctor_id}
                  style={[styles.modalItem, form.assigned_doctor_id === item.doctor_id && styles.modalItemActive]}
                  onPress={() => { handleChange('assigned_doctor_id', item.doctor_id); setDocModal(false); }}
                >
                  <View>
                    <Text style={styles.docName}>Dr. {item.name}</Text>
                    <Text style={styles.docSpec}>{item.specialization}</Text>
                  </View>
                  {form.assigned_doctor_id === item.doctor_id && <Ionicons name="checkmark-circle" size={20} color={colors.cyan} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => { handleChange('assigned_doctor_id', ''); setDocModal(false); }} style={{marginTop:10, padding:10, alignItems:'center'}}>
              <Text style={{color:colors.textMuted}}>Clear Selection</Text>
            </TouchableOpacity>
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
  card: { padding: 20 },
  row: { flexDirection: 'row', gap: 16 },
  half: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  triggerText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  modalOverlay: { position: 'absolute', top:0, bottom:0, left:0, right:0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: '#0F1729', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemActive: { backgroundColor: 'rgba(0,201,255,0.05)', borderRadius: 12, paddingHorizontal: 12, borderColor: 'transparent' },
  docName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  docSpec: { color: colors.textMuted, fontSize: 12 },
});

export default AddVitalsScreen;
