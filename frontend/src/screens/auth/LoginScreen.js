import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import GlassCard from '../../components/ui/GlassCard';
import GenderScroll from '../../components/ui/GenderScroll';
import AgeScroll from '../../components/ui/AgeScroll';
import { 
  sendOTP, verifyOTP, doctorLogin, adminLogin, ashaLogin,
  registerPatient, registerDoctor, registerAshaWorker
} from '../../api/api';

const LoginScreen = () => {
  const [activeTab, setActiveTab] = useState('patient'); // patient | asha | doctor | admin
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register

  // Shared state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Patient Reg State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [gender, setGender] = useState('male');
  
  // Doctor Reg State
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [license, setLicense] = useState('');
  const [docPhone, setDocPhone] = useState('');

  // Patient Reg State Extra
  const [age, setAge] = useState('25');

  // ASHA Reg State
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Added to show success msg after reg

  const { login } = useAuth();

  const handlePatientOTP = async () => {
    try {
      setLoading(true); setError(''); setSuccess('');
      if (!otpSent) {
        const response = await sendOTP(phone);
        if (response.data && response.data.otp) {
           alert("OTP: " + response.data.otp);
           setOtpSent(true);
           setOtp(response.data.otp);
        } else {
           alert("Error: " + JSON.stringify(response.data));
        }
      } else {
        const res = await verifyOTP(phone, otp);
        await login({ id: res.data.patient_id, role: 'patient' }, res.data.access_token);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
      setError(err.response?.data?.detail || 'Error sending/verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async () => {
    try {
      setLoading(true); setError(''); setSuccess('');
      let res;
      if (activeTab === 'doctor') {
        res = await doctorLogin(email, password);
        await login({ id: res.data.doctor_id, role: 'doctor', name: res.data.name }, res.data.access_token);
      } else if (activeTab === 'admin') {
        res = await adminLogin(email, password);
        await login({ id: 'admin', role: 'admin' }, res.data.access_token);
      } else if (activeTab === 'asha') {
        res = await ashaLogin(phone);
        await login({ id: res.data.asha_id, role: 'asha', name: res.data.full_name }, res.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setLoading(true); setError(''); setSuccess('');
      
      if (activeTab === 'patient') {
        if (!phone || !fullName) return setError("Phone and Full Name required");
        await registerPatient({ 
          phone, 
          full_name: fullName, 
          gender: gender || 'other',
          age: parseInt(age) || 0,
        });
        setSuccess("Registration successful! You can now login via OTP.");
        setIsLogin(true);
      } 
      else if (activeTab === 'doctor') {
        if (!email || !password || !fullName || !license || !docPhone) return setError("All fields including Phone and License ID are required");
        await registerDoctor({
          full_name: fullName,
          email,
          password,
          phone: docPhone,
          specialization: specialization || 'General',
          experience_years: parseInt(experience) || 0,
          consultation_fee: parseFloat(fee) || 0,
          hospital_name: 'Asha Network',
        });
        setSuccess("Doctor registered successfully. You can now login.");
        setIsLogin(true);
      }
      else if (activeTab === 'asha') {
        if (!phone || !fullName || !village || !district) return setError("All fields required");
        await registerAshaWorker({
          phone, full_name: fullName, village, district
        });
        setSuccess("ASHA Worker registered successfully. You can now login.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    // --- PATIENT ---
    if (activeTab === 'patient') {
      if (isLogin) {
        return (
          <View>
            <InputField label="Phone Number" icon="📱" placeholder="+91" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            {otpSent && (
              <InputField label="Enter OTP" icon="🔑" placeholder="6-digit OTP" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
            )}
            <GradientButton title={otpSent ? "Verify & Login" : "Send OTP"} onPress={handlePatientOTP} loading={loading} style={{ marginTop: 10 }} />
          </View>
        );
      } else {
        return (
          <View>
            <InputField label="Full Name" icon="👤" placeholder="Your Name" value={fullName} onChangeText={setFullName} />
            <InputField label="Phone Number" icon="📱" placeholder="+91XXXXXXXXXX" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <GenderScroll 
              selectedGender={gender} 
              onSelect={setGender} 
              accentColor={colors.cyan}
            />

            <AgeScroll 
              selectedAge={age} 
              onSelect={setAge} 
              accentColor={colors.cyan}
            />
            <GradientButton title="Register Patient" onPress={handleRegister} loading={loading} style={{ marginTop: 16, marginBottom: 16 }} />
          </View>
        );
      }
    }

    // --- ASHA ---
    if (activeTab === 'asha') {
      if (isLogin) {
        return (
          <View>
            <InputField label="Registered Phone Number" icon="📱" placeholder="Enter ASHA worker phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <GradientButton title="Login as ASHA Worker" onPress={handleStaffLogin} gradient={colors.gradientPurple} loading={loading} style={{ marginTop: 10 }} />
          </View>
        );
      } else {
        return (
          <View>
            <InputField label="Full Name" icon="👩‍⚕️" placeholder="Name" value={fullName} onChangeText={setFullName} />
            <InputField label="Phone Number" icon="📱" placeholder="+91" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <InputField label="Village / Panchayat" icon="🏡" placeholder="Village Name" value={village} onChangeText={setVillage} />
            <InputField label="District" icon="📍" placeholder="District" value={district} onChangeText={setDistrict} />
            <GradientButton title="Register ASHA Worker" onPress={handleRegister} gradient={colors.gradientPurple} loading={loading} style={{ marginTop: 10 }} />
          </View>
        );
      }
    }

    // --- DOCTOR ---
    if (activeTab === 'doctor') {
      if (isLogin) {
        return (
          <View>
            <InputField label="Email Address" icon="✉️" placeholder="name@hospital.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <InputField label="Password" icon="🔒" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
            <GradientButton title="Doctor Secure Login" onPress={handleStaffLogin} gradient={colors.gradientGreen} loading={loading} style={{ marginTop: 10 }} />
          </View>
        );
      } else {
        return (
          <View>
            <InputField label="Dr. Full Name" icon="👨‍⚕️" placeholder="Dr. Ramesh Kumar" value={fullName} onChangeText={setFullName} />
            <InputField label="Phone Number" icon="📱" placeholder="+91XXXXXXXXXX" keyboardType="phone-pad" value={docPhone} onChangeText={setDocPhone} />
            <InputField label="Email Address" icon="✉️" placeholder="name@hospital.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <InputField label="Password" icon="🔒" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
            <InputField label="Medical License ID *" icon="📜" placeholder="MCI/NMC License No." value={license} onChangeText={setLicense} />
            <View style={{flexDirection:'row', gap:10}}>
              <View style={{flex:2}}><InputField label="Specialization" icon="🩺" placeholder="e.g. Cardiology" value={specialization} onChangeText={setSpecialization} /></View>
              <View style={{flex:1}}><InputField label="Exp (Yrs)" icon="⏳" placeholder="5" keyboardType="number-pad" value={experience} onChangeText={setExperience} /></View>
            </View>
            <InputField label="Consultation Fee (₹)" icon="₹" placeholder="500" keyboardType="number-pad" value={fee} onChangeText={setFee} />
            <GradientButton title="Apply for Doctor Account" onPress={handleRegister} gradient={colors.gradientGreen} loading={loading} style={{ marginTop: 10 }} />
          </View>
        );
      }
    }

    // --- ADMIN (Login Only) ---
    return (
      <View>
         <InputField label="Admin Email" icon="✉️" placeholder="admin@asha.gov.in" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
         <InputField label="Password" icon="🔒" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
         <GradientButton title="System Admin Login" onPress={handleStaffLogin} gradient={colors.gradientOrange} loading={loading} style={{ marginTop: 10 }} />
      </View>
    );
  };

  // Reset form when switching tabs or auth mode
  const resetForm = () => {
    setError(''); setSuccess(''); setOtpSent(false);
    setPhone(''); setEmail(''); setPassword('');
    setFullName(''); setOtp('');
  };

  const content = (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.brand}>AAROGYA</Text>
        <Text style={styles.subtitle}>AI-powered healthcare for rural India 🇮🇳</Text>
      </View>

      <GlassCard style={styles.card}>
        <View style={styles.tabs}>
          {['patient', 'asha', 'doctor', 'admin'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.tab, activeTab === role && styles.activeTab]}
              onPress={() => { setActiveTab(role); setIsLogin(true); resetForm(); }}
            >
              <Text style={[styles.tabText, activeTab === role && styles.activeTabText]}>
                {role === 'asha' ? 'ASHA' : role.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Auth Toggle (Login / Register) */}
        {activeTab !== 'admin' && ( // No admin reg
          <View style={styles.authToggle}>
            <TouchableOpacity onPress={() => {setIsLogin(true); resetForm();}} style={[styles.toggleBtn, isLogin && styles.toggleActiveBtn]}>
              <Text style={[styles.toggleText, isLogin && styles.toggleActiveText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setIsLogin(false); resetForm();}} style={[styles.toggleBtn, !isLogin && styles.toggleActiveBtn]}>
              <Text style={[styles.toggleText, !isLogin && styles.toggleActiveText]}>Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {renderForm()}

      </GlassCard>
    </ScrollView>
  );

  return (
    <LinearGradient colors={['#080C14', '#0A1128']} style={styles.container}>
      {Platform.OS === 'web' ? (
        content
      ) : (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.flex}
        >
          {content}
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    width: '100%',
    height: '100%',
    minHeight: 0,
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
    } : {}),
  },
  flex: { 
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 0,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      maxHeight: '100vh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    } : {}),
  },
  scroll: { 
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 220,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: { marginBottom: 16, alignItems: 'center' },
  title: { fontSize: 20, color: '#8B9EC8', fontWeight: '500' },
  brand: { fontSize: 32, color: '#00C9FF', fontWeight: '900', letterSpacing: -1, marginTop: -2 },
  subtitle: { color: '#4A5580', marginTop: 6, textAlign: 'center', marginHorizontal: 20, fontSize: 13 },
  card: { padding: 20, marginBottom: 40 },
  
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: 'rgba(0,201,255,0.2)' },
  tabText: { color: '#8B9EC8', fontSize: 11, fontWeight: '700' },
  activeTabText: { color: '#00C9FF' },
  
  authToggle: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)'},
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 8 },
  toggleActiveBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  toggleText: { color: '#8B9EC8', fontSize: 14, fontWeight: '600' },
  toggleActiveText: { color: '#fff' },

  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: 15, fontSize: 13, fontWeight: '500' },
  successText: { color: '#10B981', textAlign: 'center', marginBottom: 15, fontSize: 13, fontWeight: '600' },
});

export default LoginScreen;
