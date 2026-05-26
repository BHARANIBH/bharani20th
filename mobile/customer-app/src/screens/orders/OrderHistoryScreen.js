import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../../config';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLOR = {
  pending:          COLORS.secondary,
  confirmed:        COLORS.primary,
  processing:       '#ff9800',
  out_for_delivery: '#2196f3',
  delivered:        COLORS.success,
  cancelled:        COLORS.danger,
};

export default function OrderHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderAPI.getMyOrders(user?.phone);
      setOrders(res.orders || res || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [user?.phone]);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const renderOrder = ({ item }) => {
    const statusColor = STATUS_COLOR[item.orderStatus] || COLORS.textLight;
    const date        = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{String(item._id).slice(-8).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.orderStatus?.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          {(item.items || []).slice(0, 2).map((i, idx) => (
            <Text key={idx} style={styles.itemLine}>{i.name} × {i.qty}</Text>
          ))}
          {(item.items || []).length > 2 && (
            <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.dateText}> {date}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.totalText}>₹{item.total}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item._id)}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[COLORS.primary]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 64 }}>📋</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>Your order history will appear here</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.shopBtnText}>Order Now</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.background },
  header:       { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: COLORS.text },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId:      { fontSize: 14, fontWeight: '800', color: COLORS.text },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText:   { fontSize: 11, color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  itemsList:    { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginBottom: 10 },
  itemLine:     { fontSize: 13, color: COLORS.textLight, marginBottom: 3 },
  moreItems:    { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft:   { flexDirection: 'row', alignItems: 'center' },
  dateText:     { fontSize: 12, color: COLORS.textMuted },
  footerRight:  { flexDirection: 'row', alignItems: 'center' },
  totalText:    { fontSize: 15, fontWeight: '800', color: COLORS.primary, marginRight: 4 },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 16 },
  emptySub:     { fontSize: 14, color: COLORS.textLight, marginTop: 6, marginBottom: 24 },
  shopBtn:      { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14 },
  shopBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
