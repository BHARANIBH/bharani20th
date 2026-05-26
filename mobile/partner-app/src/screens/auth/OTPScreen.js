import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { partnerAuthAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function OTPScreen({ route, navigation }) {
  const { phone, name, restaurant, debug_otp } = route.params;
  const { login }                              = useAuth();
  const [otp, setOtp]                          = useState(debug_otp || '');
  const [loading, setLoading]                  = useState(false);
  const [resendTimer, setTimer]                = useState(30);
  const inputRef                               = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) return Alert.alert('Error', 'Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await partnerAuthAPI.verifyOTP(phone, otp, name, restaurant);
      if (res.success) {
        const partnerData = { ...res.partner, name: name || res.partner?.name, restaurantName: restaurant || res.partner?.restaurantName };
        await login(res.token, partnerData);
      } else {
        Alert.alert('Invalid OTP', res.message || 'Verification failed');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await partnerAuthAPI.sendOTP(phone);
      setTimer(30);
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.icon}><Text style={{ fontSize: 48 }}>📱</Text></View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.sub}>Sent to <Text style={{ fontWeight: '700', color: COLORS.primary }}>+91 {phone}</Text></Text>

          <View style={styles.otpBox}>
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              value={otp}
              onChangeText={t => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="------"
              placeholderTextColor={COLORS.border}
              textAlign="center"
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleResend} style={styles.resendRow}>
            <Text style={styles.resendText}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  backBtn:   { position: 'absolute', top: 16, left: 16, padding: 8 },
  icon:      { marginBottom: 20 },
  title:     { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sub:       { fontSize: 14, color: COLORS.textLight, marginBottom: 32 },
  otpBox:    { width: '100%', marginBottom: 24 },
  otpInput:  { width: '100%', height: 64, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 16, fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: 16, paddingHorizontal: 16 },
  btn:       { width: '100%', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendRow: { padding: 8 },
  resendText:{ fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
