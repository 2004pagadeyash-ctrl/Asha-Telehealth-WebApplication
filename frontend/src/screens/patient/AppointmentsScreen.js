import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getPatientAppointments, cancelAppointment, bookAppointment, getAllDoctors } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

const AppointmentsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null); // stores appointment_id to join string

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await getPatientAppointments(user.id);
      setAppointments(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  const handleCancel = async (id) => {
    try {
      await cancelAppointment(id);
      loadAppointments();
    } catch (err) {
      console.log("Error cancelling:", err);
    }
  };

  const joinVideoCall = (appointmentId) => {
    setActiveVideo(appointmentId);
  };

  return (
    <View style={styles.container}>
      <Header title="Consultations" subtitle="Your Appointments" rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
      >
        <GradientButton 
          title="Book New Appointment" 
          icon="add"
          onPress={() => navigation.navigate("BookAppointment")} // Will build next
          style={{ marginBottom: 20 }}
        />

        {loading ? (
          <ActivityIndicator color={colors.cyan} size="large" style={{ marginTop: 40 }}/>
        ) : appointments.length === 0 ? (
          <Text style={styles.emptyText}>No appointments found.</Text>
        ) : (
          appointments.map(a => (
            <GlassCard key={a.appointment_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.docName}>Dr. {a.doctor_id}</Text>
                <StatusBadge status={a.status} />
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{a.appointment_date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{a.appointment_time}</Text>
                </View>
              </View>

              <Text style={styles.typeText}>Type: {a.consultation_type.toUpperCase()}</Text>
              
              {a.symptoms && (
                <View style={styles.symptomBox}>
                  <Text style={styles.symptomLabel}>Symptoms logged:</Text>
                  <Text style={styles.symptomText}>{a.symptoms}</Text>
                </View>
              )}

              <View style={styles.actionRow}>
                {a.status !== 'cancelled' && a.status !== 'completed' && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(a.appointment_id)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                
                {a.status === 'confirmed' && a.consultation_type !== 'in-person' && (
                  <TouchableOpacity style={styles.joinBtn} onPress={() => joinVideoCall(a.appointment_id)}>
                    <Ionicons name="videocam" size={16} color="#fff" />
                    <Text style={styles.joinText}>Join Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Jitsi Video Call Modal */}
      <Modal visible={!!activeVideo} animationType="slide">
        <View style={styles.videoContainer}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoTitle}>Teleconsultation</Text>
            <TouchableOpacity onPress={() => setActiveVideo(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Leave Call</Text>
            </TouchableOpacity>
          </View>
          {activeVideo && (
            <WebView 
              source={{ uri: `https://meet.jit.si/AshaTeleHealth_${activeVideo}` }}
              style={styles.webview}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
            />
          )}
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 16 },
  
  card: { padding: 18, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  docName: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  
  detailsRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  
  typeText: { color: colors.cyan, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  
  symptomBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, marginBottom: 16 },
  symptomLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
  symptomText: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.red },
  cancelText: { color: colors.red, fontSize: 14, fontWeight: '600' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.green, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  joinText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  videoContainer: { flex: 1, backgroundColor: '#000' },
  videoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#111' },
  videoTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { backgroundColor: colors.red, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '700' },
  webview: { flex: 1, backgroundColor: '#000' },
});

export default AppointmentsScreen;
