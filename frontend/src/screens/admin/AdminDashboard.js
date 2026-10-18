import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHighRiskPatients } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors } from '../../theme/colors';

// Simulated Disease Outbreak Detection Data
const OUTBREAK_ALERTS = [
  { region: 'Nabha', symptoms: 'Fever, Cough, Body Ache', suspected: 'Dengue Outbreak', severity: 'High', cases: 14 },
  { region: 'Patiala South', symptoms: 'Watery Diarrhea', suspected: 'Cholera', severity: 'Critical', cases: 8 },
];

const AdminDashboard = ({ navigation }) => {
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRiskPatients = async () => {
    try {
      setLoading(true);
      const res = await getHighRiskPatients();
      setHighRisk(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRiskPatients(); }, []);

  return (
    <View style={styles.container}>
      <Header title="HQ" subtitle="Admin Portal" roleColor={colors.orange} rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRiskPatients} tintColor={colors.orange} />}
      >

        {/* Real-time Outbreak System */}
        <Text style={styles.sectionTitle}>Disease Outbreak Radar</Text>
        
        {OUTBREAK_ALERTS.map((alert, i) => (
          <GlassCard key={i} style={[styles.outbreakCard, alert.severity === 'Critical' && styles.criticalCard]}>
            <View style={styles.outbreakHeader}>
              <View style={styles.outbreakTitleRow}>
                <Ionicons name="warning" size={20} color={alert.severity === 'Critical' ? '#fff' : colors.red} />
                <Text style={[styles.outbreakRegion, alert.severity === 'Critical' && { color: '#fff' }]}>
                  {alert.region} Cluster
                </Text>
              </View>
              <View style={[styles.caseBadge, alert.severity === 'Critical' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.caseNum, alert.severity === 'Critical' && { color: '#fff' }]}>{alert.cases} Cases</Text>
              </View>
            </View>
            
            <View style={styles.outbreakDetails}>
              <Text style={[styles.outbreakLabel, alert.severity === 'Critical' && { color: 'rgba(255,255,255,0.7)' }]}>Tracked Symptoms:</Text>
              <Text style={[styles.outbreakSymptoms, alert.severity === 'Critical' && { color: '#fff' }]}>{alert.symptoms}</Text>
              
              <Text style={[styles.outbreakLabel, { marginTop: 8 }, alert.severity === 'Critical' && { color: 'rgba(255,255,255,0.7)' }]}>AI Suspects:</Text>
              <Text style={[styles.outbreakSuspect, alert.severity === 'Critical' ? { color: '#fff' } : { color: colors.red }]}>{alert.suspected}</Text>
            </View>
          </GlassCard>
        ))}

        {/* High Risk Triage List */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Critical Patient Triage</Text>
        
        {highRisk.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No critical patients identified currently.</Text>
          </GlassCard>
        ) : (
          highRisk.map(p => (
            <GlassCard key={p.patient_id} style={styles.patientCard}>
              <View style={styles.pHeaderRow}>
                <Text style={styles.pName}>{p.patient_id}</Text>
                <StatusBadge status={p.risk_level} />
              </View>

              <View style={styles.pMetaRow}>
                <Text style={styles.pMetaLabel}>Score:</Text>
                <Text style={styles.pMetaValue}>{p.risk_score} / 100</Text>
              </View>
              
              <View style={styles.pMetaRow}>
                <Text style={styles.pMetaLabel}>Last Assessment:</Text>
                <Text style={styles.pMetaValue}>{p.assessed_at ? new Date(p.assessed_at).toLocaleString() : 'N/A'}</Text>
              </View>

              {p.reasons && p.reasons.length > 0 && (
                <View style={styles.reasonsBox}>
                  <Text style={styles.reasonTitle}>Red Flags:</Text>
                  {p.reasons.map((r, i) => (
                    <Text key={i} style={styles.reasonItem}>• {r}</Text>
                  ))}
                </View>
              )}
            </GlassCard>
          ))
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },

  outbreakCard: { padding: 18, marginBottom: 16, borderColor: 'rgba(239,68,68,0.3)' },
  criticalCard: { backgroundColor: colors.error, borderColor: colors.error },
  
  outbreakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  outbreakTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  outbreakRegion: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  
  caseBadge: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  caseNum: { color: colors.red, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  outbreakDetails: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 14, borderRadius: 12 },
  outbreakLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  outbreakSymptoms: { color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  outbreakSuspect: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },

  patientCard: { padding: 16, marginBottom: 12 },
  pHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  
  pMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pMetaLabel: { color: colors.textMuted, fontSize: 13 },
  pMetaValue: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  reasonsBox: { marginTop: 12, backgroundColor: 'rgba(239,68,68,0.05)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  reasonTitle: { color: colors.red, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  reasonItem: { color: colors.textPrimary, fontSize: 13, marginBottom: 4 },

  emptyCard: { padding: 20, alignItems: 'center', borderColor: colors.borderAccent },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});

export default AdminDashboard;
