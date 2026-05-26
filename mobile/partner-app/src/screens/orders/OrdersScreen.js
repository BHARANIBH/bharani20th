import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { partnerOrderAPI } from '../../services/api';
import { getSocket, joinPartnerRoom } from '../../services/socket';

const FILTERS = ['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'];

const STATUS_COLOR = {
  pending:          COLORS.secondary,
  confirmed:        COLORS.primary,
  processing:       '#ff9800',
  out_for_delivery: '#2196f3',
  delivered:        COLORS.success,
  cancelled:        COLORS.danger,
};

/* ── Live Request Modal ──────────────────────────────────────────── */
function LiveRequestModal({ visible, request, onSend, onBusy, onDismiss }) {
  const [url, setUrl] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!url.trim() || !url.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please paste a valid YouTube Live URL starting with https://');
      return;
    }
    setSending(true);
    await onSend(request.orderId, url.trim());
    setUrl('');
    setSending(false);
  };

  const handleBusy = async () => {
    await onBusy(request.orderId);
    onDismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={lm.overlay}>
        <View style={lm.sheet}>
          {/* Header */}
          <View style={lm.header}>
            <View style={lm.liveIndicator}>
              <View style={lm.liveDot} />
              <Text style={lm.liveText}>LIVE REQUEST</Text>
            </View>
            <TouchableOpacity onPress={onDismiss}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={lm.infoBox}>
            <Text style={lm.infoTitle}>🎥 Customer wants to watch live!</Text>
            <Text style={lm.infoSub}>
              <Text style={{ fontWeight: '800' }}>{request?.customerName || 'Customer'}</Text>
              {' '}wants to see their chicken being cut fresh
            </Text>
            <Text style={lm.orderId}>Order: #{String(request?.orderId || '').slice(-7).toUpperCase()}</Text>
          </View>

          {/* Steps */}
          <View style={lm.stepsBox}>
            <Text style={lm.stepsTitle}>How to go live:</Text>
            {[
              '1. Open YouTube app on your phone',
              '2. Tap ➕ → Go Live',
              '3. Set title (e.g. "Fresh Chicken Cutting")',
              '4. Start stream, copy the URL',
              '5. Paste the URL below and send',
            ].map((s, i) => (
              <Text key={i} style={lm.stepText}>{s}</Text>
            ))}
          </View>

          {/* URL Input */}
          <Text style={lm.inputLabel}>Paste YouTube Live URL:</Text>
          <TextInput
            style={lm.input}
            placeholder="https://youtube.com/live/..."
            placeholderTextColor="#bbb"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Buttons */}
          <TouchableOpacity
            style={[lm.sendBtn, sending && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="logo-youtube" size={18} color="#fff" />
                  <Text style={lm.sendBtnText}>  Send to Customer</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity style={lm.busyBtn} onPress={handleBusy} activeOpacity={0.8}>
            <Ionicons name="time-outline" size={16} color="#f59e0b" />
            <Text style={lm.busyBtnText}>  I'm Busy — Notify Customer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ── Main Screen ─────────────────────────────────────────────────── */
export default function OrdersScreen({ navigation }) {
  const [orders,     setOrders]     = useState([]);
  const [filter,     setFilter]     = useState('All');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Live request state */
  const [liveModal,   setLiveModal]   = useState(false);
  const [liveRequest, setLiveRequest] = useState(null); // { orderId, customerName }

  const socketRef = useRef(null);

  /* ── Socket setup ── */
  useEffect(() => {
    joinPartnerRoom();
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('live:requested', (data) => {
      // data = { orderId, customerName }
      setLiveRequest(data);
      setLiveModal(true);
    });

    return () => {
      socket.off('live:requested');
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await partnerOrderAPI.getOrders();
      setOrders(res.orders || res || []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const filtered = filter === 'All'
    ? orders
    : orders.filter(o => o.orderStatus?.toLowerCase().includes(filter.toLowerCase()));

  /* ── Live handlers ── */
  const handleSendUrl = async (orderId, liveUrl) => {
    try {
      await partnerOrderAPI.sendLiveUrl(orderId, liveUrl);
      setLiveModal(false);
      setLiveRequest(null);
      Alert.alert('✅ Sent!', 'YouTube Live URL sent to customer successfully.');
    } catch {
      Alert.alert('Error', 'Failed to send URL. Please try again.');
    }
  };

  const handleBusy = async (orderId) => {
    try {
      await partnerOrderAPI.partnerBusy(orderId);
      setLiveModal(false);
      setLiveRequest(null);
    } catch {}
  };

  /* ── Order card renderer ── */
  const renderOrder = ({ item }) => {
    const color = STATUS_COLOR[item.orderStatus] || COLORS.textLight;
    const date  = item.createdAt
      ? new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '';
    const isProcessing = item.orderStatus === 'processing' || item.orderStatus === 'confirmed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{String(item.orderId || item._id).slice(-7).toUpperCase()}</Text>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{item.orderStatus?.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {/* Products */}
        {(item.products || item.items || []).map((p, idx) => (
          <Text key={idx} style={styles.itemLine}>
            {p.name} × {p.quantity || p.qty || 1}
          </Text>
        ))}

        <View style={styles.cardFooter}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.total}>₹{item.totalPrice || item.total}</Text>
        </View>

        {/* Live cutting button — shown for processing/confirmed orders */}
        {isProcessing && (
          <View style={styles.liveRow}>
            <View style={styles.liveHint}>
              <Ionicons name="videocam-outline" size={14} color="#e74c3c" />
              <Text style={styles.liveHintText}>Customer may request live cutting view</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Orders</Text>
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item._id)}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}

      {/* Live Request Modal */}
      <LiveRequestModal
        visible={liveModal}
        request={liveRequest}
        onSend={handleSendUrl}
        onBusy={handleBusy}
        onDismiss={() => { setLiveModal(false); setLiveRequest(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.background },
  header:           { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle:      { fontSize: 20, fontWeight: '800', color: COLORS.text },
  filterList:       { maxHeight: 52, paddingVertical: 8, backgroundColor: '#fff' },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText:       { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  card:             { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId:          { fontSize: 14, fontWeight: '800', color: COLORS.text },
  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText:        { fontSize: 11, color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  itemLine:         { fontSize: 13, color: COLORS.textLight, marginBottom: 2 },
  cardFooter:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  date:             { fontSize: 12, color: COLORS.textMuted },
  total:            { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  liveRow:          { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#fde8e8' },
  liveHint:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveHintText:     { fontSize: 11, color: '#e74c3c', fontWeight: '600' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 16, color: COLORS.textLight, marginTop: 12 },
});

/* ── Modal Styles ─────────────────────────────────────────────────── */
const lm = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 6 },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
  liveText:      { fontSize: 11, fontWeight: '900', color: '#e74c3c', letterSpacing: 0.5 },
  infoBox:       { backgroundColor: '#fff5f5', borderRadius: 14, padding: 14, marginBottom: 14 },
  infoTitle:     { fontSize: 16, fontWeight: '900', color: '#1a1a1a', marginBottom: 4 },
  infoSub:       { fontSize: 13, color: '#555', lineHeight: 20 },
  orderId:       { fontSize: 11, color: '#aaa', marginTop: 6, fontWeight: '600' },
  stepsBox:      { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 12, marginBottom: 14 },
  stepsTitle:    { fontSize: 13, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  stepText:      { fontSize: 12, color: '#555', lineHeight: 22 },
  inputLabel:    { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6 },
  input:         { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: '#1a1a1a', marginBottom: 14, backgroundColor: '#fafafa' },
  sendBtn:       { backgroundColor: '#e74c3c', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  sendBtnText:   { color: '#fff', fontSize: 15, fontWeight: '900' },
  busyBtn:       { backgroundColor: '#fff9e6', borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#f59e0b' },
  busyBtnText:   { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
});
