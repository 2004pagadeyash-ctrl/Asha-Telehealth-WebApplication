import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { getPatientRecords } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import { colors } from '../../theme/colors';

const CACHE_KEY = 'health_records_cache';

const HealthRecordsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadRecords = async (isRefresh = false) => {
    try {
      // Try to fetch fresh from backend
      const res = await getPatientRecords(user.id);
      const data = res.data;
      setRecords(data);
      setIsOffline(false);
      // Cache locally for offline access
      await AsyncStorage.setItem(CACHE_KEY + '_' + user.id, JSON.stringify(data));
    } catch (err) {
      // Fall back to cached data if offline or error
      const cached = await AsyncStorage.getItem(CACHE_KEY + '_' + user.id);
      if (cached) {
        setRecords(JSON.parse(cached));
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords(true);
  };

  const iconForType = (type) => {
    if (!type) return 'document-text';
    const t = type.toLowerCase();
    if (t.includes('blood') || t.includes('lab')) return 'flask';
    if (t.includes('prescription') || t.includes('rx')) return 'medical';
    if (t.includes('scan') || t.includes('xray') || t.includes('mri')) return 'scan';
    if (t.includes('vaccine') || t.includes('immunization')) return 'shield-checkmark';
    return 'document-text';
  };

  return (
    <View style={styles.container}>
      <Header
        title="Health Records"
        subtitle="My Medical History"
        rightIcon="menu"
        onRightPress={() => navigation.toggleDrawer()}
      />

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={colors.orange} />
          <Text style={styles.offlineText}>Showing cached records (Offline Mode)</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.cyan} size="large" style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Records Yet</Text>
            <Text style={styles.emptySubtitle}>Your doctor will add your medical records here after consultations.</Text>
          </View>
        ) : (
          records.map((r) => (
            <TouchableOpacity key={r.record_id} onPress={() => setExpanded(expanded === r.record_id ? null : r.record_id)}>
              <GlassCard style={styles.recordCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconBg}>
                    <Ionicons name={iconForType(r.diagnosis)} size={22} color={colors.cyan} />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.recordTitle}>{r.diagnosis ? r.diagnosis.split(' ').slice(0, 4).join(' ') + (r.diagnosis.split(' ').length > 4 ? '…' : '') : 'Medical Record'}</Text>
                    <Text style={styles.recordDate}>{r.consultation_date ? new Date(r.consultation_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date Unknown'}</Text>
                  </View>
                  <Ionicons
                    name={expanded === r.record_id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                  />
                </View>

                {expanded === r.record_id && (
                  <View style={styles.expandedBody}>
                    <View style={styles.divider} />
                    {r.diagnosis && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Diagnosis</Text>
                        <Text style={styles.infoValue}>{r.diagnosis}</Text>
                      </View>
                    )}
                    {Array.isArray(r.prescription) && r.prescription.length > 0 && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Prescription</Text>
                        {r.prescription.map((med, i) => (
                          <View key={i} style={styles.pillRow}>
                            <Ionicons name="ellipse" size={6} color={colors.cyan} style={{ marginTop: 7 }} />
                            <Text style={styles.infoValue}>{med}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {r.notes && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Doctor's Notes</Text>
                        <Text style={styles.infoValue}>{r.notes}</Text>
                      </View>
                    )}
                    {r.doctor_id && (
                      <View style={styles.doctorTag}>
                        <Ionicons name="person" size={13} color={colors.textMuted} />
                        <Text style={styles.doctorTagText}>Dr. {r.doctor_id}</Text>
                      </View>
                    )}
                  </View>
                )}
              </GlassCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, flexGrow: 1 },

  offlineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,165,0,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,165,0,0.2)' },
  offlineText: { color: colors.orange || '#f97316', fontSize: 13, fontWeight: '600' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 30 },
  emptyTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },

  recordCard: { padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,201,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  recordTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  recordDate: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },

  expandedBody: { marginTop: 14 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
  infoRow: { marginBottom: 12 },
  infoLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },

  doctorTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  doctorTagText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  pillRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
});

export default HealthRecordsScreen;
