import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Image, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../../services/api';

const CHICKEN_IMAGE = 'https://images.unsplash.com/photo-1748522369232-63cd54f1a007?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200';
const { height: SCREEN_H } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const IMAGE_HEIGHT = Math.round(SCREEN_H * 0.46) + insets.top;

  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const scrollRef = useRef(null);

  const validate = () => {
    const e = {};
    const n = name.trim();
    if (!n)              e.name = 'Name is required';
    else if (n.length < 2) e.name = 'At least 2 characters';
    else if (/\d/.test(n)) e.name = 'Name cannot contain numbers';
    if (!phone)               e.phone = 'Phone number is required';
    else if (phone.length !== 10) e.phone = 'Enter a valid 10-digit number';
    else if (!/^[6-9]/.test(phone)) e.phone = 'Must start with 6, 7, 8 or 9';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBlur = field => {
    setTouched(p => ({ ...p, [field]: true }));
    validate();
  };

  const handlePhoneFocus = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: 140, animated: true }), 300);
  };

  const handleSendOTP = async () => {
    setTouched({ name: true, phone: true });
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.sendOTP(phone);
      if (res.success) {
        navigation.navigate('OTP', { phone, name: name.trim(), debug_otp: res.debug_otp });
      } else {
        setErrors({ api: res.message || 'Failed to send OTP. Try again.' });
      }
    } catch {
      setErrors({ api: 'Network error. Check your connection.' });
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim().length >= 2 && phone.length === 10 && /^[6-9]/.test(phone);

  return (
    // Root is WHITE so bottom nav bar matches sheet, not the dark image
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ── Hero: clip a View, pin Image to top so chicken HEAD shows ── */}
          <View style={[styles.heroClip, { height: IMAGE_HEIGHT }]}>
            {/* Image pinned to top — head of chicken stays visible */}
            <Image
              source={{ uri: CHICKEN_IMAGE }}
              style={[styles.heroImage, { height: IMAGE_HEIGHT * 1.45 }]}
              resizeMode="cover"
            />

            {/* Overlay: light at top (chicken visible), dark at bottom (text readable) */}
            <View style={styles.overlayTop} />
            <View style={styles.overlayBottom} />

            {/* Status bar spacer */}
            <View style={{ height: insets.top }} />

            {/* Brand content at bottom of image */}
            <View style={styles.brandBlock}>
              <View style={styles.brandChip}>
                <Text style={styles.brandChipText}>🐔  GoNaatu</Text>
              </View>
              <Text style={styles.headline}>Pure Desi{'\n'}Country Chicken</Text>
              <Text style={styles.headlineSub}>Farm fresh · Delivered in 30 mins</Text>
              <View style={styles.pillRow}>
                <View style={styles.pill}><Text style={styles.pillText}>✅ Natural</Text></View>
                <View style={styles.pill}><Text style={styles.pillText}>🌿 Antibiotic Free</Text></View>
                <View style={styles.pill}><Text style={styles.pillText}>⚡ 30 min</Text></View>
              </View>
            </View>
          </View>

          {/* ── White form sheet overlapping image ── */}
          <View style={styles.sheet}>
            <View style={styles.dragPill} />

            <Text style={styles.sheetTitle}>Get Started</Text>
            <Text style={styles.sheetSub}>Login or create account to order</Text>

            {errors.api ? (
              <View style={styles.apiError}>
                <Ionicons name="alert-circle-outline" size={16} color="#c0392b" />
                <Text style={styles.apiErrorText}>{errors.api}</Text>
              </View>
            ) : null}

            {/* Name */}
            <Text style={styles.label}>Your Name</Text>
            <View style={[styles.inputRow, touched.name && errors.name && styles.inputRowError]}>
              <Ionicons name="person-outline" size={18}
                color={touched.name && errors.name ? '#e53935' : '#bbb'}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#ccc"
                value={name}
                onChangeText={v => { setName(v); if (touched.name) validate(); }}
                onBlur={() => handleBlur('name')}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {touched.name && !errors.name && name.trim().length >= 2 &&
                <Ionicons name="checkmark-circle" size={18} color="#2d6a2d" />}
            </View>
            {touched.name && errors.name
              ? <Text style={styles.errorText}>⚠ {errors.name}</Text> : null}

            {/* Phone */}
            <Text style={[styles.label, { marginTop: 16 }]}>Mobile Number</Text>
            <View style={[styles.inputRow, touched.phone && errors.phone && styles.inputRowError]}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="10-digit mobile number"
                placeholderTextColor="#ccc"
                value={phone}
                onChangeText={t => {
                  const c = t.replace(/[^0-9]/g, '').slice(0, 10);
                  setPhone(c);
                  if (touched.phone) validate();
                }}
                onBlur={() => handleBlur('phone')}
                onFocus={handlePhoneFocus}
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleSendOTP}
              />
              {phone.length > 0 &&
                <Text style={[styles.charCount, phone.length === 10 && { color: '#2d6a2d' }]}>
                  {phone.length}/10
                </Text>}
            </View>
            {touched.phone && errors.phone
              ? <Text style={styles.errorText}>⚠ {errors.phone}</Text> : null}

            {/* Button */}
            <TouchableOpacity
              style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={loading || !isValid}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.btnText}>  Get OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#2d6a2d" />
              <Text style={styles.infoText}>Your number is safe with us. No spam calls.</Text>
            </View>
            <Text style={styles.terms}>By continuing, you agree to our Terms & Privacy Policy</Text>

            {/* Bottom padding — ensures button never hidden by keyboard */}
            <View style={{ height: 32 }} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // WHITE root → bottom nav bar is white (no black bar!)
  root: { flex: 1, backgroundColor: '#fff' },

  /* ── Hero clip: overflow hidden so image can be positioned to top ── */
  heroClip: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    position: 'absolute',
    top: 0,          // PIN to top → chicken HEAD is always shown
    left: 0,
    right: 0,
    width: '100%',
  },
  // Top 55%: very light tint so chicken is clearly visible
  overlayTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  // Bottom 55%: dark so brand text is readable (overlap creates gradient feel)
  overlayBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '65%',
    backgroundColor: 'rgba(10,30,10,0.72)',
  },

  brandBlock: { paddingHorizontal: 22, paddingBottom: 26 },
  brandChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 30, paddingHorizontal: 14, paddingVertical: 6,
    marginBottom: 14,
  },
  brandChipText: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  headline: {
    fontSize: 32, fontWeight: '900', color: '#fff', lineHeight: 38, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  headlineSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 14 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  /* ── Sheet ── */
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 10,
    minHeight: SCREEN_H * 0.56,   // ensure sheet fills rest of screen
  },
  dragPill: { width: 38, height: 4, backgroundColor: '#e0e0e0', borderRadius: 4, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 3 },
  sheetSub:   { fontSize: 13, color: '#999', marginBottom: 22 },

  apiError:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderRadius: 12, padding: 12, marginBottom: 14, gap: 8 },
  apiErrorText: { fontSize: 13, color: '#c0392b', flex: 1 },

  label:      { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#ececec', borderRadius: 16, paddingHorizontal: 14, backgroundColor: '#fafafa', minHeight: 58 },
  inputRowError: { borderColor: '#e53935', backgroundColor: '#fff8f8' },
  input:      { flex: 1, fontSize: 15, color: '#1a1a1a', paddingVertical: 14 },
  countryCode:{ flexDirection: 'row', alignItems: 'center', paddingRight: 12, borderRightWidth: 1, borderRightColor: '#e8e8e8', marginRight: 12, gap: 6 },
  flag:       { fontSize: 18 },
  countryText:{ fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  charCount:  { fontSize: 12, color: '#ccc', fontWeight: '600', marginLeft: 4 },
  errorText:  { fontSize: 12, color: '#e53935', marginTop: 5, marginLeft: 4 },

  btn:        { flexDirection: 'row', backgroundColor: '#2d6a2d', borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24, shadowColor: '#2d6a2d', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  btnDisabled:{ backgroundColor: '#b0c8b0', shadowOpacity: 0, elevation: 0 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },

  infoRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6 },
  infoText: { fontSize: 12, color: '#999' },
  terms:    { textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 10, lineHeight: 16 },
});
