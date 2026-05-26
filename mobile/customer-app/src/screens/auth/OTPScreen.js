import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView,
  Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CHICKEN_IMAGE = 'https://images.unsplash.com/photo-1748522369232-63cd54f1a007?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb&w=1200';

export default function OTPScreen({ route, navigation }) {
  const { phone, name, debug_otp } = route.params;
  const { login } = useAuth();

  const [otp, setOtp]           = useState(debug_otp ? debug_otp.split('') : ['', '', '', '', '', '']);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resendTimer, setTimer] = useState(30);
  const [resending, setResending] = useState(false);
  const [shake, setShake]       = useState(false);

  const inputs = useRef([]);

  useEffect(() => {
    setTimeout(() => inputs.current[0]?.focus(), 300);
    const interval = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (val, idx) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned && val) return; // ignore non-numeric

    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Handle paste - fill from current index
      const chars = cleaned.slice(0, 6 - idx).split('');
      chars.forEach((ch, i) => { newOtp[idx + i] = ch; });
      setOtp(newOtp);
      const nextIdx = Math.min(idx + chars.length, 5);
      inputs.current[nextIdx]?.focus();
      return;
    }

    newOtp[idx] = cleaned;
    setOtp(newOtp);
    setError('');

    if (cleaned && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }

    // Auto verify when last box filled
    if (idx === 5 && cleaned) {
      const fullOtp = [...newOtp.slice(0, 5), cleaned].join('');
      if (fullOtp.length === 6) setTimeout(() => verify(fullOtp), 100);
    }
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[idx]) {
        newOtp[idx] = '';
        setOtp(newOtp);
      } else if (idx > 0) {
        newOtp[idx - 1] = '';
        setOtp(newOtp);
        inputs.current[idx - 1]?.focus();
      }
    }
  };

  const verify = async (otpString) => {
    const code = otpString || otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.verifyOTP(phone, code);
      if (res.success) {
        const userData = { ...res.user, name: name || res.user?.name };
        await login(res.token, userData);
      } else {
        setError(res.message || 'Incorrect OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        setShake(true);
        setTimeout(() => { setShake(false); inputs.current[0]?.focus(); }, 600);
      }
    } catch (e) {
      setError('Network error. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authAPI.sendOTP(phone);
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      setError('Could not resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  const filledCount = otp.filter(d => d !== '').length;

  return (
    // WHITE root → no black bar at bottom
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Image banner — clip view so chicken head is pinned to top */}
          <View style={styles.imgBanner}>
            <Image
              source={{ uri: CHICKEN_IMAGE }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Light tint at top so chicken head is clearly visible */}
            <View style={styles.imgOverlayTop} />
            {/* Dark at bottom so text is readable */}
            <View style={styles.imgOverlayBottom} />

            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.bannerContent}>
              <View style={styles.phoneBadge}>
                <Ionicons name="phone-portrait-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.phoneBadgeText}>+91 {phone}</Text>
              </View>
              <Text style={styles.bannerTitle}>Verify Your{'\n'}Mobile Number</Text>
              <Text style={styles.bannerSub}>OTP sent via SMS · Valid for 5 minutes</Text>
            </View>
          </View>

          {/* Form area - white card */}
          <View style={styles.container}>

          {/* 6 OTP Boxes */}
          <View style={[styles.otpRow, shake && styles.shake]}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={r => inputs.current[idx] = r}
                style={[
                  styles.otpBox,
                  digit && styles.otpBoxFilled,
                  error && styles.otpBoxError,
                  idx === filledCount && !digit && styles.otpBoxActive,
                ]}
                value={digit}
                onChangeText={val => handleChange(val, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                caretHidden
              />
            ))}
          </View>

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {otp.map((d, i) => (
              <View key={i} style={[styles.dot, d && styles.dotFilled]} />
            ))}
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, filledCount < 6 && styles.btnDisabled]}
            onPress={() => verify()}
            disabled={loading || filledCount < 6}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                <Text style={styles.btnText}>  Verify & Continue</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the OTP? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || resending}>
              {resending ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={[styles.resendBtn, resendTimer > 0 && styles.resendBtnDisabled]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Debug OTP hint */}
          {debug_otp ? (
            <View style={styles.debugBanner}>
              <Ionicons name="bug-outline" size={14} color="#666" />
              <Text style={styles.debugText}>Dev mode: OTP is {debug_otp}</Text>
            </View>
          ) : null}

          <View style={{ height: 32 }} />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const BANNER_H = Math.round(Dimensions.get('window').height * 0.36);

const styles = StyleSheet.create({
  // WHITE root — no black bar at bottom
  root: { flex: 1, backgroundColor: '#fff' },

  /* Image banner — clip so chicken head pinned to top */
  imgBanner:      { height: BANNER_H, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage:      { position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: BANNER_H * 1.5 },
  imgOverlayTop:  { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(0,0,0,0.18)' },
  imgOverlayBottom:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(10,30,10,0.72)' },
  backBtn:        { position: 'absolute', top: 46, left: 16, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, zIndex: 10 },
  bannerContent:  { paddingHorizontal: 22, paddingBottom: 18 },
  phoneBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  phoneBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bannerTitle:    { fontSize: 26, fontWeight: '900', color: '#fff', lineHeight: 32, marginBottom: 5, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  bannerSub:      { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  /* Main content card */
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
    flex: 1,
  },

  otpRow:          { flexDirection: 'row', gap: 10, marginBottom: 16 },
  shake:           { transform: [{ translateX: 10 }] },
  otpBox:          { width: 46, height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 14, fontSize: 24, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', backgroundColor: '#fafafa' },
  otpBoxFilled:    { borderColor: COLORS.primary, backgroundColor: '#f0f7f0', color: COLORS.primary },
  otpBoxActive:    { borderColor: COLORS.primary, backgroundColor: '#fff' },
  otpBoxError:     { borderColor: COLORS.danger, backgroundColor: '#fff8f8' },

  progressRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot:             { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' },
  dotFilled:       { backgroundColor: COLORS.primary },

  errorBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdecea', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, gap: 8 },
  errorText:       { fontSize: 13, color: COLORS.danger, flex: 1 },

  btn:             { width: '100%', flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  btnDisabled:     { backgroundColor: '#b0c8b0', shadowOpacity: 0, elevation: 0 },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: '800' },

  resendRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  resendLabel:     { fontSize: 14, color: '#888' },
  resendBtn:       { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
  resendBtnDisabled: { color: '#bbb' },

  debugBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffde7', borderRadius: 10, padding: 10, marginTop: 20, gap: 6 },
  debugText:       { fontSize: 12, color: '#666' },
});
