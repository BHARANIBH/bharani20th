import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useAddress } from '../../context/AddressContext';
import { addressAPI } from '../../services/api';

const SLOTS = ['9AM - 11AM', '11AM - 1PM', '2PM - 4PM', '4PM - 6PM', '6PM - 8PM'];

export default function CheckoutScreen({ navigation }) {
  const { items, total }                        = useCart();
  const { user, token }                         = useAuth();
  const { selectedAddress, setSelectedAddress } = useAddress();

  const [addresses, setAddresses]   = useState([]);
  const [selAddr, setSelAddr]       = useState(selectedAddress || null);
  const [slot, setSlot]             = useState(SLOTS[0]);
  const [notes, setNotes]           = useState('');
  const [addrError, setAddrError]   = useState(false);

  const deliveryFee = total >= 500 ? 0 : 40;
  const grandTotal  = total + deliveryFee;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      Alert.alert(
        '🔒 Login Required',
        'Please login to proceed to checkout.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
          { text: 'Login Now', onPress: () => navigation.navigate('Login') },
        ]
      );
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    addressAPI.getAll().then(res => {
      const list = res.addresses || res || [];
      setAddresses(list);
      // Pre-select first address only if none selected globally
      if (!selectedAddress && list.length > 0) setSelAddr(list[0]);
    }).catch(() => {});
  }, [token]);

  const handlePlaceOrder = () => {
    if (!selAddr) {
      setAddrError(true);
      Alert.alert('📍 Address Required', 'Please select or add a delivery address before placing your order.');
      return;
    }
    setAddrError(false);
    // Navigate to Payment screen with order details
    navigation.navigate('Payment', {
      grandTotal,
      selAddr,
      slot,
      notes,
      deliveryCharge: deliveryFee,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary ({items.length} items)</Text>
          {items.map(item => (
            <View key={String(item.id || item._id)} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name} × {item.qty}</Text>
              <Text style={styles.orderItemPrice}>₹{item.price * item.qty}</Text>
            </View>
          ))}
        </View>

        {/* Address required banner */}
        {addrError && (
          <View style={styles.addrErrorBanner}>
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text style={styles.addrErrorText}>Please add a delivery address to continue</Text>
          </View>
        )}

        {/* Delivery Address */}
        <View style={[styles.section, addrError && styles.sectionError]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddressList', {
                pickMode: true,
                onSelect: (addr) => { setSelAddr(addr); setSelectedAddress(addr); setAddrError(false); },
              })}
            >
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>

          {selAddr ? (
            <View style={styles.addrCardActive}>
              <View style={styles.addrIconWrap}>
                <Ionicons name={selAddr.label === 'Work' ? 'briefcase' : selAddr.label === 'Other' ? 'location' : 'home'} size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.addrLabel}>{selAddr.label || 'Address'}</Text>
                {selAddr.flatNo ? <Text style={styles.addrFlat}>{selAddr.flatNo}</Text> : null}
                <Text style={styles.addrText}>{selAddr.address}</Text>
                {selAddr.landmark ? <Text style={styles.addrLandmark}>Near: {selAddr.landmark}</Text> : null}
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddrBtn}
              onPress={() => navigation.navigate('AddressList', {
                pickMode: true,
                onSelect: (addr) => { setSelAddr(addr); setSelectedAddress(addr); setAddrError(false); },
              })}
            >
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.addAddrTitle}>Add Delivery Address</Text>
                <Text style={styles.addAddrSub}>Search area, use GPS location</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Delivery Slot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Time Slot</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 4 }}>
            {SLOTS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.slotChip, slot === s && styles.slotChipActive]}
                onPress={() => setSlot(s)}
              >
                <Text style={[styles.slotText, slot === s && styles.slotTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="e.g. Clean nicely, cut small pieces..."
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>



        {/* Bill */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Total</Text>
            <Text style={styles.billValue}>₹{total}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: COLORS.success }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 8, paddingTop: 8 }]}>
            <Text style={[styles.billLabel, { fontWeight: '800', color: COLORS.text }]}>Grand Total</Text>
            <Text style={[styles.billValue, { fontWeight: '800', fontSize: 18, color: COLORS.primary }]}>₹{grandTotal}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder}>
          <Text style={styles.placeBtnText}>Continue to Payment · ₹{grandTotal}</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:         { padding: 4 },
  headerTitle:     { fontSize: 18, fontWeight: '800', color: COLORS.text },
  scroll:          { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 100 },
  section:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionTitle:    { fontSize: 15, fontWeight: '800', color: COLORS.text },
  orderItem:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderItemName:   { fontSize: 13, color: COLORS.textLight, flex: 1 },
  orderItemPrice:  { fontSize: 13, fontWeight: '700', color: COLORS.text },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  changeLink:      { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  addrCardActive:  { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: '#f0f7f0' },
  addrIconWrap:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  addrLabel:       { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  addrFlat:        { fontSize: 13, color: '#333', fontWeight: '600' },
  addrText:        { fontSize: 12, color: COLORS.textLight, lineHeight: 18 },
  addrLandmark:    { fontSize: 11, color: '#999', marginTop: 2 },
  addAddrBtn:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  addAddrTitle:    { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  addAddrSub:      { fontSize: 12, color: '#999', marginTop: 2 },
  slotChip:        { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8 },
  slotChipActive:  { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  slotText:        { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  slotTextActive:  { color: '#fff' },
  notesInput:      { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.text, textAlignVertical: 'top' },
  billCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  billTitle:       { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  billRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel:       { fontSize: 14, color: COLORS.textLight },
  billValue:       { fontSize: 14, fontWeight: '600', color: COLORS.text },
  footer:          { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  placeBtn:        { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  placeBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Validation styles
  addrErrorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e74c3c', borderRadius: 12, marginHorizontal: 0, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12 },
  addrErrorText:   { fontSize: 13, color: '#fff', fontWeight: '700', flex: 1 },
  sectionError:    { borderWidth: 2, borderColor: '#e74c3c' },
});
