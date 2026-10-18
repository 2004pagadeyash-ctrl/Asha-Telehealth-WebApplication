import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkSymptoms, getPatientVoiceReports } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusBadge from '../../components/ui/StatusBadge';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

const SymptomCheckerScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const recognizerRef = useRef(null);

  const toggleRecording = () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Voice recognition not supported. Please use Chrome.');
        return;
      }
      if (isRecording) {
        recognizerRef.current && recognizerRef.current.stop();
        setIsRecording(false);
      } else {
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-IN';
        recognizerRef.current = recognizer;
        setSymptomText('');
        setResult(null);
        setIsRecording(true);
        recognizer.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setSymptomText(transcript);
        };
        recognizer.onerror = () => setIsRecording(false);
        recognizer.onend = () => setIsRecording(false);
        recognizer.start();
      }
    } else {
      if (isRecording) {
        setIsRecording(false);
      } else {
        setIsRecording(true);
        setSymptomText('');
        setResult(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!symptomText.trim()) return;
    try {
      setLoading(true);
      const res = await checkSymptoms(symptomText);
      setResult(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="AI Assistant" subtitle="Symptom Checker" rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, width: '100%' }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={true}
        >

          <GlassCard style={styles.card}>
            <Text style={styles.helperText}>
              Describe your symptoms below, or tap the microphone to speak securely to the AI Doctor Assistant.
            </Text>

            <View style={[styles.inputContainer, isRecording && styles.inputRecording]}>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="E.g., I have a fever and dry cough..."
                placeholderTextColor={colors.textMuted}
                value={symptomText}
                onChangeText={setSymptomText}
                editable={!isRecording}
              />
              <TouchableOpacity style={styles.micBtn} onPress={toggleRecording}>
                <View style={[styles.micBg, isRecording && styles.micBgActive]}>
                  {isRecording ? (
                    <Text style={styles.recordingDot}>🔴</Text>
                  ) : (
                    <Ionicons name="mic" size={20} color={colors.bg} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <GradientButton 
              title="Analyze Symptoms" 
              onPress={handleAnalyze} 
              loading={loading}
              disabled={!symptomText.trim()}
              style={{ marginTop: 20 }} 
            />
          </GlassCard>

          {result && (
            <View style={styles.resultArea}>
              <Text style={styles.sectionTitle}>AI Evaluation Report</Text>
              
              <GlassCard style={styles.resultCard}>
                
                {result.recommendation.includes("EMERGENCY") ? (
                  <View style={styles.alertBanner}>
                    <Ionicons name="warning" size={24} color="#fff" />
                    <Text style={styles.alertText}>{result.recommendation}</Text>
                  </View>
                ) : (
                  <View style={styles.recBanner}>
                    <Ionicons name="information-circle" size={24} color={colors.cyan} />
                    <Text style={styles.recText}>{result.recommendation}</Text>
                  </View>
                )}

                <Text style={styles.label}>Possible Conditions Identified:</Text>
                <View style={styles.badgeContainer}>
                  {result.possible_conditions.map((cond, i) => (
                    <StatusBadge key={i} status={cond} style={{ marginRight: 8, marginBottom: 8 }} />
                  ))}
                </View>

                <View style={styles.disclaimerBox}>
                  <Text style={styles.disclaimer}>{result.disclaimer}</Text>
                </View>

                <GradientButton 
                  title="Book Teleconsultation Now"
                  gradient={colors.gradientGreen}
                  onPress={() => navigation.navigate("Appointments")}
                  style={{ marginTop: 20 }}
                />

              </GlassCard>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },
  card: { padding: 20 },
  helperText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  
  inputContainer: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 15,
    minHeight: 120,
    flexDirection: 'row',
  },
  inputRecording: { borderColor: colors.red, backgroundColor: 'rgba(239,68,68,0.05)' },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  micBtn: { justifyContent: 'flex-end', marginLeft: 10 },
  micBg: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.cyan,
    alignItems: 'center', justifyContent: 'center',
  },
  micBgActive: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1, borderColor: colors.red,
  },
  recordingDot: { fontSize: 16 },

  resultArea: { marginTop: 30 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  resultCard: { padding: 20, borderColor: colors.borderAccent },

  alertBanner: { flexDirection: 'row', backgroundColor: colors.error, padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, gap: 10 },
  alertText: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 20 },

  recBanner: { flexDirection: 'row', backgroundColor: 'rgba(0,201,255,0.1)', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, gap: 10 },
  recText: { color: colors.cyan, fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },

  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 10 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },

  disclaimerBox: { backgroundColor: colors.bg, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  disclaimer: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
});

export default SymptomCheckerScreen;
