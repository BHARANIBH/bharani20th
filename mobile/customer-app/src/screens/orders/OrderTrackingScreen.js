import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, Animated, Easing, Linking, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { orderAPI } from '../../services/api';
import { joinOrderRoom, leaveOrderRoom, getSocket } from '../../services/socket';

/* ── Steps definition ────────────────────────────────────────── */
const STATUS_STEPS = [
  {
    key:     'pending',
    label:   'Order Placed',
    sub:     'We have received your order',
    icon:    'receipt-outline',
    emoji:   '📋',
  },
  {
    key:     'confirmed',
    label:   'Order Confirmed',
    sub:     'Your order has been confirmed',
    icon:    'shield-checkmark-outline',
    emoji:   '✅',
  },
  {
    key:     'processing',
    label:   'Being Prepared',
    sub:     'Our team is preparing your order',
    icon:    'restaurant-outline',
    emoji:   '👨‍🍳',
  },
  {
    key:     'out_for_delivery',
    label:   'Out for Delivery',
    sub:     'Delivery partner is on the way',
    icon:    'bicycle-outline',
    emoji:   '🛵',
  },
  {
    key:     'delivered',
    label:   'Delivered',
    sub:     'Your order has been delivered!',
    icon:    'home-outline',
    emoji:   '🎉',
  },
];

const ETA_MAP = {
  pending:          '30–45 mins',
  confirmed:        '25–35 mins',
  processing:       '15–25 mins',
  out_for_delivery: '5–15 mins',
  delivered:        'Delivered!',
};

/* ── Pulsing dot for active step ─────────────────────────────── */
function PulseDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 700, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulseBg, { transform: [{ scale: pulse }] }]} />
  );
}

/* ── Main screen ─────────────────────────────────────────────── */
export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(false);
  const socketRef               = useRef(null);

  /* ── Live cutting state ── */
  // 'idle' | 'waiting' | 'busy'
  const [liveState, setLiveState] = useState('idle');
  const [liveUrl,   setLiveUrl]   = useState('');

  // Animate each step row in on mount
  const stepAnims = useRef(STATUS_STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchOrder();
    joinOrderRoom(orderId);
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('order:status', (data) => {
      const newStatus = data.orderStatus || data.status;
      const oid = data.orderId;
      if (oid === orderId || data.orderId === orderId) {
        if (newStatus) setOrder(prev => prev ? { ...prev, orderStatus: newStatus } : prev);
      }
    });

    /* ── Live events ── */
    socket.on('live:url', (data) => {
      const url = data.liveUrl;
      setLiveUrl(url);
      setLiveState('idle');
      // Open YouTube directly in YouTube app / browser
      Alert.alert(
        '🔴 Partner is Live!',
        'Your chicken is being cut live. Tap Watch to open the stream.',
        [
          { text: 'Watch Now', onPress: () => Linking.openURL(url) },
          { text: 'Later',     style: 'cancel' },
        ]
      );
    });

    socket.on('live:busy', () => {
      setLiveState('busy');
      // Auto-reset after 8 seconds
      setTimeout(() => setLiveState('idle'), 8000);
    });

    return () => {
      leaveOrderRoom(orderId);
      socket.off('order:status');
      socket.off('live:url');
      socket.off('live:busy');
    };
  }, [orderId]);

  /* ── Request live from server ── */
  const requestLive = async () => {
    try {
      setLiveState('waiting');
      console.log('🔴 Requesting live for orderId:', orderId);
      await orderAPI.requestLive(orderId);
      console.log('✅ Live request sent successfully');
    } catch (e) {
      setLiveState('idle');
      console.error('❌ requestLive failed:', e?.message || e);
      Alert.alert('Error', `Could not send request: ${e?.message || 'Check backend is running'}`);
    }
  };

  // Staggered step entrance animation
  useEffect(() => {
    if (!loading) {
      Animated.stagger(120, stepAnims.map(a =>
        Animated.spring(a, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })
      )).start();
    }
  }, [loading]);

  const fetchOrder = async () => {
    try {
      const res = await orderAPI.getById(orderId);
      setOrder(res.order || res);
    } catch {}
    setLoading(false);
  };

  const currentStep = order
    ? STATUS_STEPS.findIndex(s => s.key === order.orderStatus)
    : 0;

  /* ── Loading ── */
  if (loading) {
    return (
      <View style={styles.loadWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadText}>Fetching your order…</Text>
      </View>
    );
  }

  const status  = order?.orderStatus || 'pending';
  const eta     = ETA_MAP[status] || '30–45 mins';
  const isDelivered = status === 'delivered';

  /* ── Products / items from backend (stored as `products`) ── */
  const orderItems = order?.products || order?.items || [];
  const subtotal   = order?.subtotal   || order?.total || 0;
  const delivery   = order?.deliveryCharge || 0;
  const grandTotal = order?.totalPrice || order?.grandTotal || (subtotal + delivery);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.headerBtn}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <TouchableOpacity onPress={fetchOrder} style={styles.headerBtn}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── ETA + Order number bar ── */}
      <View style={styles.etaBar}>
        <View style={styles.etaItem}>
          <Text style={styles.etaKey}>ESTIMATED TIME</Text>
          <Text style={[styles.etaVal, isDelivered && { color: COLORS.primary }]}>{eta}</Text>
        </View>
        <View style={styles.etaSep} />
        <View style={styles.etaItem}>
          <Text style={styles.etaKey}>ORDER NUMBER</Text>
          <Text style={styles.etaVal}>#{String(orderId).slice(-7).toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Live status badge ── */}
        <View style={styles.liveBadgeRow}>
          {!isDelivered && <View style={styles.liveDot} />}
          <Text style={[styles.liveBadgeText, isDelivered && { color: COLORS.primary }]}>
            {isDelivered ? '✅ Order Delivered Successfully' : '🔴 Live Tracking'}
          </Text>
        </View>

        {/* ── Timeline card ── */}
        <View style={styles.timelineCard}>
          {STATUS_STEPS.map((step, i) => {
            const done    = i <= currentStep;
            const current = i === currentStep;
            const pending = i > currentStep;
            const isLast  = i === STATUS_STEPS.length - 1;

            return (
              <Animated.View
                key={step.key}
                style={{
                  opacity: stepAnims[i],
                  transform: [{ translateX: stepAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
                }}
              >
                <View style={styles.stepRow}>
                  {/* Left: dot + line */}
                  <View style={styles.stepLeft}>
                    {/* Dot */}
                    <View style={styles.dotWrap}>
                      {current && <PulseDot />}
                      <View style={[
                        styles.dot,
                        done    && styles.dotDone,
                        current && styles.dotCurrent,
                        pending && styles.dotPending,
                      ]}>
                        {done ? (
                          current
                            ? <Text style={styles.dotEmoji}>{step.emoji}</Text>
                            : <Ionicons name="checkmark" size={16} color="#fff" />
                        ) : (
                          <Ionicons name={step.icon} size={16} color="#ccc" />
                        )}
                      </View>
                    </View>
                    {/* Connector line */}
                    {!isLast && (
                      <View style={[styles.line, done && i < currentStep && styles.lineDone]} />
                    )}
                  </View>

                  {/* Right: text + icon box */}
                  <View style={[styles.stepRight, isLast && { paddingBottom: 0 }]}>
                    <View style={[styles.stepCard, current && styles.stepCardActive, pending && styles.stepCardPending]}>
                      {/* Icon box */}
                      <View style={[styles.stepIconBox, current && styles.stepIconBoxActive, pending && styles.stepIconBoxPending]}>
                        <Text style={styles.stepIconEmoji}>{step.emoji}</Text>
                      </View>
                      {/* Labels */}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepLabel, current && styles.stepLabelActive, pending && styles.stepLabelPending]}>
                          {step.label}
                        </Text>
                        <Text style={[styles.stepSub, current && styles.stepSubActive, pending && styles.stepSubPending]}>
                          {current ? step.sub : pending ? 'Waiting…' : step.sub}
                        </Text>
                      </View>
                      {/* Status chip */}
                      {current && (
                        <View style={styles.inProgressChip}>
                          <Text style={styles.inProgressText}>Active</Text>
                        </View>
                      )}
                      {!current && done && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* ── Live Chicken Cutting Card ── */}
        {!isDelivered && status !== 'cancelled' && (
          <View style={styles.liveCard}>
            {/* Header row */}
            <View style={styles.liveCardHeader}>
              <View style={styles.liveCardIconWrap}>
                <Text style={{ fontSize: 24 }}>🎥</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.liveCardTitle}>Watch Live Cutting</Text>
                <Text style={styles.liveCardSub}>
                  {liveState === 'waiting'
                    ? 'Waiting for partner to go live…'
                    : liveState === 'busy'
                    ? 'Partner is busy right now'
                    : 'Request to watch your chicken being cut fresh!'}
                </Text>
              </View>
              {liveState === 'idle' && liveUrl === '' && (
                <View style={styles.livePulse}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.livePulseText}>LIVE</Text>
                </View>
              )}
            </View>

            {/* Waiting state */}
            {liveState === 'waiting' && (
              <View style={styles.liveWaiting}>
                <ActivityIndicator size="small" color="#e74c3c" />
                <Text style={styles.liveWaitingText}>
                  Notifying partner… they will go live on YouTube shortly
                </Text>
              </View>
            )}

            {/* Busy state */}
            {liveState === 'busy' && (
              <View style={styles.liveBusyBanner}>
                <Text style={styles.liveBusyText}>
                  🙏 Partner is busy with multiple orders. We'll notify you when they're ready!
                </Text>
              </View>
            )}

            {/* If URL received, show watch again button */}
            {liveUrl !== '' && liveState === 'idle' && (
              <TouchableOpacity
                style={styles.liveWatchAgainBtn}
                onPress={() => Linking.openURL(liveUrl)}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-youtube" size={18} color="#fff" />
                <Text style={styles.liveWatchAgainText}>  Watch Again on YouTube</Text>
              </TouchableOpacity>
            )}

            {/* Request button */}
            {liveState === 'idle' && liveUrl === '' && (
              <TouchableOpacity
                style={styles.liveRequestBtn}
                onPress={requestLive}
                activeOpacity={0.85}
              >
                <Ionicons name="videocam-outline" size={18} color="#fff" />
                <Text style={styles.liveRequestBtnText}>  🔴 Request Live View</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Delivery info ── */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Delivery Details</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="location-sharp" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoVal}>{order?.address || order?.deliveryAddress || 'N/A'}</Text>
            </View>
          </View>
          {order?.deliverySlot && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Delivery Slot</Text>
                <Text style={styles.infoVal}>{order.deliverySlot}</Text>
              </View>
            </View>
          )}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoVal}>
                {order?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'} · ₹{grandTotal}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Order Details accordion ── */}
        <View style={styles.accordionCard}>
          <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
            <Text style={styles.cardTitle}>Order Details</Text>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#999" />
          </TouchableOpacity>

          {expanded && (
            <View style={styles.accordionBody}>
              {orderItems.length > 0 ? orderItems.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemEmoji}>🍗</Text>
                    <View>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemQtyLabel}>Qty: {item.quantity || item.qty || 1}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>₹{item.total || (item.price * (item.quantity || item.qty || 1))}</Text>
                </View>
              )) : (
                <Text style={{ color: '#aaa', fontSize: 13, paddingVertical: 8 }}>No item details available</Text>
              )}
            </View>
          )}
        </View>

        {/* ── Bill Summary ── */}
        <View style={styles.billCard}>
          <Text style={styles.cardTitle}>Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billVal}>₹{subtotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billVal, delivery === 0 && { color: COLORS.primary }]}>
              {delivery === 0 ? 'FREE' : `₹${delivery}`}
            </Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Total</Text>
            <Text style={styles.billTotalVal}>₹{grandTotal}</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        {isDelivered ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rateBtn} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="star-outline" size={18} color={COLORS.primary} />
              <Text style={styles.rateBtnText}>Rate Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
              <Ionicons name="home-outline" size={18} color="#fff" />
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.homeBtn2} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText2}>Back to Home</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#f2f4f7' },
  loadWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f4f7' },
  loadText: { marginTop: 12, fontSize: 14, color: '#888', fontWeight: '600' },

  /* Header */
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.primary },
  headerBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  /* ETA bar */
  etaBar:  { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  etaItem: { flex: 1, alignItems: 'center' },
  etaSep:  { width: 1, backgroundColor: '#eee', marginVertical: 4 },
  etaKey:  { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 1, marginBottom: 4 },
  etaVal:  { fontSize: 18, fontWeight: '900', color: '#1a1a1a' },

  scroll: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },

  /* Live badge */
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  liveDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
  liveBadgeText:{ fontSize: 12, fontWeight: '800', color: '#e74c3c' },

  /* Timeline card */
  timelineCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

  stepRow:  { flexDirection: 'row', alignItems: 'flex-start' },
  stepLeft: { alignItems: 'center', width: 44 },

  /* Dot */
  dotWrap:    { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 },
  pulseBg:    { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(46,125,50,0.15)' },
  dot:        { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotDone:    { backgroundColor: COLORS.primary },
  dotCurrent: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  dotPending: { backgroundColor: '#f0f0f0', borderWidth: 2, borderColor: '#e0e0e0' },
  dotEmoji:   { fontSize: 16 },

  /* Connector line */
  line:     { width: 2, flex: 1, minHeight: 20, backgroundColor: '#e8e8e8', marginVertical: 2 },
  lineDone: { backgroundColor: COLORS.primary },

  /* Step card */
  stepRight:           { flex: 1, paddingLeft: 10, paddingBottom: 16 },
  stepCard:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 14, padding: 12, gap: 12, flex: 1 },
  stepCardActive:      { backgroundColor: '#edfaed', borderWidth: 1.5, borderColor: COLORS.primary },
  stepCardPending:     { backgroundColor: '#f8f8f8', opacity: 0.65 },
  stepIconBox:         { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e8f5e9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepIconBoxActive:   { backgroundColor: COLORS.primary },
  stepIconBoxPending:  { backgroundColor: '#eeeeee' },
  stepIconEmoji:       { fontSize: 22 },
  stepLabel:           { fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginBottom: 3 },
  stepLabelActive:     { color: COLORS.primary },
  stepLabelPending:    { color: '#aaa', fontWeight: '600' },
  stepSub:             { fontSize: 11, color: '#666', lineHeight: 16 },
  stepSubActive:       { color: '#2d7a2d' },
  stepSubPending:      { color: '#ccc' },

  inProgressChip: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  inProgressText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  /* Info card */
  infoCard:    { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle:   { fontSize: 15, fontWeight: '900', color: '#1a1a1a', marginBottom: 16 },
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  infoIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fff0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:   { fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoVal:     { fontSize: 13, color: '#333', fontWeight: '600', lineHeight: 20 },

  /* Accordion */
  accordionCard:   { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  accordionBody:   { paddingHorizontal: 20, paddingBottom: 16 },
  itemRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  itemLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemEmoji:       { fontSize: 22 },
  itemName:        { fontSize: 13, fontWeight: '700', color: '#1a1a1a', maxWidth: 180 },
  itemQtyLabel:    { fontSize: 11, color: '#999', marginTop: 2 },
  itemPrice:       { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  /* Bill */
  billCard:       { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  billRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel:      { fontSize: 14, color: '#777' },
  billVal:        { fontSize: 14, fontWeight: '700', color: '#333' },
  billDivider:    { height: 1, backgroundColor: '#f0f0f0', marginVertical: 10 },
  billTotalLabel: { fontSize: 16, fontWeight: '900', color: '#1a1a1a' },
  billTotalVal:   { fontSize: 18, fontWeight: '900', color: COLORS.primary },

  /* Actions */
  actionRow:    { flexDirection: 'row', gap: 12, marginBottom: 8 },
  rateBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, borderWidth: 2, borderColor: COLORS.primary, paddingVertical: 14 },
  rateBtnText:  { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  homeBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14 },
  homeBtnText:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  homeBtn2:     { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', marginBottom: 8 },
  homeBtnText2: { fontSize: 15, fontWeight: '800', color: '#555' },

  /* ── Live Chicken Cutting Card ── */
  liveCard:         { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#e74c3c', shadowOpacity: 0.12, shadowRadius: 10, elevation: 4, borderWidth: 1.5, borderColor: '#fde8e8' },
  liveCardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  liveCardIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff5f5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  liveCardTitle:    { fontSize: 15, fontWeight: '900', color: '#1a1a1a', marginBottom: 3 },
  liveCardSub:      { fontSize: 12, color: '#777', lineHeight: 17 },
  livePulse:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  livePulseDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePulseText:    { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  liveRequestBtn:   { backgroundColor: '#e74c3c', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  liveRequestBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  liveWaiting:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff5f5', borderRadius: 12, padding: 12, marginBottom: 4 },
  liveWaitingText:  { flex: 1, fontSize: 12, color: '#e74c3c', fontWeight: '600', lineHeight: 18 },
  liveBusyBanner:   { backgroundColor: '#fff9e6', borderRadius: 12, padding: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b', marginBottom: 4 },
  liveBusyText:     { fontSize: 12, color: '#92400e', fontWeight: '600', lineHeight: 18 },
  liveWatchAgainBtn:{ backgroundColor: '#e74c3c', borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  liveWatchAgainText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
