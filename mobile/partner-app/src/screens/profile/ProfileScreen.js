import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { partner, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(partner?.restaurantName || 'P')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{partner?.name || 'Partner'}</Text>
          <Text style={styles.restaurant}>{partner?.restaurantName || ''}</Text>
          <Text style={styles.phone}>+91 {partner?.phone}</Text>
        </View>

        <View style={styles.card}>
          {[
            { icon: 'call-outline',             label: 'Support',  action: () => Alert.alert('Support', '+91 98765 43210') },
            { icon: 'document-text-outline',    label: 'Terms',    action: () => {} },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.row} onPress={item.action}>
              <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.border} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: COLORS.background },
  header:        { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: COLORS.text },
  avatarSection: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 28 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:    { fontSize: 32, fontWeight: '800', color: '#fff' },
  name:          { fontSize: 20, fontWeight: '800', color: COLORS.text },
  restaurant:    { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  phone:         { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  card:          { backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 16, overflow: 'hidden' },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel:      { fontSize: 14, fontWeight: '600', color: COLORS.text, marginLeft: 14 },
  logoutBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 12, paddingVertical: 14 },
  logoutText:    { fontSize: 15, fontWeight: '700', color: COLORS.danger, marginLeft: 8 },
});
