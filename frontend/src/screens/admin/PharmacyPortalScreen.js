import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, FlatList, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  registerPharmacy, addMedicine, updateInventory,
  getAllPharmacies, getAllMedicines, checkMedicineAvailability,
} from '../../api/api';
import Header from '../../components/ui/Header';
import GlassCard from '../../components/ui/GlassCard';
import InputField from '../../components/ui/InputField';
import GradientButton from '../../components/ui/GradientButton';
import { colors } from '../../theme/colors';

// ── Tab Config ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'register', label: 'Register\nPharmacy', icon: 'storefront' },
  { key: 'medicine', label: 'Add\nMedicine', icon: 'flask' },
  { key: 'inventory', label: 'Update\nInventory', icon: 'layers' },
  { key: 'locator',  label: 'Medicine\nLocator',  icon: 'location' },
];

// ── Picker Modal ─────────────────────────────────────────────────────────
const PickerModal = ({ visible, title, data, selected, onSelect, onClose, keyExtractor, labelExtractor }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={mStyles.overlay}>
      <View style={mStyles.sheet}>
        <View style={mStyles.handle} />
        <View style={mStyles.header}>
          <Text style={mStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={26} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => {
            const label = labelExtractor(item);
            const isSelected = selected === keyExtractor(item);
            return (
              <TouchableOpacity
                style={[mStyles.item, isSelected && mStyles.itemActive]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[mStyles.itemText, isSelected && { color: colors.cyan, fontWeight: '700' }]}>
                  {label}
                </Text>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.cyan} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={mStyles.empty}>No items found. Please add some first.</Text>}
        />
      </View>
    </View>
  </Modal>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1: Register Pharmacy
// ─────────────────────────────────────────────────────────────────────────────
const RegisterPharmacyTab = () => {
  const [form, setForm] = useState({
    name: '', address: '', village: '', district: '', state: '', phone: '',
    latitude: '', longitude: '',
  });
  const [loading, setLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.district || !form.state) {
      return Alert.alert('Missing Fields', 'Name, District, and State are required.');
    }
    try {
      setLoading(true);
      const res = await registerPharmacy({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setLastCreated(res.data);
      setForm({ name: '', address: '', village: '', district: '', state: '', phone: '', latitude: '', longitude: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">
      <GlassCard style={s.formCard}>
        <View style={s.formHeader}>
          <View style={[s.iconBg, { backgroundColor: 'rgba(0,201,255,0.1)' }]}>
            <Ionicons name="storefront" size={22} color={colors.cyan} />
          </View>
          <View>
            <Text style={s.formTitle}>Register Pharmacy</Text>
            <Text style={s.formSub}>Add a new pharmacy to the rural network</Text>
          </View>
        </View>

        <InputField label="Pharmacy Name *" icon="🏪" placeholder="e.g. Nabha Medical Store" value={form.name} onChangeText={v => set('name', v)} />
        <InputField label="Address / Landmark" icon="📍" placeholder="Main Bazaar, Near Bus Stand" value={form.address} onChangeText={v => set('address', v)} />

        <View style={s.row}>
          <View style={s.flex}><InputField label="Village" icon="🏘" placeholder="Village" value={form.village} onChangeText={v => set('village', v)} /></View>
          <View style={s.flex}><InputField label="District *" icon="🗺" placeholder="District" value={form.district} onChangeText={v => set('district', v)} /></View>
        </View>
        <View style={s.row}>
          <View style={s.flex}><InputField label="State *" icon="🏛" placeholder="State" value={form.state} onChangeText={v => set('state', v)} /></View>
          <View style={s.flex}><InputField label="Phone" icon="📱" placeholder="+91" keyboardType="phone-pad" value={form.phone} onChangeText={v => set('phone', v)} /></View>
        </View>
        <View style={s.row}>
          <View style={s.flex}><InputField label="Latitude" icon="🌐" placeholder="30.3765" keyboardType="decimal-pad" value={form.latitude} onChangeText={v => set('latitude', v)} /></View>
          <View style={s.flex}><InputField label="Longitude" icon="🌐" placeholder="76.1445" keyboardType="decimal-pad" value={form.longitude} onChangeText={v => set('longitude', v)} /></View>
        </View>

        <GradientButton title="Register Pharmacy" icon="add-circle" gradient={['#00C9FF', '#0066FF']} onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
      </GlassCard>

      {lastCreated && (
        <GlassCard style={s.successCard}>
          <View style={s.successHeader}>
            <Ionicons name="checkmark-circle" size={22} color={colors.green} />
            <Text style={s.successTitle}>Pharmacy Registered!</Text>
          </View>
          <View style={s.idRow}>
            <Text style={s.idLabel}>ID</Text>
            <Text style={s.idValue}>{lastCreated.pharmacy_id}</Text>
          </View>
          <Text style={s.successSub}>{lastCreated.name} — {lastCreated.district}, {lastCreated.state}</Text>
        </GlassCard>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2: Add Medicine
// ─────────────────────────────────────────────────────────────────────────────
const AddMedicineTab = () => {
  const TYPES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other'];
  const [form, setForm] = useState({ name: '', description: '', manufacturer: '', type: '', price_per_unit: '', is_generic: false });
  const [loading, setLoading] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name) return Alert.alert('Missing Fields', 'Medicine name is required.');
    try {
      setLoading(true);
      const res = await addMedicine({ ...form, price_per_unit: form.price_per_unit ? parseFloat(form.price_per_unit) : null });
      setLastCreated(res.data);
      setForm({ name: '', description: '', manufacturer: '', type: '', price_per_unit: '', is_generic: false });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">
      <GlassCard style={s.formCard}>
        <View style={s.formHeader}>
          <View style={[s.iconBg, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
            <Ionicons name="flask" size={22} color={colors.purple} />
          </View>
          <View>
            <Text style={s.formTitle}>Add Medicine</Text>
            <Text style={s.formSub}>Add to the global medicine directory</Text>
          </View>
        </View>

        <InputField label="Medicine Name *" icon="💊" placeholder="e.g. Paracetamol 500mg" value={form.name} onChangeText={v => set('name', v)} />
        <InputField label="Description" icon="📝" placeholder="Used to treat fever and pain..." value={form.description} onChangeText={v => set('description', v)} multiline />
        <InputField label="Manufacturer" icon="🏭" placeholder="e.g. Sun Pharma" value={form.manufacturer} onChangeText={v => set('manufacturer', v)} />

        <Text style={s.fieldLabel}>Medicine Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14, paddingTop: 2 }}>
          {TYPES.map(t => (
            <TouchableOpacity key={t} style={[s.chip, form.type === t && s.chipActive]} onPress={() => set('type', form.type === t ? '' : t)}>
              <Text style={[s.chipText, form.type === t && s.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.row}>
          <View style={s.flex}>
            <InputField label="Price (₹/unit)" icon="₹" placeholder="50" keyboardType="decimal-pad" value={form.price_per_unit} onChangeText={v => set('price_per_unit', v)} />
          </View>
          <View style={[s.flex, { justifyContent: 'center', paddingTop: 16 }]}>
            <TouchableOpacity style={s.checkRow} onPress={() => set('is_generic', !form.is_generic)}>
              <View style={[s.checkbox, form.is_generic && s.checkboxOn]}>
                {form.is_generic && <Ionicons name="checkmark" size={14} color="#000" />}
              </View>
              <Text style={s.checkLabel}>Generic</Text>
            </TouchableOpacity>
          </View>
        </View>

        <GradientButton title="Add to Directory" icon="add-circle" gradient={colors.gradientPurple} onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
      </GlassCard>

      {lastCreated && (
        <GlassCard style={s.successCard}>
          <View style={s.successHeader}>
            <Ionicons name="checkmark-circle" size={22} color={colors.green} />
            <Text style={s.successTitle}>Medicine Added!</Text>
          </View>
          <View style={s.idRow}>
            <Text style={s.idLabel}>ID</Text>
            <Text style={s.idValue}>{lastCreated.medicine_id}</Text>
          </View>
          <Text style={s.successSub}>{lastCreated.name}{lastCreated.manufacturer ? ` — ${lastCreated.manufacturer}` : ''}</Text>
          {lastCreated.is_generic && (
            <View style={s.genericBadge}>
              <Ionicons name="leaf" size={12} color={colors.green} />
              <Text style={s.genericText}>Low-cost Generic Alternative</Text>
            </View>
          )}
        </GlassCard>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3: Update Inventory
// ─────────────────────────────────────────────────────────────────────────────
const UpdateInventoryTab = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [selPharmacy, setSelPharmacy] = useState(null);
  const [selMedicine, setSelMedicine] = useState(null);
  const [qty, setQty] = useState('');
  const [pharmModal, setPharmModal] = useState(false);
  const [medModal, setMedModal] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [pr, mr] = await Promise.all([getAllPharmacies(), getAllMedicines()]);
        setPharmacies(pr.data || []);
        setMedicines(mr.data || []);
      } catch (e) { console.log('Load error', e); }
      finally { setDataLoading(false); }
    })();
  }, []);

  const handleUpdate = async () => {
    if (!selPharmacy || !selMedicine || !qty) {
      return Alert.alert('Missing Fields', 'Please select pharmacy, medicine, and enter quantity.');
    }
    try {
      setLoading(true);
      await updateInventory({ pharmacy_id: selPharmacy.pharmacy_id, medicine_id: selMedicine.medicine_id, stock_quantity: parseInt(qty) });
      setLastResult({ pharmacy: selPharmacy.name, medicine: selMedicine.name, qty });
      setSelPharmacy(null); setSelMedicine(null); setQty('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Inventory update failed');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) return (
    <View style={s.loaderBox}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={s.loaderText}>Loading pharmacies & medicines...</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">
      <GlassCard style={s.formCard}>
        <View style={s.formHeader}>
          <View style={[s.iconBg, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <Ionicons name="layers" size={22} color={colors.orange} />
          </View>
          <View>
            <Text style={s.formTitle}>Update Inventory</Text>
            <Text style={s.formSub}>Set stock level for a medicine at a pharmacy</Text>
          </View>
        </View>

        <Text style={s.fieldLabel}>Select Pharmacy *</Text>
        <TouchableOpacity style={s.picker} onPress={() => setPharmModal(true)}>
          <View style={s.pickerLeft}>
            <Ionicons name="storefront-outline" size={18} color={selPharmacy ? colors.cyan : colors.textMuted} />
            <Text style={[s.pickerText, !selPharmacy && { color: colors.textMuted }]}>
              {selPharmacy ? selPharmacy.name : 'Choose a pharmacy...'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {selPharmacy && <Text style={s.pickerSub}>ID: {selPharmacy.pharmacy_id} — {selPharmacy.district}</Text>}

        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Select Medicine *</Text>
        <TouchableOpacity style={s.picker} onPress={() => setMedModal(true)}>
          <View style={s.pickerLeft}>
            <Ionicons name="flask-outline" size={18} color={selMedicine ? colors.purple : colors.textMuted} />
            <Text style={[s.pickerText, !selMedicine && { color: colors.textMuted }]}>
              {selMedicine ? selMedicine.name : 'Choose a medicine...'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {selMedicine && <Text style={s.pickerSub}>ID: {selMedicine.medicine_id}</Text>}

        <InputField label="Stock Quantity *" icon="📦" placeholder="e.g. 50" keyboardType="number-pad" value={qty} onChangeText={setQty} style={{ marginTop: 14 }} />

        <GradientButton title="Update Stock" icon="arrow-up-circle" gradient={colors.gradientOrange} onPress={handleUpdate} loading={loading} style={{ marginTop: 8 }} />
      </GlassCard>

      {lastResult && (
        <GlassCard style={s.successCard}>
          <View style={s.successHeader}>
            <Ionicons name="checkmark-circle" size={22} color={colors.green} />
            <Text style={s.successTitle}>Inventory Updated!</Text>
          </View>
          <Text style={s.successSub}>
            <Text style={{ color: colors.cyan }}>{lastResult.medicine}</Text>{' '}→ {lastResult.pharmacy}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{lastResult.qty} units in stock</Text>
          </View>
        </GlassCard>
      )}

      <PickerModal
        visible={pharmModal}
        title="Select Pharmacy"
        data={pharmacies}
        selected={selPharmacy?.pharmacy_id}
        onSelect={setSelPharmacy}
        onClose={() => setPharmModal(false)}
        keyExtractor={p => p.pharmacy_id}
        labelExtractor={p => `${p.name}  •  ${p.district}`}
      />
      <PickerModal
        visible={medModal}
        title="Select Medicine"
        data={medicines}
        selected={selMedicine?.medicine_id}
        onSelect={setSelMedicine}
        onClose={() => setMedModal(false)}
        keyExtractor={m => m.medicine_id}
        labelExtractor={m => m.name + (m.manufacturer ? ` (${m.manufacturer})` : '')}
      />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4: Medicine Locator
// ─────────────────────────────────────────────────────────────────────────────
const MedicineLocatorTab = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true); setError(''); setResult(null);
      const res = await checkMedicineAvailability(query.trim());
      setResult(res.data);
    } catch (err) {
      setError(err.response?.status === 404
        ? `"${query}" not found in any pharmacy.`
        : err.response?.data?.detail || 'Search failed. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const stockColor = (qty) => qty >= 50 ? colors.green : qty >= 10 ? colors.orange : colors.red;
  const stockLabel = (qty) => qty >= 50 ? '✅ Well Stocked' : qty >= 10 ? '⚠️ Low Stock' : '🚨 Critical — Restock Needed';

  return (
    <ScrollView contentContainerStyle={s.tabContent} keyboardShouldPersistTaps="handled">
      <GlassCard style={s.formCard}>
        <View style={s.formHeader}>
          <View style={[s.iconBg, { backgroundColor: 'rgba(0,201,255,0.1)' }]}>
            <Ionicons name="location" size={22} color={colors.cyan} />
          </View>
          <View>
            <Text style={s.formTitle}>Medicine Locator</Text>
            <Text style={s.formSub}>See which pharmacies stock a medicine</Text>
          </View>
        </View>
        <InputField icon="🔍" placeholder="e.g. Paracetamol" value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} returnKeyType="search" />
        <GradientButton title="Find Pharmacies" icon="search" gradient={['#00C9FF', '#0066FF']} onPress={handleSearch} loading={loading} style={{ marginTop: 10 }} />
      </GlassCard>

      {error ? (
        <GlassCard style={s.errorCard}>
          <Ionicons name="alert-circle" size={18} color={colors.red} />
          <Text style={s.errorText}>{error}</Text>
        </GlassCard>
      ) : null}

      {result && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[s.fieldLabel, { marginBottom: 0 }]}>STOCKING </Text>
            <Text style={[s.fieldLabel, { color: colors.cyan, marginBottom: 0, textTransform: 'none' }]}>"{result.medicine}"</Text>
          </View>

          {Array.isArray(result.available_at) && result.available_at.length > 0 ? (
            result.available_at.map((ph, i) => (
              <GlassCard key={i} style={s.pharmaCard}>
                <View style={s.pharmaHeader}>
                  <View style={s.pharmaIconBg}>
                    <Ionicons name="medkit" size={22} color={colors.cyan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.pharmaName}>{ph.pharmacy}</Text>
                    <Text style={s.pharmaDist}>📍 {ph.district}</Text>
                  </View>
                  <View style={[s.stockBadge, { borderColor: stockColor(ph.stock) }]}>
                    <Text style={[s.stockNum, { color: stockColor(ph.stock) }]}>{ph.stock}</Text>
                    <Text style={s.stockUnits}>units</Text>
                  </View>
                </View>
                {/* Stock bar */}
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${Math.min(100, (ph.stock / 100) * 100)}%`, backgroundColor: stockColor(ph.stock) }]} />
                </View>
                <Text style={[s.stockStatus, { color: stockColor(ph.stock) }]}>{stockLabel(ph.stock)}</Text>
              </GlassCard>
            ))
          ) : (
            <GlassCard style={s.errorCard}>
              <Ionicons name="alert-circle" size={18} color={colors.orange} />
              <Text style={s.errorText}>No pharmacies currently stock this medicine.</Text>
            </GlassCard>
          )}
        </View>
      )}
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen Component
// ─────────────────────────────────────────────────────────────────────────────
const PharmacyPortalScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(0);
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabAnim, { toValue: activeTab, useNativeDriver: false, tension: 120, friction: 10 }).start();
  }, [activeTab]);

  const TAB_PCT = 100 / TABS.length;

  return (
    <View style={s.container}>
      <Header title="Pharmacy" subtitle="Inventory Portal" roleColor={colors.orange} rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map((tab, idx) => {
          const active = activeTab === idx;
          return (
            <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setActiveTab(idx)} activeOpacity={0.75}>
              <Ionicons name={tab.icon} size={20} color={active ? colors.cyan : colors.textMuted} style={{ marginBottom: 3 }} />
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
        {/* Sliding indicator */}
        <Animated.View style={[s.indicator, {
          width: `${TAB_PCT}%`,
          left: tabAnim.interpolate({
            inputRange: TABS.map((_, i) => i),
            outputRange: TABS.map((_, i) => `${i * TAB_PCT}%`),
          }),
        }]} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 0 && <RegisterPharmacyTab />}
        {activeTab === 1 && <AddMedicineTab />}
        {activeTab === 2 && <UpdateInventoryTab />}
        {activeTab === 3 && <MedicineLocatorTab />}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  tabBar: { flexDirection: 'row', backgroundColor: '#090E1C', borderBottomWidth: 1, borderBottomColor: colors.border, position: 'relative' },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabLabel: { fontSize: 9.5, fontWeight: '600', color: colors.textMuted, textAlign: 'center', lineHeight: 12 },
  tabLabelActive: { color: colors.cyan },
  indicator: { position: 'absolute', bottom: 0, height: 2, backgroundColor: colors.cyan, borderRadius: 2 },

  tabContent: { padding: 16, paddingBottom: 100 },

  formCard: { padding: 20, marginBottom: 16 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '800' },
  formSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },

  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: colors.purple },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: colors.purple, fontWeight: '700' },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.green },
  checkLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4 },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  pickerText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  pickerSub: { color: colors.textMuted, fontSize: 11, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },

  successCard: { padding: 16, borderColor: 'rgba(0,242,169,0.2)', marginBottom: 16 },
  successHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  successTitle: { color: colors.green, fontSize: 16, fontWeight: '800' },
  successSub: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  idLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  idValue: { color: colors.cyan, fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  genericBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,242,169,0.08)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  genericText: { color: colors.green, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  loaderBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loaderText: { color: colors.textMuted, marginTop: 12, fontSize: 14 },

  pharmaCard: { padding: 16, marginBottom: 12 },
  pharmaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pharmaIconBg: { width: 46, height: 46, borderRadius: 12, backgroundColor: 'rgba(0,201,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  pharmaName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  pharmaDist: { color: colors.textSecondary, fontSize: 12 },
  stockBadge: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  stockNum: { fontSize: 20, fontWeight: '800' },
  stockUnits: { color: colors.textMuted, fontSize: 9, textTransform: 'uppercase', fontWeight: '600' },
  barTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  stockStatus: { fontSize: 12, fontWeight: '700' },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderColor: 'rgba(239,68,68,0.15)', marginBottom: 12 },
  errorText: { color: colors.red, fontSize: 13, fontWeight: '500', flex: 1 },
});

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F1729', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '65%' },
  handle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemActive: { backgroundColor: 'rgba(0,201,255,0.05)', paddingHorizontal: 10, borderRadius: 10, borderBottomColor: 'transparent' },
  itemText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500', flex: 1 },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: 30, fontSize: 14 },
});

export default PharmacyPortalScreen;
