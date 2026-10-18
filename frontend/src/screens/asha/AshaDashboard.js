import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Linking, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllPatients } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import { colors } from '../../theme/colors';

const AshaDashboard = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const res = await getAllPatients();
      setPatients(res.data || []);
    } catch (err) {
      console.log('Error loading patients', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number registered for this patient.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Could not initiate call to ${phone}`);
    });
  };

  const handleRecordVitals = (patientId) => {
    navigation.navigate('Record Vitals', { patientId });
  };

  // Compute metrics
  const uniqueVillages = new Set(patients.map(p => p.village).filter(Boolean)).size;
  const patientsWithConditions = patients.filter(
    p => Array.isArray(p.existing_conditions) && p.existing_conditions.length > 0
  ).length;

  const filtered = patients.filter(p => {
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
        title="Community"
        subtitle="ASHA Worker Portal"
        roleColor={colors.purple}
        rightIcon="menu"
        onRightPress={() => navigation.toggleDrawer()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}
      >
        {/* Stat Cards */}
        <GlassCard style={styles.statCard} accent>
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Registered</Text>
              <Text style={styles.statVal}>{patients.length}</Text>
              <Text style={styles.statSub}>Total Patients</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Villages</Text>
              <Text style={[styles.statVal, { color: colors.cyan }]}>{uniqueVillages || 1}</Text>
              <Text style={styles.statSub}>Covered</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>High Priority</Text>
              <Text style={[styles.statVal, { color: colors.orange }]}>{patientsWithConditions}</Text>
              <Text style={styles.statSub}>Chronic Cases</Text>
            </View>
          </View>
        </GlassCard>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Community Patients</Text>
            <Text style={styles.sectionSub}>Live registry from health system</Text>
          </View>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register Patient')}
          >
            <Ionicons name="person-add" size={15} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.registerBtnText}>+ Register Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <InputField
          icon="🔍"
          placeholder="Search by name, ID, village, or phone..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: 16 }}
        />

        {/* Patient List */}
        {loading ? (
          <ActivityIndicator color={colors.purple} size="large" style={{ marginVertical: 40 }} />
        ) : filtered.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyTitle}>
              {patients.length === 0 ? 'No Patients Registered Yet' : 'No Matching Patients Found'}
            </Text>
            <Text style={styles.emptySub}>
              {patients.length === 0
                ? 'Register community members to track their vitals and schedule teleconsultations.'
                : 'Try adjusting your search query.'}
            </Text>
            {patients.length === 0 && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('Register Patient')}
              >
                <Text style={styles.emptyActionText}>+ Register First Patient</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        ) : (
          filtered.map(p => {
            const hasConditions = Array.isArray(p.existing_conditions) && p.existing_conditions.length > 0;
            return (
              <GlassCard key={p.patient_id} style={styles.patientCard}>
                <View style={styles.pHeader}>
                  <View style={styles.pHeaderLeft}>
                    <View style={styles.pAvatar}>
                      <Ionicons name="person" size={20} color={colors.purple} />
                    </View>
                    <View>
                      <Text style={styles.pName}>{p.full_name}</Text>
                      <Text style={styles.pSub}>
                        {p.patient_id} • {p.gender || 'N/A'}, {p.age || '--'} yrs
                      </Text>
                      <Text style={styles.pLoc}>
                        📍 {p.village || 'Village'}, {p.district || 'District'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleCall(p.phone)}
                  >
                    <Ionicons name="call" size={18} color={colors.purple} />
                  </TouchableOpacity>
                </View>

                {/* Chronic Conditions Tags */}
                {hasConditions && (
                  <View style={styles.conditionsRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.orange} />
                    <Text style={styles.conditionText}>
                      {p.existing_conditions.join(', ')}
                    </Text>
                  </View>
                )}

                {/* Card Action Footer */}
                <View style={styles.pFooter}>
                  <View style={styles.footerInfo}>
                    <Text style={styles.pMetaLabel}>Blood Group</Text>
                    <Text style={styles.pMetaVal}>{p.blood_group || 'O+'}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.recordVitalsBtn}
                    onPress={() => handleRecordVitals(p.patient_id)}
                  >
                    <Ionicons name="heart" size={15} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.recordVitalsText}>Record Vitals</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fabMini, { backgroundColor: colors.cyan }]}
          onPress={() => navigation.navigate('Register Patient')}
        >
          <Ionicons name="person-add" size={20} color="#080C14" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Record Vitals')}
        >
          <Ionicons name="heart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 130, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },

  statCard: { padding: 18, marginBottom: 24, borderRadius: 20, borderColor: 'rgba(168,85,247,0.3)' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)' },
  statLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  statVal: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' },
  statSub: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  registerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.purple, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  registerBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  patientCard: { padding: 16, marginBottom: 14, borderRadius: 16 },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  pHeaderLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  pAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(168,85,247,0.12)', alignItems: 'center', justifyContent: 'center' },
  pName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  pSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  pLoc: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  actionBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(168,85,247,0.12)', alignItems: 'center', justifyContent: 'center' },

  conditionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,165,0,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 12 },
  conditionText: { color: colors.orange, fontSize: 12, fontWeight: '500' },

  pFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pMetaLabel: { color: colors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  pMetaVal: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },

  recordVitalsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 1, borderColor: colors.purple, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  recordVitalsText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  emptyCard: { padding: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 16, marginVertical: 20 },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  emptyActionBtn: { backgroundColor: colors.purple, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  emptyActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  fabContainer: { position: 'absolute', bottom: 30, right: 24, alignItems: 'center', gap: 12 },
  fabMini: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 6 },
  fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', shadowColor: colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
});

export default AshaDashboard;
