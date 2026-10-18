import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, FlatList, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllDoctors, bookAppointment, getDoctorSchedule } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const BookAppointmentScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDocs, setFetchingDocs] = useState(true);

  // Doctor schedule state
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [docSchedule, setDocSchedule] = useState({
    available_days: DEFAULT_DAYS,
    available_time_slots: DEFAULT_SLOTS,
    booked_slots: []
  });

  const [form, setForm] = useState({
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    consultation_type: 'video', // 'video', 'audio', 'in-person'
    symptoms: '',
    is_low_cost_request: false
  });

  const [docModal, setDocModal] = useState(false);
  const [fullDateModal, setFullDateModal] = useState(false);

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await getAllDoctors();
        const available = res.data.filter(d => d.availability_status !== false);
        setDoctors(available);
        if (available.length > 0) {
          const firstDocId = available[0].doctor_id;
          setForm(f => ({ ...f, doctor_id: firstDocId }));
          loadDoctorSchedule(firstDocId);
        }
      } catch (err) {
        console.log("Docs load error", err);
      } finally {
        setFetchingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  // Fetch doctor's availability schedule and booked slots
  const loadDoctorSchedule = async (doctorId) => {
    try {
      setScheduleLoading(true);
      const res = await getDoctorSchedule(doctorId);
      const data = res.data;
      setDocSchedule({
        available_days: (data.available_days && data.available_days.length > 0) ? data.available_days : DEFAULT_DAYS,
        available_time_slots: (data.available_time_slots && data.available_time_slots.length > 0) ? data.available_time_slots : DEFAULT_SLOTS,
        booked_slots: data.booked_slots || []
      });
    } catch (err) {
      // Fallback to defaults
      setDocSchedule({
        available_days: DEFAULT_DAYS,
        available_time_slots: DEFAULT_SLOTS,
        booked_slots: []
      });
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSelectDoctor = (doc) => {
    setForm(f => ({
      ...f,
      doctor_id: doc.doctor_id,
      appointment_date: '',
      appointment_time: ''
    }));
    setDocModal(false);
    loadDoctorSchedule(doc.doctor_id);
  };

  // Generate 30 days with availability calculations
  const computeDatesAvailability = (numDays = 30) => {
    const dates = [];
    const today = new Date();
    const workingDays = docSchedule.available_days || DEFAULT_DAYS;
    const allSlots = docSchedule.available_time_slots || DEFAULT_SLOTS;
    const booked = docSchedule.booked_slots || [];

    for (let i = 0; i < numDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dateStr = d.toISOString().split('T')[0];
      const dayName = DAY_NAMES[d.getDay()];
      const isWorkingDay = workingDays.includes(dayName);

      // Booked slots on this date
      const bookedOnDate = booked.filter(b => b.date === dateStr).map(b => b.time);
      const remainingSlotsCount = allSlots.filter(s => !bookedOnDate.includes(s)).length;

      let status = 'available'; // 'available' | 'off_duty' | 'fully_booked'
      let statusLabel = 'Available';

      if (!isWorkingDay) {
        status = 'off_duty';
        statusLabel = 'Off-Duty';
      } else if (remainingSlotsCount === 0) {
        status = 'fully_booked';
        statusLabel = 'Fully Booked';
      } else {
        status = 'available';
        statusLabel = `${remainingSlotsCount} slots`;
      }

      dates.push({
        dateStr,
        dayOfMonth: d.getDate(),
        dayNameShort: dayName.slice(0, 3),
        dayNameFull: dayName,
        monthName: MONTH_NAMES[d.getMonth()],
        year: d.getFullYear(),
        isToday: i === 0,
        status,
        statusLabel,
        isAvailable: status === 'available',
        remainingSlotsCount,
      });
    }
    return dates;
  };

  const datesList = computeDatesAvailability(30);

  // Time slots for the currently selected date
  const getSlotsForSelectedDate = () => {
    if (!form.appointment_date) return [];
    const allSlots = docSchedule.available_time_slots || DEFAULT_SLOTS;
    const booked = docSchedule.booked_slots || [];
    const bookedTimes = booked
      .filter(b => b.date === form.appointment_date)
      .map(b => b.time);

    return allSlots.map(time => ({
      time,
      isBooked: bookedTimes.includes(time)
    }));
  };

  const currentSlots = getSlotsForSelectedDate();

  const handleSelectDate = (dateItem) => {
    if (!dateItem.isAvailable) {
      if (dateItem.status === 'off_duty') {
        Alert.alert('Doctor Off-Duty', `Dr. is not available on ${dateItem.dayNameFull}s. Please pick another date.`);
      } else {
        Alert.alert('Fully Booked', `All slots for ${dateItem.dateStr} are booked. Please pick another date.`);
      }
      return;
    }
    setForm(f => ({ ...f, appointment_date: dateItem.dateStr, appointment_time: '' }));
    setFullDateModal(false);
  };

  const handleBook = async () => {
    if (!form.doctor_id) {
      Alert.alert('Missing Info', 'Please select a doctor.');
      return;
    }
    if (!form.appointment_date) {
      Alert.alert('Missing Info', 'Please choose an available appointment date.');
      return;
    }
    if (!form.appointment_time) {
      Alert.alert('Missing Info', 'Please choose an available time slot.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        patient_id: user.id,
        ...form
      };
      await bookAppointment(payload);
      Alert.alert('Appointment Requested! 📅', 'Your consultation request has been submitted.', [
        { text: 'View Appointments', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.detail || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => d.doctor_id === form.doctor_id);

  return (
    <View style={styles.container}>
      <Header title="Consultation" subtitle="Book Doctor" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, width: '100%' }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Doctor Selector Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.sectionHeader}>1. Choose Healthcare Provider</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => !fetchingDocs && doctors.length > 0 && setDocModal(true)}
            >
              <View style={styles.docTriggerLeft}>
                <View style={styles.docIconBg}>
                  <Ionicons name="medkit" size={20} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.triggerText, !selectedDoctor && { color: colors.textMuted }]}>
                    {fetchingDocs
                      ? 'Loading doctors...'
                      : selectedDoctor
                      ? `Dr. ${selectedDoctor.full_name}`
                      : 'Select a Doctor'}
                  </Text>
                  {selectedDoctor && (
                    <Text style={styles.triggerSub}>
                      {selectedDoctor.specialization} • ₹{selectedDoctor.consultation_fee ?? '0'} Fee
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {selectedDoctor && (
              <View style={styles.docInfoPills}>
                {selectedDoctor.hospital_name && (
                  <View style={styles.infoPill}>
                    <Ionicons name="business" size={13} color={colors.textSecondary} />
                    <Text style={styles.infoPillText}>{selectedDoctor.hospital_name}</Text>
                  </View>
                )}
                {selectedDoctor.experience_years && (
                  <View style={styles.infoPill}>
                    <Ionicons name="ribbon" size={13} color={colors.textSecondary} />
                    <Text style={styles.infoPillText}>{selectedDoctor.experience_years} yrs exp</Text>
                  </View>
                )}
              </View>
            )}
          </GlassCard>

          {/* Available Dates Section */}
          <GlassCard style={[styles.card, { marginTop: 16 }]}>
            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionHeader}>2. Select Available Date</Text>
                <Text style={styles.sectionSub}>Green dots indicate confirmed available doctor slots</Text>
              </View>
              <TouchableOpacity style={styles.browseAllBtn} onPress={() => setFullDateModal(true)}>
                <Ionicons name="calendar" size={15} color={colors.cyan} style={{ marginRight: 4 }} />
                <Text style={styles.browseAllText}>All 30 Days</Text>
              </TouchableOpacity>
            </View>

            {scheduleLoading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="small" color={colors.cyan} />
                <Text style={styles.loaderText}>Checking doctor availability...</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateStrip}
              >
                {datesList.slice(0, 14).map((d) => {
                  const isSelected = form.appointment_date === d.dateStr;
                  const isAvailable = d.isAvailable;

                  return (
                    <TouchableOpacity
                      key={d.dateStr}
                      disabled={!isAvailable}
                      style={[
                        styles.dateCard,
                        isSelected && styles.dateCardSelected,
                        !isAvailable && styles.dateCardDisabled
                      ]}
                      onPress={() => handleSelectDate(d)}
                    >
                      <Text style={[styles.dateDayName, isSelected && { color: colors.cyan }]}>
                        {d.dayNameShort}
                      </Text>
                      <Text style={[styles.dateDayNum, isSelected && { color: '#fff' }]}>
                        {d.dayOfMonth}
                      </Text>
                      <Text style={styles.dateMonth}>{d.monthName}</Text>

                      <View
                        style={[
                          styles.statusTag,
                          isAvailable ? styles.statusAvailable : styles.statusUnavailable
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isAvailable ? colors.green : colors.textMuted }
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusTagText,
                            { color: isAvailable ? colors.green : colors.textMuted }
                          ]}
                        >
                          {d.status === 'available' ? 'Open' : d.status === 'fully_booked' ? 'Full' : 'Off'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {form.appointment_date ? (
              <View style={styles.selectedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                <Text style={styles.selectedBannerText}>
                  Selected Date: <Text style={{ fontWeight: '700', color: '#fff' }}>{form.appointment_date}</Text>
                </Text>
              </View>
            ) : (
              <Text style={styles.hintText}>👉 Tap an "Open" date chip above to view its open time slots.</Text>
            )}
          </GlassCard>

          {/* Time Slots Section */}
          {form.appointment_date && (
            <GlassCard style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.sectionHeader}>3. Pick Time Slot</Text>
              <Text style={styles.sectionSub}>Available timings for {form.appointment_date}</Text>

              {currentSlots.length === 0 ? (
                <Text style={styles.hintText}>No slots configured for this date.</Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {currentSlots.map((slot) => {
                    const isSelected = form.appointment_time === slot.time;
                    const isBooked = slot.isBooked;

                    return (
                      <TouchableOpacity
                        key={slot.time}
                        disabled={isBooked}
                        style={[
                          styles.slotChip,
                          isSelected && styles.slotChipSelected,
                          isBooked && styles.slotChipBooked
                        ]}
                        onPress={() => setForm(f => ({ ...f, appointment_time: slot.time }))}
                      >
                        <Ionicons
                          name={isBooked ? 'close-circle' : isSelected ? 'checkmark-circle' : 'time-outline'}
                          size={15}
                          color={isBooked ? colors.textMuted : isSelected ? colors.cyan : colors.textSecondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.slotText,
                            isSelected && styles.slotTextSelected,
                            isBooked && styles.slotTextBooked
                          ]}
                        >
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </GlassCard>
          )}

          {/* Consultation Type & Symptoms */}
          <GlassCard style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionHeader}>4. Consultation Details</Text>

            <Text style={styles.label}>Mode of Consultation *</Text>
            <View style={styles.typeButtons}>
              {[
                { key: 'video', label: 'VIDEO CALL', icon: 'videocam' },
                { key: 'audio', label: 'AUDIO CALL', icon: 'call' },
                { key: 'in-person', label: 'IN-PERSON', icon: 'person' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.typeBtn, form.consultation_type === item.key && styles.typeBtnActive]}
                  onPress={() => setForm(f => ({ ...f, consultation_type: item.key }))}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={form.consultation_type === item.key ? colors.cyan : colors.textSecondary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[styles.typeText, form.consultation_type === item.key && styles.typeTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <InputField
              label="Describe Symptoms / Reason"
              placeholder="E.g., Fever and headache for 2 days..."
              value={form.symptoms}
              onChangeText={v => setForm(f => ({ ...f, symptoms: v }))}
              multiline
              style={{ minHeight: 80 }}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setForm(f => ({ ...f, is_low_cost_request: !f.is_low_cost_request }))}
            >
              <View style={[styles.checkbox, form.is_low_cost_request && styles.checkboxActive]}>
                {form.is_low_cost_request && <Ionicons name="checkmark" size={16} color="#000" />}
              </View>
              <Text style={styles.checkText}>Apply for Subsidized / Free TeleHealth Consultation</Text>
            </TouchableOpacity>

            <GradientButton
              title="Confirm & Book Appointment"
              onPress={handleBook}
              loading={loading}
              disabled={fetchingDocs || !form.doctor_id || !form.appointment_date || !form.appointment_time}
              gradient={colors.gradientBlue}
              style={{ marginTop: 20 }}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Doctor Selection Modal */}
      <Modal visible={docModal} transparent animationType="slide" onRequestClose={() => setDocModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Doctor</Text>
              <TouchableOpacity onPress={() => setDocModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={doctors}
              keyExtractor={d => d.doctor_id}
              renderItem={({ item }) => {
                const isSelected = form.doctor_id === item.doctor_id;
                return (
                  <TouchableOpacity
                    style={[styles.modalDocItem, isSelected && styles.modalDocItemActive]}
                    onPress={() => handleSelectDoctor(item)}
                  >
                    <View style={styles.docAvatar}>
                      <Ionicons name="person" size={22} color={colors.cyan} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docItemName}>Dr. {item.full_name}</Text>
                      <Text style={styles.docItemSpec}>{item.specialization} • {item.hospital_name || 'Clinic'}</Text>
                      <Text style={styles.docItemFee}>Fee: ₹{item.consultation_fee ?? 0}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.cyan} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* 30-Day Calendar Overview Modal */}
      <Modal visible={fullDateModal} transparent animationType="slide" onRequestClose={() => setFullDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Available Date</Text>
                <Text style={styles.modalSub}>Next 30 days availability for Dr. {selectedDoctor?.full_name}</Text>
              </View>
              <TouchableOpacity onPress={() => setFullDateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={datesList}
              keyExtractor={d => d.dateStr}
              renderItem={({ item }) => {
                const isSelected = form.appointment_date === item.dateStr;
                const isAvailable = item.isAvailable;

                return (
                  <TouchableOpacity
                    disabled={!isAvailable}
                    style={[
                      styles.dateListItem,
                      isSelected && styles.dateListItemActive,
                      !isAvailable && { opacity: 0.45 }
                    ]}
                    onPress={() => handleSelectDate(item)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={[styles.dateBadge, isAvailable && { borderColor: colors.green }]}>
                        <Text style={styles.dateBadgeDay}>{item.dayOfMonth}</Text>
                        <Text style={styles.dateBadgeMonth}>{item.monthName}</Text>
                      </View>
                      <View>
                        <Text style={styles.dateListItemTitle}>{item.dayNameFull}, {item.dateStr}</Text>
                        <Text style={[styles.dateListItemSub, { color: isAvailable ? colors.green : colors.textMuted }]}>
                          {item.statusLabel}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.cyan} />
                    ) : isAvailable ? (
                      <View style={styles.bookTag}>
                        <Text style={styles.bookTagText}>Select</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
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
  card: { padding: 18, borderRadius: 16 },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginBottom: 14 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },

  browseAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,201,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  browseAllText: { color: colors.cyan, fontSize: 12, fontWeight: '600' },

  // Picker Trigger
  pickerTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  docTriggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  docIconBg: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,201,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  triggerText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  triggerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  docInfoPills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  infoPillText: { color: colors.textSecondary, fontSize: 12 },

  // Date strip
  dateStrip: { gap: 10, paddingVertical: 6 },
  dateCard: { width: 78, height: 110, borderRadius: 14, backgroundColor: '#0D1526', borderWidth: 1, borderColor: colors.borderAccent, alignItems: 'center', justifyContent: 'center', padding: 6 },
  dateCardSelected: { borderColor: colors.cyan, backgroundColor: 'rgba(0,201,255,0.15)' },
  dateCardDisabled: { opacity: 0.35, backgroundColor: '#090E1A' },
  dateDayName: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  dateDayNum: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 1 },
  dateMonth: { fontSize: 11, color: colors.textMuted, marginBottom: 6 },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusAvailable: { backgroundColor: 'rgba(0,242,169,0.15)' },
  statusUnavailable: { backgroundColor: 'rgba(255,255,255,0.05)' },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTagText: { fontSize: 10, fontWeight: '700' },

  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,242,169,0.1)', padding: 12, borderRadius: 10, marginTop: 14 },
  selectedBannerText: { color: colors.green, fontSize: 13 },
  hintText: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 10 },

  loaderBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, justifyContent: 'center' },
  loaderText: { color: colors.textMuted, fontSize: 13 },

  // Slots Grid
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  slotChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: '#0D1526', borderWidth: 1, borderColor: colors.borderAccent, minWidth: '30%', justifyContent: 'center' },
  slotChipSelected: { backgroundColor: 'rgba(0,201,255,0.15)', borderColor: colors.cyan },
  slotChipBooked: { opacity: 0.35, backgroundColor: '#080C14', borderColor: 'transparent' },
  slotText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  slotTextSelected: { color: colors.cyan, fontWeight: '700' },
  slotTextBooked: { color: colors.textMuted, textDecorationLine: 'line-through' },

  // Form Details
  label: { fontSize: 12, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  typeButtons: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0D1526', borderWidth: 1, borderColor: colors.borderAccent, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: 'rgba(0,201,255,0.15)', borderColor: colors.cyan },
  typeText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  typeTextActive: { color: colors.cyan },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.cyan, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.cyan },
  checkText: { color: colors.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F1729', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottomWidth: 1, borderColor: colors.border, paddingBottom: 14 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  modalDocItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalDocItemActive: { backgroundColor: 'rgba(0,201,255,0.06)', borderRadius: 12, paddingHorizontal: 10 },
  docAvatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(0,201,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  docItemName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  docItemSpec: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  docItemFee: { color: colors.green, fontSize: 12, fontWeight: '600', marginTop: 2 },

  dateListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dateListItemActive: { backgroundColor: 'rgba(0,201,255,0.08)', borderRadius: 10, paddingHorizontal: 8 },
  dateBadge: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090E1A' },
  dateBadgeDay: { color: '#fff', fontSize: 15, fontWeight: '800' },
  dateBadgeMonth: { color: colors.textMuted, fontSize: 10, textTransform: 'uppercase' },
  dateListItemTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  dateListItemSub: { fontSize: 12, marginTop: 2 },
  bookTag: { backgroundColor: 'rgba(0,201,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bookTagText: { color: colors.cyan, fontSize: 12, fontWeight: '700' },
});

export default BookAppointmentScreen;
