import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getPatientAppointments, getLatestVitals } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors } from '../../theme/colors';

// Dummy Notifications for demo
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'pill', title: 'Medicine Reminder', msg: 'Take Paracetamol 500mg at 8 PM', icon: 'medical' },
  { id: 2, type: 'camp', title: 'Health Camp Alert', msg: 'Free vaccination drive this Sunday at Civil Hospital', icon: 'business' },
];

const PatientDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [vitals, setVitals] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const apptRes = await getPatientAppointments(user.id);
      setAppointments(apptRes.data);

      const vitalsRes = await getLatestVitals(user.id);
      setVitals(vitalsRes.data);
    } catch (err) {
      console.log("Error loading dashboard data:", err.message);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        subtitle="Patient Portal"
        rightIcon="menu"
        onRightPress={() => navigation.toggleDrawer()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        
        {/* Notifications */}
        <Text style={styles.sectionTitle}>Reminders & Alerts</Text>
        {MOCK_NOTIFICATIONS.map(n => (
          <GlassCard key={n.id} style={styles.notifCard} accent={n.type === 'camp'}>
            <View style={[styles.iconBg, { backgroundColor: n.type === 'pill' ? 'rgba(0,201,255,0.1)' : 'rgba(0,242,169,0.1)' }]}>
              <Ionicons name={n.icon} size={20} color={n.type === 'pill' ? colors.cyan : colors.green} />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifMsg}>{n.msg}</Text>
            </View>
          </GlassCard>
        ))}

        {/* Next Appointment */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Upcoming Consultation</Text>
        {appointments.length > 0 ? (
          appointments.map(a => (
            <GlassCard key={a.appointment_id} style={styles.apptCard}>
              <View style={styles.apptHeader}>
                <Text style={styles.apptDoc}>Dr. {a?.doctor_id || 'Unknown'}</Text>
                <StatusBadge status={a?.status || 'pending'} />
              </View>
              <View style={styles.apptDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{a.appointment_date || 'Date TBD'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{a.appointment_time || 'Time TBD'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="videocam-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.detailText}>{a.consultation_type ? a.consultation_type.toUpperCase() : 'CONSULTATION'}</Text>
                </View>
              </View>
            </GlassCard>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No upcoming appointments recorded.</Text>
          </View>
        )}

        {/* Latest Vitals Summary */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Latest Health Snapshot</Text>
        {vitals && vitals.vitals ? (
          <GlassCard style={styles.vitalsBox}>
             <View style={styles.vitalStat}>
               <Text style={styles.vitalLabel}>BP</Text>
               <Text style={styles.vitalVal}>{vitals.vitals.systolic_bp || '--'}/{vitals.vitals.diastolic_bp || '--'}</Text>
             </View>
             <View style={styles.divider} />
             <View style={styles.vitalStat}>
               <Text style={styles.vitalLabel}>SpO2</Text>
               <Text style={styles.vitalVal}>{vitals.vitals.spo2 || '--'}%</Text>
             </View>
             <View style={styles.divider} />
             <View style={styles.vitalStat}>
               <Text style={styles.vitalLabel}>Temp</Text>
               <Text style={styles.vitalVal}>{vitals.vitals.temperature || '--'}°C</Text>
             </View>
          </GlassCard>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No vitals recorded yet by ASHA worker.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 100, flexGrow: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  
  notifCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, borderRadius: 16 },
  iconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  notifContent: { flex: 1 },
  notifTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  notifMsg: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },

  apptCard: { padding: 16, marginBottom: 12, borderRadius: 16 },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  apptDoc: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  apptDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },

  vitalsBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  vitalStat: { flex: 1, alignItems: 'center' },
  vitalLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  vitalVal: { color: colors.cyan, fontSize: 18, fontWeight: '800' },
  divider: { width: 1, height: 30, backgroundColor: colors.border },

  emptyBox: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, padding: 20, borderRadius: 16, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});

export default PatientDashboard;
