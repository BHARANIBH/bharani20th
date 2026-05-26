import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const MenuItem = ({ icon, label, sub, onPress, danger }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, danger && { backgroundColor: '#fdecea' }]}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.primary} />
    </View>
    <View style={styles.menuBody}>
      <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      {sub ? <Text style={styles.menuSub}>{sub}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing]        = useState(false);
  const [name, setName]              = useState(user?.name || '');
  const [saving, setSaving]          = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: name.trim() });
      await updateUser({ ...user, name: name.trim() });
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                autoFocus
                placeholder="Your name"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="checkmark" size={20} color="#fff" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditing(false); setName(user?.name || ''); }} style={styles.cancelIconBtn}>
                <Ionicons name="close" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <TouchableOpacity onPress={() => setEditing(true)} style={{ marginLeft: 8 }}>
                <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.userPhone}>+91 {user?.phone}</Text>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="bag-outline"
            label="My Orders"
            sub="View your order history"
            onPress={() => navigation.navigate('Orders')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="location-outline"
            label="Saved Addresses"
            sub="Manage delivery addresses"
            onPress={() => navigation.navigate('AddressList')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            sub="Order updates & offers"
            onPress={() => Alert.alert('Coming soon', 'Notification settings')}
          />
        </View>

        <View style={styles.menuCard}>
          <MenuItem
            icon="information-circle-outline"
            label="About GoNaatu"
            sub="Our story, why country chicken & more"
            onPress={() => navigation.navigate('About')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            sub="Call us: +91 98765 43210"
            onPress={() => Alert.alert('Support', 'Call us: +91 98765 43210')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Privacy"
            onPress={() => Alert.alert('Terms', 'Please visit our website for T&C')}
          />
        </View>

        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={handleLogout}
          />
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>GoNaatu - Pure Desi Country Chicken</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.background },
  header:         { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:    { fontSize: 20, fontWeight: '800', color: COLORS.text },
  scroll:         { paddingBottom: 40 },
  avatarSection:  { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar:         { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText:     { fontSize: 32, fontWeight: '800', color: '#fff' },
  nameRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  userName:       { fontSize: 20, fontWeight: '800', color: COLORS.text },
  userPhone:      { fontSize: 14, color: COLORS.textLight },
  editRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 24 },
  nameInput:      { flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, color: COLORS.text },
  saveBtn:        { backgroundColor: COLORS.primary, borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  cancelIconBtn:  { padding: 8 },
  menuCard:       { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginTop: 12, overflow: 'hidden' },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuIcon:       { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f0f7f0', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuBody:       { flex: 1 },
  menuLabel:      { fontSize: 14, fontWeight: '700', color: COLORS.text },
  menuSub:        { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  divider:        { height: 1, backgroundColor: COLORS.border, marginLeft: 68 },
  appInfo:        { alignItems: 'center', paddingVertical: 24 },
  appInfoText:    { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  appVersion:     { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
});
