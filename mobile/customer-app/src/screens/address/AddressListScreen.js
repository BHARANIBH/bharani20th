import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { addressAPI } from '../../services/api';
import { useAddress } from '../../context/AddressContext';
import * as Location from 'expo-location';

const LABEL_ICONS = { Home: 'home', Work: 'briefcase', Other: 'location' };

export default function AddressListScreen({ navigation, route }) {
  const { selectedAddress, setSelectedAddress } = useAddress();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [locLoading, setLocLoading] = useState(false);

  // called from CheckoutScreen / HomeScreen to pick address
  const pickMode = route?.params?.pickMode || false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await addressAPI.getAll();
      const list = res.addresses || res || [];
      setAddresses(list);
    } catch { setAddresses([]); }
    finally  { setLoading(false); }
  }, []);

  // Only use focus listener — fires on mount AND when coming back
  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  /* ── Use Current Location ── */
  const useCurrentLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable location in settings to use this feature.');
        return;
      }
      const loc  = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const address = [
        geo.name,
        geo.street,
        geo.district || geo.subregion,
        geo.city,
        geo.region,
        geo.postalCode,
      ].filter(Boolean).join(', ');

      navigation.navigate('AddAddress', {
        prefill: {
          address,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          name:    geo.name || '',
          street:  geo.street || '',
          city:    geo.city || '',
          pincode: geo.postalCode || '',
        },
        pickMode,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not fetch location. Please try again.');
    } finally {
      setLocLoading(false);
    }
  };

  /* ── Delete one ── */
  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await addressAPI.remove(id);
            setAddresses(prev => prev.filter(a => String(a._id) !== String(id)));
          } catch { Alert.alert('Error', 'Could not delete address'); }
        },
      },
    ]);
  };

  /* ── Delete ALL ── */
  const handleDeleteAll = () => {
    if (addresses.length === 0) return;
    Alert.alert('Delete All', 'Remove all saved addresses?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive',
        onPress: async () => {
          try {
            await addressAPI.removeAll();
            setAddresses([]);
            setSelectedAddress(null);
          } catch { Alert.alert('Error', 'Could not delete addresses'); }
        },
      },
    ]);
  };

  /* ── Select address ── */
  const handleSelect = (addr) => {
    // Always update global context
    setSelectedAddress(addr);
    // Also call optional callback (from Checkout)
    if (route?.params?.onSelect) route.params.onSelect(addr);
    navigation.goBack();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.addrCard, selectedAddress?._id === item._id && styles.addrCardSelected]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.addrIconWrap}>
        <Ionicons name={LABEL_ICONS[item.label] || 'location'} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.addrBody}>
        <Text style={styles.addrLabel}>{item.label || 'Address'}</Text>
        {item.flatNo ? <Text style={styles.addrFlat}>{item.flatNo}</Text> : null}
        <Text style={styles.addrText} numberOfLines={2}>{item.address}</Text>
        {item.landmark ? <Text style={styles.addrLandmark}>Near: {item.landmark}</Text> : null}
      </View>
      <View style={styles.addrActions}>
        {selectedAddress?._id === item._id && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
        )}
        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        {addresses.length > 0 ? (
          <TouchableOpacity onPress={handleDeleteAll} style={styles.deleteAllBtn}>
            <Text style={styles.deleteAllText}>Clear All</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      {/* Use current location */}
      <TouchableOpacity style={styles.gpsBtn} onPress={useCurrentLocation} disabled={locLoading}>
        {locLoading
          ? <ActivityIndicator size={18} color={COLORS.primary} />
          : <Ionicons name="navigate-circle-outline" size={22} color={COLORS.primary} />
        }
        <View style={styles.gpsBtnText}>
          <Text style={styles.gpsTitle}>Use current location</Text>
          <Text style={styles.gpsSub}>GPS — detect my location</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </TouchableOpacity>

      {/* Search for address */}
      <TouchableOpacity
        style={styles.searchBtn}
        onPress={() => navigation.navigate('AddAddress', { pickMode })}
      >
        <Ionicons name="search-outline" size={18} color="#666" />
        <Text style={styles.searchBtnText}>Search for area, street name…</Text>
      </TouchableOpacity>

      {/* Saved list */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          {addresses.length > 0 && (
            <Text style={styles.savedTitle}>Saved Addresses</Text>
          )}
          <FlatList
            data={addresses}
            keyExtractor={(item, i) => String(item._id || item.id || i)}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="location-outline" size={60} color="#ccc" />
                <Text style={styles.emptyTitle}>No saved addresses</Text>
                <Text style={styles.emptySub}>Add an address for faster checkout</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        </>
      )}

      {/* Add new address button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAddress', { pickMode })}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn:       { padding: 4 },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  deleteAllBtn:  { paddingHorizontal: 8, paddingVertical: 4 },
  deleteAllText: { fontSize: 13, color: COLORS.danger, fontWeight: '700' },

  gpsBtn:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 14, padding: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  gpsBtnText:    { flex: 1 },
  gpsTitle:      { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  gpsSub:        { fontSize: 12, color: '#999', marginTop: 2 },

  searchBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: '#eee' },
  searchBtnText: { flex: 1, fontSize: 14, color: '#999' },

  savedTitle:    { fontSize: 13, fontWeight: '700', color: '#999', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  addrCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 10, borderRadius: 14, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1.5, borderColor: 'transparent' },
  addrCardSelected: { borderColor: COLORS.primary, backgroundColor: '#f0f7f0' },
  addrActions:   { flexDirection: 'row', alignItems: 'center' },
  addrIconWrap:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f0f7f0', alignItems: 'center', justifyContent: 'center' },
  addrBody:      { flex: 1 },
  addrLabel:     { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 2 },
  addrFlat:      { fontSize: 13, color: '#333', fontWeight: '600' },
  addrText:      { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 18 },
  addrLandmark:  { fontSize: 11, color: '#999', marginTop: 3 },
  deleteBtn:     { padding: 4 },

  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 16 },
  emptySub:      { fontSize: 13, color: '#999', marginTop: 6 },

  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  addBtn:        { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15 },
  addBtnText:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});
