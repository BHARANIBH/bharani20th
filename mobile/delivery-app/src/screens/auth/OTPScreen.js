import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { deliveryAuthAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function OTPScreen({ route, navigation }) {
  const { phone, name, vehicle, debug_otp } = route.params;
  const { login }                            = useAuth();
  const [otp, setOtp]                        = useState(debug_otp || '');
  const [loading, setLoading]                = useState(false);
  const [resendTimer, setTimer]              = useState(30);
  const inputRef                             = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) return Alert.alert('Error', 'Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await deliveryAuthAPI.verifyOTP(phone, otp, name, vehicle);
      if (res.success) {
        const agentData = { ...res.agent, name: name || res.agent?.name, vehicleType: vehicle };
        await login(res.token, agentData);
      } else {
        Alert.alert('Invalid OTP', res.message || 'Verification failed');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📱</Text>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.sub}>Sent to <Text style={{ fontWeight: '700', color: COLORS.primary }}>+91 {phone}</Text></Text>

          <View style={{ width: '100%', marginBottom: 24 }}>
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

          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => resendTimer === 0 && deliveryAuthAPI.sendOTP(phone).then(() => setTimer(30)).catch(() => {})} style={{ padding: 12 }}>
            <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '600' }}>
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
  title:     { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sub:       { fontSize: 14, color: '#666', marginBottom: 32 },
  otpInput:  { width: '100%', height: 64, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 16, fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: 16, paddingHorizontal: 16 },
  btn:       { width: '100%', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
});
