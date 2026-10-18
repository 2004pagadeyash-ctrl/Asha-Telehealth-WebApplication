import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { registerPatient } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import GenderScroll from '../../components/ui/GenderScroll';
import AgeScroll from '../../components/ui/AgeScroll';
import { colors } from '../../theme/colors';

const RegisterPatientScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('28');
  const [village, setVillage] = useState(user?.village || 'Nabha');
  const [district, setDistrict] = useState(user?.district || 'Patiala');
  const [bloodGroup, setBloodGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim()) {
      setError('Please provide patient full name and phone number');
      Alert.alert('Validation Error', 'Full Name and Phone Number are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        gender: gender || 'male',
        age: parseInt(age) || 25,
        village: village.trim() || 'Rural Sector',
        district: district.trim() || 'District Hospital Area',
        blood_group: bloodGroup.trim() || null,
      };

      const res = await registerPatient(payload);
      const patientId = res.data?.patient_id || 'Registered';

      Alert.alert(
        'Registration Successful! 🏥',
        `Patient ${fullName} has been registered successfully with ID: ${patientId}`,
        [
          {
            text: 'Go to Dashboard',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Dashboard');
              }
            },
          },
        ]
      );

      // Reset form
      setFullName('');
      setPhone('');
      setGender('male');
      setAge('28');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Patient registration failed';
      setError(msg);
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Patient Registration"
        subtitle="ASHA Field Portal"
        roleColor={colors.purple}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={true}
        >
          <GlassCard style={styles.card}>
            <Text style={styles.cardHeader}>Enroll Community Patient</Text>
            <Text style={styles.cardSub}>
              Register a citizen for tele-health visits, vitals tracking, and digital prescriptions.
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <InputField
              label="Patient Full Name *"
              icon="👤"
              placeholder="e.g. Gurpreet Singh"
              value={fullName}
              onChangeText={setFullName}
            />

            <InputField
              label="Contact Phone Number *"
              icon="📱"
              placeholder="+91 XXXXX XXXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* Male & Female Scroll Selector */}
            <GenderScroll
              label="Select Gender"
              selectedGender={gender}
              onSelect={setGender}
              accentColor={colors.purple}
            />

            {/* Age Scroll Selector */}
            <AgeScroll
              label="Select Patient Age"
              selectedAge={age}
              onSelect={setAge}
              accentColor={colors.purple}
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  label="Village / Ward"
                  icon="🏡"
                  placeholder="e.g. Nabha"
                  value={village}
                  onChangeText={setVillage}
                />
              </View>
              <View style={styles.half}>
                <InputField
                  label="District"
                  icon="📍"
                  placeholder="e.g. Patiala"
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
            </View>

            <InputField
              label="Blood Group (Optional)"
              icon="🩸"
              placeholder="e.g. O+, B+, A-"
              value={bloodGroup}
              onChangeText={setBloodGroup}
            />

            <GradientButton
              title="Register Patient"
              gradient={colors.gradientPurple}
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: 14 }}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    padding: 20,
    paddingBottom: 120,
    ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }),
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 10,
    borderRadius: 8,
  },
});

export default RegisterPatientScreen;
