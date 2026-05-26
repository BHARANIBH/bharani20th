import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Switch, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { COLORS } from '../../../config';
import { deliveryOrderAPI } from '../../services/api';
import { joinDeliveryRoom, getSocket, sendAgentLocation } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { agent, logout }                  = useAuth();
  const [available, setAvailable]          = useState(true);
  const [availLoading, setAvailLoading]    = useState(false);
  const [myOrder, setMyOrder]              = useState(null);
  const [availOrders, setAvailOrders]      = useState([]);
  const [loading, setLoading]              = useState(true);
  const [refreshing, setRefreshing]        = useState(false);
  const [updatingId, setUpdatingId]        = useState(null);
  const locationInterval                   = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [myRes, avRes] = await Promise.all([
        deliveryOrderAPI.getMyOrder().catch(() => ({})),
        deliveryOrderAPI.getAvailable().catch(() => []),
      ]);
      setMyOrder(myRes.order || null);
      setAvailOrders(avRes.orders || avRes || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  useEffect(() => {
    joinDeliveryRoom();
    const socket = getSocket();
    socket.on('order:updated', fetchData);
    return () => {
      socket.off('order:updated', fetchData);
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, []);

  useEffect(() => {
    if (myOrder && myOrder.orderStatus === 'out_for_delivery') {
      startLocationTracking();
    } else {
      if (locationInterval.current) { clearInterval(locationInterval.current); locationInterval.current = null; }
    }
  }, [myOrder]);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    if (locationInterval.current) clearInterval(locationInterval.current);
    locationInterval.current = setInterval(async () => {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (myOrder?._id) {
        sendAgentLocation(myOrder._id, loc.coords.latitude, loc.coords.longitude);
      }
    }, 10000);
  };

  const toggleAvailability = async (val) => {
    setAvailLoading(true);
    try {
      await deliveryOrderAPI.setAvailability(val);
      setAvailable(val);
    } catch {
      Alert.alert('Error', 'Failed to update availability');
    } finally {
      setAvailLoading(false);
    }
  };

  const handlePickup = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await deliveryOrderAPI.updateStatus(orderId, 'out_for_delivery');
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliver = async (orderId) => {
    Alert.alert('Confirm Delivery', 'Mark this order as delivered?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delivered', onPress: async () => {
          setUpdatingId(orderId);
          try {
            await deliveryOrderAPI.updateStatus(orderId, 'delivered');
            setMyOrder(null);
            fetchData();
          } catch (e) {
            Alert.alert('Error', e.message || 'Failed');
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  };

  const openMaps = (address) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {});
  };

  const renderAvailOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{String(item._id).slice(-6).toUpperCase()}</Text>
        <Text style={styles.orderTotal}>₹{item.total}</Text>
      </View>
      {(item.items || []).map((i, idx) => (
        <Text key={idx} style={styles.itemLine}>{i.name} × {i.qty}</Text>
      ))}
      <View style={styles.addrRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.addrText} numberOfLines={1}>{item.deliveryAddress}</Text>
      </View>
      <TouchableOpacity
        style={styles.pickupBtn}
        onPress={() => handlePickup(item._id)}
        disabled={updatingId === item._id}
      >
        {updatingId === item._id
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.pickupBtnText}>Accept & Pickup</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{agent?.name || 'Agent'}</Text>
          <Text style={styles.headerSub}>{agent?.vehicleType || 'Delivery Partner'}</Text>
        </View>
        <View style={styles.availRow}>
          <Text style={styles.availLabel}>{available ? 'Online' : 'Offline'}</Text>
          {availLoading
            ? <ActivityIndicator size="small" color={COLORS.secondary} />
            : <Switch value={available} onValueChange={toggleAvailability} trackColor={{ true: COLORS.success, false: COLORS.border }} thumbColor="#fff" />}
        </View>
      </View>

      <FlatList
        data={availOrders}
        keyExtractor={item => String(item._id)}
        renderItem={renderAvailOrder}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.primary]} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        ListHeaderComponent={
          <>
            {/* Active delivery */}
            {myOrder && (
              <View style={styles.activeCard}>
                <View style={styles.activeHeader}>
                  <Text style={styles.activeTitle}>Active Delivery</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>IN PROGRESS</Text>
                  </View>
                </View>
                <Text style={styles.activeOrderId}>Order #{String(myOrder._id).slice(-6).toUpperCase()}</Text>
                {(myOrder.items || []).map((i, idx) => (
                  <Text key={idx} style={styles.itemLine}>{i.name} × {i.qty}</Text>
                ))}
                <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(myOrder.deliveryAddress || '')}>
                  <Ionicons name="navigate-outline" size={16} color="#fff" />
                  <Text style={styles.mapsBtnText}>Open in Maps</Text>
                </TouchableOpacity>
                <View style={styles.addrRow}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={[styles.addrText, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>{myOrder.deliveryAddress}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deliverBtn}
                  onPress={() => handleDeliver(myOrder._id)}
                  disabled={updatingId === myOrder._id}
                >
                  {updatingId === myOrder._id
                    ? <ActivityIndicator color={COLORS.primary} size="small" />
                    : <><Ionicons name="checkmark-circle" size={18} color={COLORS.primary} /><Text style={styles.deliverBtnText}>Mark as Delivered</Text></>}
                </TouchableOpacity>
              </View>
            )}

            {!myOrder && (
              <View style={styles.statusCard}>
                <Text style={styles.statusIcon}>{available ? '🟢' : '🔴'}</Text>
                <Text style={styles.statusText}>{available ? 'You are Online — Ready for orders' : 'You are Offline'}</Text>
              </View>
            )}

            {availOrders.length > 0 && <Text style={styles.sectionTitle}>Available Orders ({availOrders.length})</Text>}
          </>
        }
        ListEmptyComponent={
          !loading && !myOrder ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>📭</Text>
              <Text style={styles.emptyText}>No orders available</Text>
              <Text style={styles.emptySub}>Stay online to receive delivery requests</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.background },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:     { fontSize: 18, fontWeight: '800', color: COLORS.text },
  headerSub:       { fontSize: 12, color: COLORS.textLight },
  availRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availLabel:      { fontSize: 13, fontWeight: '700', color: COLORS.text },
  activeCard:      { backgroundColor: COLORS.primary, borderRadius: 18, padding: 16, marginVertical: 12 },
  activeHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  activeTitle:     { fontSize: 16, fontWeight: '800', color: '#fff' },
  activeBadge:     { backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: '#000' },
  activeOrderId:   { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  mapsBtn:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start', marginVertical: 8 },
  mapsBtnText:     { color: '#fff', fontWeight: '700', marginLeft: 6 },
  deliverBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, marginTop: 12 },
  deliverBtnText:  { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginLeft: 6 },
  statusCard:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginVertical: 12 },
  statusIcon:      { fontSize: 20, marginRight: 10 },
  statusText:      { fontSize: 14, fontWeight: '600', color: COLORS.text },
  sectionTitle:    { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  orderCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  orderHeader:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId:         { fontSize: 14, fontWeight: '800', color: COLORS.text },
  orderTotal:      { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  itemLine:        { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  addrRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  addrText:        { fontSize: 12, color: COLORS.textMuted, flex: 1, marginLeft: 4 },
  pickupBtn:       { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  pickupBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty:           { alignItems: 'center', paddingTop: 40 },
  emptyText:       { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 14 },
  emptySub:        { fontSize: 13, color: COLORS.textLight, marginTop: 6, textAlign: 'center' },
});
