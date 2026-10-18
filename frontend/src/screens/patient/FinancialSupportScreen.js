import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';

const SCHEMES = [
  {
    id: 1,
    title: 'Ayushman Bharat PM-JAY',
    desc: 'Health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.',
    icon: 'shield-checkmark',
    color: colors.green,
    eligibility: ['Annual income below ₹1 lakh', 'BPL (Below Poverty Line) family', 'Ration card holder', 'SC/ST communities'],
    applyUrl: 'https://beneficiary.nha.gov.in/',
  },
  {
    id: 2,
    title: 'Janani Suraksha Yojana',
    desc: 'Financial assistance for pregnant women to encourage institutional delivery and reduce maternal/infant mortality.',
    icon: 'heart',
    color: colors.pink,
    eligibility: ['Pregnant woman aged 19+', 'BPL family or SC/ST category', 'Upto 2 live births', 'Institutional delivery required'],
    applyUrl: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
  },
  {
    id: 3,
    title: 'NGO Donation Support',
    desc: 'Apply for micro-funding from verified NGOs for critical treatments not covered by government schemes.',
    icon: 'cash',
    color: colors.orange,
    eligibility: ['No income limit', 'Must have medical prescription', 'Diagnosis certificate required', 'One application per patient per year'],
    applyUrl: 'https://www.give.do/',
  },
  {
    id: 4,
    title: 'Pradhan Mantri Jan Arogya Yojana',
    desc: 'Free treatment at empanelled hospitals for critical illnesses including cancer, heart disease and dialysis.',
    icon: 'business',
    color: colors.cyan,
    eligibility: ['SECC 2011 database listed families', 'Urban workers in listed occupations', 'Any deprived rural family'],
    applyUrl: 'https://www.pmjay.gov.in/are-you-eligible',
  },
];

const FinancialSupportScreen = ({ navigation }) => {
  const [eligModal, setEligModal] = useState(null);

  const [payLoading, setPayLoading] = useState(false);

  const handleApply = (url) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Please visit the official website manually.')
    );
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) { resolve(true); return; }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUPI = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not supported', 'UPI payment is available on the web version of this app.');
      return;
    }
    setPayLoading(true);
    try {
      // Step 1: Load Razorpay JS SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) { Alert.alert('Error', 'Could not load Razorpay. Check internet connection.'); return; }

      // Step 2: Create order on backend
      const orderRes = await fetch('http://localhost:8000/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50000, receipt: 'hospital_bill_001', notes: { purpose: 'Hospital micro-installment' } }),
      });
      const order = await orderRes.json();

      if (!order.order_id) { Alert.alert('Error', 'Could not create payment order. Please try again.'); return; }

      // Step 3: Open Razorpay checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Asha TeleHealth',
        description: 'Hospital Bill Micro-Installment',
        image: 'https://i.imgur.com/n5tjHFD.png',
        prefill: { name: 'Patient', method: 'upi' },
        config: { display: { hide: [{ method: 'card' }, { method: 'netbanking' }], preferences: { show_default_blocks: false } } },
        theme: { color: '#00C9FF' },
        handler: async (response) => {
          // Step 4: Verify on backend
          const verifyRes = await fetch('http://localhost:8000/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verify = await verifyRes.json();
          if (verify.status === 'success') {
            Alert.alert('✅ Payment Successful', 'Your installment has been recorded. Thank you!');
          } else {
            Alert.alert('❌ Verification Failed', 'Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. ' + e.message);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Financial Aid" subtitle="Support Schemes" rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
      >
        
        <GlassCard style={styles.summaryCard} accent>
          <View style={styles.upiHeader}>
            <View>
              <Text style={styles.upiTitle}>Low-Cost Payments</Text>
              <Text style={styles.upiDesc}>Pay directly via UPI in micro-installments.</Text>
            </View>
            <Ionicons name="qr-code" size={40} color={colors.cyan} />
          </View>
          <TouchableOpacity style={styles.upiBtn} onPress={handleUPI}>
            <Text style={styles.upiBtnText}>Setup UPI Auto-Pay</Text>
          </TouchableOpacity>
        </GlassCard>

        <Text style={styles.sectionTitle}>Government Schemes</Text>
        
        {SCHEMES.map(s => (
          <GlassCard key={s.id} style={styles.schemeCard}>
            <View style={styles.schemeHeader}>
              <View style={[styles.iconBg, { backgroundColor: s.color + '20' }]}>
                <Ionicons name={s.icon} size={24} color={s.color} />
              </View>
              <Text style={styles.schemeTitle}>{s.title}</Text>
            </View>
            <Text style={styles.schemeDesc}>{s.desc}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.checkEligBtn} onPress={() => setEligModal(s)}>
                <Text style={styles.checkEligText}>Check Eligibility</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => handleApply(s.applyUrl)}>
                <Text style={styles.applyText}>Apply Now ↗</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

      </ScrollView>

      {/* Eligibility Modal */}
      <Modal visible={!!eligModal} transparent animationType="slide" onRequestClose={() => setEligModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{eligModal?.title}</Text>
              <TouchableOpacity onPress={() => setEligModal(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Eligibility Criteria:</Text>
            {eligModal?.eligibility.map((c, i) => (
              <View key={i} style={styles.criteriaRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                <Text style={styles.criteriaText}>{c}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.fullApplyBtn} onPress={() => { setEligModal(null); handleApply(eligModal?.applyUrl); }}>
              <Text style={styles.fullApplyText}>Apply on Official Portal →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },
  
  summaryCard: { padding: 20, marginBottom: 30, borderRadius: 20, borderColor: colors.borderAccent },
  upiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  upiTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  upiDesc: { color: colors.textSecondary, fontSize: 13, paddingRight: 20 },
  upiBtn: { backgroundColor: 'rgba(0,201,255,0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upiBtnText: { color: colors.cyan, fontSize: 14, fontWeight: '700' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },

  schemeCard: { padding: 18, marginBottom: 16, borderRadius: 16 },
  schemeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  schemeTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  schemeDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  
  actionRow: { flexDirection: 'row', gap: 10 },
  checkEligBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  checkEligText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  applyBtn: { flex: 1, backgroundColor: 'rgba(0,201,255,0.1)', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  applyText: { color: colors.cyan, fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end', padding: 16 },
  modalCard: { backgroundColor: '#0F1729', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(0,201,255,0.2)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', flex: 1, marginRight: 10 },
  modalSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  criteriaText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 },
  fullApplyBtn: { marginTop: 20, backgroundColor: 'rgba(0,201,255,0.15)', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  fullApplyText: { color: colors.cyan, fontSize: 15, fontWeight: '700' },

  // UPI
  qrWrapper: { alignItems: 'center', marginVertical: 16, padding: 12, backgroundColor: '#fff', borderRadius: 16 },
  qrImage: { width: 200, height: 200, borderRadius: 8 },
  upiIdText: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  upiNote: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 16 },
  upiAppRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  upiAppChip: { backgroundColor: 'rgba(0,201,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,201,255,0.2)' },
  upiAppText: { color: colors.cyan, fontSize: 13, fontWeight: '600' },
});

export default FinancialSupportScreen;
