import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Keyboard, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { COLORS, GOOGLE_MAPS_KEY } from '../../../config';
import { addressAPI } from '../../services/api';

const LABELS = ['Home', 'Work', 'Other'];
const LABEL_ICONS = { Home: 'home', Work: 'briefcase', Other: 'location' };

export default function AddAddressScreen({ navigation, route }) {
  const prefill   = route?.params?.prefill || null;
  const pickMode  = route?.params?.pickMode || false;

  const [step, setStep]         = useState(prefill ? 2 : 1); // 1=search, 2=details
  const [selAddress, setSelAddress] = useState(prefill?.address || '');
  const [lat, setLat]           = useState(prefill?.lat || null);
  const [lng, setLng]           = useState(prefill?.lng || null);

  // Detail fields
  const [flatNo, setFlatNo]     = useState('');
  const [landmark, setLandmark] = useState('');
  const [label, setLabel]       = useState('Home');
  const [saving, setSaving]     = useState(false);

  const autoRef = useRef(null);

  useEffect(() => {
    if (prefill?.address && autoRef.current) {
      autoRef.current.setAddressText(prefill.address);
    }
  }, [prefill]);

  const handlePlaceSelect = (data, details) => {
    const addr = data.description || data.structured_formatting?.main_text || '';
    setSelAddress(addr);
    if (details?.geometry?.location) {
      setLat(details.geometry.location.lat);
      setLng(details.geometry.location.lng);
    }
    Keyboard.dismiss();
    setStep(2);
  };

  const handleSave = async () => {
    if (!selAddress.trim()) {
      Alert.alert('Required', 'Please select or search for an address first');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label:    label,
        saveAs:   label,
        flatNo:   flatNo.trim(),
        houseNo:  flatNo.trim(),
        landmark: landmark.trim(),
        address:  selAddress.trim(),
        lat,
        lng,
      };
      const res  = await addressAPI.create(payload);
      const saved = res.address || { ...payload, _id: String(Date.now()) };

      if (route?.params?.onSelect) {
        route.params.onSelect(saved);
      }
      // Go back to address list
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not save address. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Step 1: Search ── */
  if (step === 1) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Location</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchWrap}>
          <GooglePlacesAutocomplete
            ref={autoRef}
            placeholder="Search area, street, landmark…"
            onPress={handlePlaceSelect}
            fetchDetails={true}
            query={{
              key: GOOGLE_MAPS_KEY,
              language: 'en',
              components: 'country:in',
            }}
            styles={{
              container:         { flex: 0 },
              textInputContainer: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 8 },
              textInput:         { height: 48, fontSize: 14, color: '#1a1a1a', backgroundColor: '#fff' },
              listView:          { backgroundColor: '#fff', borderRadius: 12, marginTop: 4, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 },
              row:               { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
              description:       { fontSize: 13, color: '#333' },
              poweredContainer:  { display: 'none' },
            }}
            renderLeftButton={() => (
              <Ionicons name="search-outline" size={18} color="#999" style={{ alignSelf: 'center', marginLeft: 10 }} />
            )}
            enablePoweredByContainer={false}
            debounce={300}
            minLength={2}
            nearbyPlacesAPI="GooglePlacesSearch"
            GooglePlacesSearchQuery={{ rankby: 'distance' }}
          />
        </View>

        {/* Quick tip */}
        <View style={styles.tip}>
          <Ionicons name="information-circle-outline" size={16} color="#999" />
          <Text style={styles.tipText}>Type your area, apartment name, or street</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Step 2: Fill Details ── */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Selected address display */}
        <TouchableOpacity style={styles.selectedAddr} onPress={() => setStep(1)}>
          <Ionicons name="location-sharp" size={20} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.selectedAddrText} numberOfLines={2}>{selAddress}</Text>
            <Text style={styles.selectedAddrChange}>Tap to change</Text>
          </View>
          <Ionicons name="pencil-outline" size={16} color="#999" />
        </TouchableOpacity>

        {/* Label selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Save as</Text>
          <View style={styles.labelRow}>
            {LABELS.map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.labelChip, label === l && styles.labelChipActive]}
                onPress={() => setLabel(l)}
              >
                <Ionicons
                  name={LABEL_ICONS[l]}
                  size={16}
                  color={label === l ? '#fff' : '#666'}
                />
                <Text style={[styles.labelText, label === l && styles.labelTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Flat / Door No */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flat / House No. (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 4B, First Floor"
            placeholderTextColor="#bbb"
            value={flatNo}
            onChangeText={setFlatNo}
            returnKeyType="next"
          />
        </View>

        {/* Landmark */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Landmark (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Near Big Bazaar"
            placeholderTextColor="#bbb"
            value={landmark}
            onChangeText={setLandmark}
            returnKeyType="done"
          />
        </View>

        {/* Full address preview */}
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Ionicons name={LABEL_ICONS[label]} size={18} color={COLORS.primary} />
            <Text style={styles.previewLabel}>{label}</Text>
          </View>
          {flatNo ? <Text style={styles.previewFlat}>{flatNo}</Text> : null}
          <Text style={styles.previewAddr} numberOfLines={3}>{selAddress}</Text>
          {landmark ? <Text style={styles.previewLandmark}>Near: {landmark}</Text> : null}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Address</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f5f5f5' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn:        { padding: 4 },
  headerTitle:    { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },

  /* Step 1 */
  searchWrap:     { margin: 12, zIndex: 10 },
  tip:            { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginTop: 10 },
  tipText:        { fontSize: 12, color: '#999' },

  /* Step 2 */
  scroll:         { padding: 16 },

  selectedAddr:   { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, gap: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  selectedAddrText:   { fontSize: 13, color: '#1a1a1a', fontWeight: '600', lineHeight: 20 },
  selectedAddrChange: { fontSize: 11, color: COLORS.primary, marginTop: 3, fontWeight: '600' },

  section:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sectionTitle:   { fontSize: 13, fontWeight: '700', color: '#999', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  labelRow:       { flexDirection: 'row', gap: 10 },
  labelChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 30, borderWidth: 1.5, borderColor: '#eee', backgroundColor: '#f9f9f9' },
  labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelText:      { fontSize: 13, fontWeight: '700', color: '#666' },
  labelTextActive: { color: '#fff' },

  input:          { borderWidth: 1.5, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1a1a1a', backgroundColor: '#fafafa' },

  previewCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: COLORS.primary, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  previewRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  previewLabel:   { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  previewFlat:    { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 2 },
  previewAddr:    { fontSize: 13, color: '#666', lineHeight: 20 },
  previewLandmark: { fontSize: 12, color: '#999', marginTop: 4 },

  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  saveBtn:        { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  saveBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },
});
