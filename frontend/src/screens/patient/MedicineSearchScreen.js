import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchMedicines, checkMedicineAvailability } from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

const MedicineSearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // Medicines matching query
  const [availability, setAvailability] = useState(null); // Stock across pharmacies
  const [error, setError] = useState('');
  const [orderedMeds, setOrderedMeds] = useState([]); // Array of pharmacy names to show "Ordered" state

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true); setError(''); setSearchResult(null); setAvailability(null);
      const res = await searchMedicines(query);
      setSearchResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'No medicines found matching your search.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStock = async (medicineName) => {
    try {
      setLoading(true); setError('');
      const res = await checkMedicineAvailability(medicineName);
      setAvailability(res.data);
    } catch (err) {
      setError('Could not fetch pharmacy stock at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Pharmacy" subtitle="Medicine Finder" rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
      >
        
        <GlassCard style={styles.searchCard}>
          <InputField
            icon="💊"
            placeholder="Search medicine (e.g., Amoxicillin)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={{ marginBottom: 4 }}
          />
          <GradientButton 
            title="Search Alternatives & Price" 
            onPress={handleSearch}
            loading={loading && !searchResult}
            gradient={colors.gradientPurple}
            style={{ marginTop: 10 }}
          />
        </GlassCard>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Display Search Results & Generics */}
        {searchResult && !availability && (
          <View style={styles.resultsArea}>
            <Text style={styles.sectionTitle}>Found Medicines</Text>
            {searchResult.map(med => (
              <GlassCard key={med.medicine_id} style={styles.medCard}>
                <View style={styles.medHeader}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medPrice}>₹{med.price_per_unit}</Text>
                </View>
                <Text style={styles.medType}>Type: {med.type} | Company: {med.manufacturer}</Text>
                
                {med.is_generic && (
                  <View style={styles.genericBadge}>
                    <Ionicons name="leaf" size={12} color={colors.green} />
                    <Text style={styles.genericText}>Low-cost Generic Alternative</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.stockBtn} 
                  onPress={() => handleCheckStock(med.name)}
                >
                  <Text style={styles.stockBtnText}>Find Nearby Pharmacies</Text>
                  <Ionicons name="location" size={16} color={colors.cyan} />
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Display Pharmacy Availability */}
        {availability && (
          <View style={styles.resultsArea}>
            <View style={styles.availHeader}>
              <TouchableOpacity onPress={() => setAvailability(null)} style={styles.backLink}>
                <Ionicons name="arrow-back" size={16} color={colors.textSecondary} />
                <Text style={styles.backLinkText}>Back to Meds</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>Pharmacies stocking {availability.medicine}</Text>

            {Array.isArray(availability.available_at) ? (
              availability.available_at.map((ph, i) => (
                <GlassCard key={i} style={styles.pharmacyCard} accent>
                  <View style={styles.pharmacyHeaderRow}>
                    <View style={styles.pharmacyIcon}>
                      <Ionicons name="medkit" size={24} color={colors.cyan} />
                    </View>
                    <View style={styles.pharmacyInfo}>
                      <Text style={styles.pharmacyName}>{ph.pharmacy}</Text>
                      <Text style={styles.pharmacyLoc}>District: {ph.district}</Text>
                      <TouchableOpacity 
                        style={styles.mapLinkBtn}
                        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ph.pharmacy + ' ' + ph.district)}`)}
                      >
                        <Ionicons name="navigate-circle" size={16} color={colors.blue} />
                        <Text style={styles.mapLinkText}>Get Directions</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.stockBadge}>
                      <Text style={styles.stockNum}>{ph.stock}</Text>
                      <Text style={styles.stockLbl}>In Stock</Text>
                    </View>
                  </View>

                  {/* Embedded Map for Web */}
                  {Platform.OS === 'web' && (
                    <View style={styles.mapEmbedContainer}>
                      <iframe 
                        width="100%" 
                        height="180" 
                        frameBorder="0" 
                        style={{ border: 0, borderRadius: 12, marginTop: 12 }}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(ph.pharmacy + ' ' + ph.district)}&authuser=0&output=embed`}
                        allowFullScreen
                      />
                    </View>
                  )}

                  <GradientButton 
                    title={orderedMeds.includes(ph.pharmacy) ? "Order Placed" : "Order for Home Delivery"} 
                    icon={orderedMeds.includes(ph.pharmacy) ? "checkmark-circle" : "bicycle"}
                    gradient={orderedMeds.includes(ph.pharmacy) ? colors.gradientGreen : colors.gradientBlue}
                    onPress={() => {
                      if (!orderedMeds.includes(ph.pharmacy)) {
                        setOrderedMeds([...orderedMeds, ph.pharmacy]);
                        Alert.alert('Order Placed', `Your order for ${availability.medicine} has been sent to ${ph.pharmacy}. A delivery partner will assign it shortly.`);
                      }
                    }}
                    style={{ marginTop: 16 }}
                  />
                </GlassCard>
              ))
            ) : (
              <Text style={styles.errorText}>{availability.available_at}</Text>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },
  searchCard: { padding: 20, marginBottom: 24, zIndex: 10 },
  errorText: { color: colors.error, textAlign: 'center', marginBottom: 20, fontSize: 13, fontWeight: '500' },
  
  resultsArea: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  
  medCard: { padding: 16, marginBottom: 12 },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  medName: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  medPrice: { color: colors.green, fontSize: 18, fontWeight: '800' },
  medType: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  
  genericBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,242,169,0.1)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 14 },
  genericText: { color: colors.green, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  stockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,201,255,0.1)', paddingVertical: 12, borderRadius: 10 },
  stockBtnText: { color: colors.cyan, fontSize: 14, fontWeight: '700' },

  availHeader: { marginBottom: 16 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },

  pharmacyCard: { padding: 16, marginBottom: 12 },
  pharmacyHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  pharmacyIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(0,201,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  pharmacyInfo: { flex: 1 },
  pharmacyName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  pharmacyLoc: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  mapLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapLinkText: { color: colors.blue, fontSize: 12, fontWeight: '700' },
  mapEmbedContainer: { width: '100%', borderRadius: 12, overflow: 'hidden' },
  stockBadge: { alignItems: 'center', backgroundColor: colors.bg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  stockNum: { color: colors.cyan, fontSize: 18, fontWeight: '800' },
  stockLbl: { color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', fontWeight: '600', marginTop: 2 },
});

export default MedicineSearchScreen;
