import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { partnerAuthAPI } from '../../services/api';

export default function LoginScreen({ navigation }) {
  const [name, setName]               = useState('');
  const [restaurant, setRestaurant]   = useState('');
  const [phone, setPhone]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSendOTP = async () => {
    if (!name.trim())       return Alert.alert('Error', 'Please enter your name');
    if (!restaurant.trim()) return Alert.alert('Error', 'Please enter restaurant name');
    if (phone.length !== 10) return Alert.alert('Error', 'Enter a valid 10-digit number');
    setLoading(true);
    try {
      const res = await partnerAuthAPI.sendOTP(phone);
      if (res.success) {
        navigation.navigate('OTP', { phone, name, restaurant, debug_otp: res.debug_otp });
      } else {
        Alert.alert('Error', res.message || 'Failed to send OTP');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🏪</Text>
            </View>
            <Text style={styles.appName}>GoNaatu Partner</Text>
            <Text style={styles.tagline}>Manage your chicken shop orders</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Partner Login</Text>
            <Text style={styles.cardSub}>Register or login to your partner account</Text>

            <Text style={styles.label}>Your Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>Restaurant / Shop Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="storefront-outline" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Krishna Naatu Chicken"
                placeholderTextColor={COLORS.textLight}
                value={restaurant}
                onChangeText={setRestaurant}
              />
            </View>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <View style={styles.cc}><Text style={styles.ccText}>+91</Text></View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.textLight}
                value={phone}
                onChangeText={t => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Get OTP</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.primary },
  container:  { flexGrow: 1, paddingBottom: 30 },
  hero:       { alignItems: 'center', paddingVertical: 36 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoEmoji:  { fontSize: 38 },
  appName:    { fontSize: 26, fontWeight: '800', color: '#fff' },
  tagline:    { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card:       { backgroundColor: '#fff', borderRadius: 24, margin: 16, padding: 22, elevation: 8 },
  cardTitle:  { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardSub:    { fontSize: 13, color: COLORS.textLight, marginBottom: 20 },
  label:      { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fafafa', marginBottom: 4 },
  input:      { flex: 1, height: 50, fontSize: 15, color: COLORS.text },
  cc:         { paddingRight: 10, borderRightWidth: 1, borderRightColor: COLORS.border, marginRight: 10 },
  ccText:     { fontSize: 15, fontWeight: '600', color: COLORS.text },
  btn:        { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
