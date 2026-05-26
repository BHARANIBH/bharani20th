import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../config';
import { partnerOrderAPI } from '../../services/api';
import { joinPartnerRoom, getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing'];

const STATUS_ACTIONS = {
  pending:    { label: 'Confirm Order',    next: 'confirmed',        color: COLORS.primary },
  confirmed:  { label: 'Start Preparing',  next: 'processing',       color: '#ff9800' },
  processing: { label: 'Ready for Pickup', next: 'out_for_delivery', color: '#2196f3' },
};

export default function DashboardScreen({ navigation }) {
  const { partner } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [stats, setStats]         = useState({ totalOrders: 0, todayOrders: 0, pendingOrders: 0 });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]   = useState(null);
  const socketRef                 = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [ordRes, statRes] = await Promise.all([partnerOrderAPI.getOrders(), partnerOrderAPI.getStats()]);
      const all = ordRes.orders || ordRes || [];
      setOrders(all.filter(o => ACTIVE_STATUSES.includes(o.orderStatus)));
      setStats(statRes.stats || statRes || {});
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  useEffect(() => {
    joinPartnerRoom();
    const socket = getSocket();
    socketRef.current = socket;
    socket.on('order:new', order => {
      setOrders(prev => [order, ...prev]);
    });
    socket.on('order:updated', ({ orderId, orderStatus }) => {
      setOrders(prev => {
        const updated = prev.map(o => o._id === orderId ? { ...o, orderStatus } : o);
        return updated.filter(o => ACTIVE_STATUSES.includes(o.orderStatus));
      });
    });
    return () => {
      socket.off('order:new');
      socket.off('order:updated');
    };
  }, []);

  const handleAction = async (orderId, nextStatus) => {
    setUpdating(orderId);
    try {
      await partnerOrderAPI.updateStatus(orderId, nextStatus);
      setOrders(prev => {
        const updated = prev.map(o => o._id === orderId ? { ...o, orderStatus: nextStatus } : o);
        return updated.filter(o => ACTIVE_STATUSES.includes(o.orderStatus));
      });
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const renderOrder = ({ item }) => {
    const action = STATUS_ACTIONS[item.orderStatus];
    const time   = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{String(item._id).slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderTime}>{time}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: action?.color || COLORS.textLight }]}>
            <Text style={styles.statusText}>{item.orderStatus?.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {(item.items || []).map((i, idx) => (
          <Text key={idx} style={styles.itemLine}>• {i.name} × {i.qty}</Text>
        ))}

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.addrText} numberOfLines={1}>{item.deliveryAddress || ''}</Text>
            {item.deliverySlot && <Text style={styles.slotText}>Slot: {item.deliverySlot}</Text>}
          </View>
          <Text style={styles.totalText}>₹{item.total}</Text>
        </View>

        {action && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: action.color }]}
            onPress={() => handleAction(item._id, action.next)}
            disabled={updating === item._id}
          >
            {updating === item._id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.actionBtnText}>{action.label}</Text>}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{partner?.restaurantName || 'My Shop'}</Text>
          <Text style={styles.headerSub}>Partner Dashboard</Text>
        </View>
        <TouchableOpacity onPress={fetchData}>
          <Ionicons name="refresh-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Today', value: stats.todayOrders || 0, icon: 'calendar-outline' },
          { label: 'Pending', value: stats.pendingOrders || orders.length, icon: 'time-outline', highlight: true },
          { label: 'Total', value: stats.totalOrders || 0, icon: 'bag-outline' },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, s.highlight && styles.statCardHighlight]}>
            <Ionicons name={s.icon} size={20} color={s.highlight ? '#fff' : COLORS.primary} />
            <Text style={[styles.statVal, s.highlight && { color: '#fff' }]}>{s.value}</Text>
            <Text style={[styles.statLabel, s.highlight && { color: 'rgba(255,255,255,0.8)' }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Active Orders</Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item._id)}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 56 }}>📭</Text>
              <Text style={styles.emptyText}>No active orders</Text>
              <Text style={styles.emptySub}>New orders will appear here in real-time</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.background },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:      { fontSize: 18, fontWeight: '800', color: COLORS.text },
  headerSub:        { fontSize: 12, color: COLORS.textLight },
  statsRow:         { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  statCard:         { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statCardHighlight:{ backgroundColor: COLORS.primary },
  statVal:          { fontSize: 22, fontWeight: '800', color: COLORS.text, marginVertical: 2 },
  statLabel:        { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  sectionTitle:     { fontSize: 16, fontWeight: '800', color: COLORS.text, paddingHorizontal: 16, marginBottom: 8 },
  orderCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  orderHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId:          { fontSize: 15, fontWeight: '800', color: COLORS.text },
  orderTime:        { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText:       { fontSize: 11, color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  itemLine:         { fontSize: 13, color: COLORS.text, marginBottom: 3 },
  orderFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  addrText:         { fontSize: 12, color: COLORS.textLight, maxWidth: 200 },
  slotText:         { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  totalText:        { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  actionBtn:        { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  actionBtnText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 14 },
  emptySub:         { fontSize: 13, color: COLORS.textLight, marginTop: 6, textAlign: 'center' },
});
