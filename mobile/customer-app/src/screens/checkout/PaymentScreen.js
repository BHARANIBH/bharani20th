import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
  Animated, Easing, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { useCart }    from '../../context/CartContext';
import { useAuth }    from '../../context/AuthContext';
import { useAddress } from '../../context/AddressContext';
import { orderAPI }   from '../../services/api';

/* ── Payment method data ─────────────────────────────────────── */
const UPI_METHODS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png',
    fallbackBg: '#fff',
    fallbackText: 'G Pay',
    fallbackColor: '#1a73e8',
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/PhonePe_Logo.png/480px-PhonePe_Logo.png',
    fallbackBg: '#5f259f',
    fallbackText: 'Pe',
    fallbackColor: '#fff',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Paytm_logo.png/280px-Paytm_logo.png',
    fallbackBg: '#002970',
    fallbackText: 'Paytm',
    fallbackColor: '#fff',
  },
];

const CARD_LOGOS = [
  { name: 'Mastercard',       uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/300px-Mastercard-logo.svg.png' },
  { name: 'Visa',             uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/300px-Visa_Inc._logo.svg.png' },
  { name: 'American Express', uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/300px-American_Express_logo_%282018%29.svg.png' },
  { name: 'Rupay',            uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/300px-RuPay.svg.png' },
];

export default function PaymentScreen({ navigation, route }) {
  const { grandTotal, selAddr, slot, notes, deliveryCharge } = route.params || {};

  const { items, total, clearCart } = useCart();
  const { user }                    = useAuth();
  const { selectedAddress }         = useAddress();

  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [confirmed, setConfirmed]   = useState(false);
  const [orderId, setOrderId]       = useState(null);

  const addr = selAddr || selectedAddress;

  // Animation values
  const bgOpacity    = useRef(new Animated.Value(0)).current;
  const circleScale  = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const glowScale    = useRef(new Animated.Value(0.6)).current;
  const cardSlide    = useRef(new Animated.Value(60)).current;
  const cardOpacity  = useRef(new Animated.Value(0)).current;

  const runConfirmAnimation = () => {
    // Sequence: background fade → outer glow pulse → circle pop → checkmark fade → card slide up
    Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(circleScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, { toValue: 1.25, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(glowScale, { toValue: 0.95, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          ]),
          { iterations: 6 }
        ),
      ]),
      Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(cardSlide,   { toValue: 0,  duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1,  duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  };

  /* ── Place order ─────────────────────────────────────────────── */
  const placeOrder = async (paymentMethod, paymentId = null) => {
    setLoading(true);
    try {
      const orderData = {
        items:           items.map(i => ({ product: i.id || i._id, name: i.name, price: i.price, qty: i.qty, image: i.image || '' })),
        deliveryAddress: typeof addr === 'string' ? addr : (addr?.address || ''),
        deliverySlot:    slot || '9AM - 11AM',
        notes:           notes || '',
        total,
        grandTotal:      grandTotal || total,
        deliveryCharge:  deliveryCharge || 0,
        paymentMethod,
        paymentId,
      };
      const res = await orderAPI.create(orderData);
      if (res.success || res.order) {
        clearCart();
        const oid = res.order?.orderId || res.orderId;
        setOrderId(oid);
        setLoading(false);
        setConfirmed(true);
        runConfirmAnimation();
        // Navigate to tracking after 2.8 seconds
        setTimeout(() => {
          navigation.replace('OrderTracking', { orderId: oid });
        }, 2800);
      } else {
        Alert.alert('Failed', res.message || 'Order could not be placed');
        setLoading(false);
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  /* ── Handle payment method tap ───────────────────────────────── */
  const handlePay = () => {
    if (!selected) {
      Alert.alert('Select Payment', 'Please select a payment method to continue.');
      return;
    }
    if (selected === 'cod') {
      placeOrder('cod');
    } else {
      // UPI / Card / NetBanking — for now show coming soon (Razorpay can be integrated later)
      Alert.alert(
        '🚧 Coming Soon',
        `${getMethodLabel(selected)} payment integration is being set up.\n\nPlease use Cash on Delivery for now.`,
        [{ text: 'OK' }]
      );
    }
  };

  const getMethodLabel = (id) => {
    if (id === 'gpay')    return 'Google Pay';
    if (id === 'phonepe') return 'PhonePe';
    if (id === 'paytm')   return 'Paytm';
    if (id === 'card')    return 'Credit/Debit Card';
    if (id === 'netbanking') return 'Net Banking';
    if (id === 'sodexo')  return 'Sodexo Card';
    return id;
  };

  const RadioDot = ({ active }) => (
    <View style={[styles.radio, active && styles.radioActive]}>
      {active && <View style={styles.radioDot} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Options</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── PAY BY UPI ── */}
        <SectionDivider label="Pay By UPI" />

        {UPI_METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodRow, selected === m.id && styles.methodRowSelected]}
            onPress={() => setSelected(m.id)}
            activeOpacity={0.7}
          >
            <UPIIcon method={m} />
            <Text style={styles.methodLabel}>{m.label}</Text>
            <RadioDot active={selected === m.id} />
          </TouchableOpacity>
        ))}

        {/* ── CREDIT & DEBIT CARDS ── */}
        <SectionDivider label="Credit & Debit Cards" />

        {/* Card brand logos row */}
        <View style={styles.cardLogosRow}>
          {CARD_LOGOS.map((c, i) => (
            <View key={i} style={styles.cardLogoBox}>
              <Image source={{ uri: c.uri }} style={styles.cardLogoImg} resizeMode="contain" />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.methodRow, selected === 'card' && styles.methodRowSelected]}
          onPress={() => setSelected('card')}
          activeOpacity={0.7}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={20} color={COLORS.danger} />
          </View>
          <Text style={[styles.methodLabel, { color: COLORS.danger, fontWeight: '700' }]}>Add New Card</Text>
          <RadioDot active={selected === 'card'} />
        </TouchableOpacity>

        {/* ── NET BANKING ── */}
        <SectionDivider label="Net Banking" />

        <TouchableOpacity
          style={[styles.methodRow, selected === 'netbanking' && styles.methodRowSelected]}
          onPress={() => setSelected('netbanking')}
          activeOpacity={0.7}
        >
          <View style={[styles.upiIconWrap, { backgroundColor: '#f0f4ff' }]}>
            <Ionicons name="business-outline" size={22} color="#3b5bdb" />
          </View>
          <Text style={styles.methodLabel}>View All Banks</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" style={{ marginRight: 2 }} />
        </TouchableOpacity>

        {/* ── PAY BY SODEXO CARDS ── */}
        <SectionDivider label="Pay By Sodexo Cards" />

        <TouchableOpacity
          style={[styles.methodRow, selected === 'sodexo' && styles.methodRowSelected]}
          onPress={() => setSelected('sodexo')}
          activeOpacity={0.7}
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={20} color={COLORS.danger} />
          </View>
          <Text style={[styles.methodLabel, { color: COLORS.danger, fontWeight: '700' }]}>Add New Sodexo Card</Text>
          <RadioDot active={selected === 'sodexo'} />
        </TouchableOpacity>

        {/* ── CASH ON DELIVERY ── */}
        <SectionDivider label="Cash on Delivery" />

        <TouchableOpacity
          style={[styles.methodRow, selected === 'cod' && styles.methodRowSelected]}
          onPress={() => setSelected('cod')}
          activeOpacity={0.7}
        >
          <View style={[styles.upiIconWrap, { backgroundColor: '#f0fff4' }]}>
            <Ionicons name="cash-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodLabel}>Cash on Delivery</Text>
            <Text style={styles.methodSub}>Pay when your order arrives</Text>
          </View>
          <RadioDot active={selected === 'cod'} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount to pay</Text>
          <Text style={styles.totalAmount}>₹{grandTotal}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, (!selected || loading) && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={!selected || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.payBtnText}>
                {selected === 'cod' ? `Place Order · ₹${grandTotal}` : `Pay ₹${grandTotal}`}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Order Confirmed Overlay ─────────────────────────────── */}
      <Modal visible={confirmed} transparent animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>

          {/* Outer glow ring */}
          <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }] }]} />

          {/* Green circle with checkmark */}
          <Animated.View style={[styles.successCircle, { transform: [{ scale: circleScale }] }]}>
            <Animated.View style={{ opacity: checkOpacity }}>
              <Ionicons name="checkmark" size={64} color="#fff" />
            </Animated.View>
          </Animated.View>

          {/* Sparkle dots */}
          {[
            { top: '22%', left: '18%' },
            { top: '20%', right: '18%' },
            { top: '36%', left: '10%' },
            { top: '36%', right: '10%' },
            { top: '52%', left: '16%' },
            { top: '52%', right: '16%' },
          ].map((pos, i) => (
            <Animated.View
              key={i}
              style={[styles.sparkle, pos, { opacity: checkOpacity, transform: [{ scale: circleScale }] }]}
            />
          ))}

          {/* Info card */}
          <Animated.View style={[
            styles.confirmCard,
            { opacity: cardOpacity, transform: [{ translateY: cardSlide }] },
          ]}>
            <Text style={styles.confirmTitle}>Order Confirmed!</Text>
            <Text style={styles.confirmSub}>Your fresh country chicken is being prepared 🐔</Text>
            {orderId && (
              <View style={styles.orderIdRow}>
                <Text style={styles.orderIdLabel}>Order ID</Text>
                <Text style={styles.orderIdValue}>{orderId}</Text>
              </View>
            )}
            <View style={styles.confirmDivider} />
            <Text style={styles.confirmRedirect}>Taking you to order tracking…</Text>
            <ActivityIndicator color={COLORS.primary} size="small" style={{ marginTop: 8 }} />
          </Animated.View>

        </Animated.View>
      </Modal>

    </SafeAreaView>
  );
}

/* ── Helper components ───────────────────────────────────────── */
function SectionDivider({ label }) {
  return (
    <View style={styles.sectionDivider}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function UPIIcon({ method }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <View style={[styles.upiIconWrap, { backgroundColor: method.fallbackBg }]}>
        <Text style={{ fontSize: 13, fontWeight: '900', color: method.fallbackColor }}>
          {method.fallbackText}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.upiIconWrap}>
      <Image
        source={{ uri: method.uri }}
        style={styles.upiIconImg}
        resizeMode="contain"
        onError={() => setErrored(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },

  scroll: { paddingBottom: 20 },

  /* Section divider */
  sectionDivider: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 22, paddingBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#1a1a1a', marginRight: 12 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: '#e0e0e0' },

  /* Method row */
  methodRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 0, marginBottom: 1,
    paddingHorizontal: 16, paddingVertical: 16,
    gap: 14,
    borderWidth: 0,
  },
  methodRowSelected: {
    backgroundColor: '#f0f7f0',
  },
  methodLabel: { flex: 1, fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  methodSub:   { fontSize: 12, color: '#999', marginTop: 2 },

  /* UPI icon */
  upiIconWrap: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  upiIconImg: { width: 32, height: 32 },

  /* Card brand logos */
  cardLogosRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', marginBottom: 1,
  },
  cardLogoBox: {
    flex: 1, height: 36, backgroundColor: '#f5f5f5',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 1, borderColor: '#eee',
  },
  cardLogoImg: { width: '100%', height: 24 },

  /* Add card icon */
  addIcon: {
    width: 42, height: 42, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.danger,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Radio button */
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.primary },
  radioDot: {
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  /* Footer */
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: '#eee',
  },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel:  { fontSize: 14, color: '#666', fontWeight: '600' },
  totalAmount: { fontSize: 20, fontWeight: '900', color: '#1a1a1a' },

  payBtn:         { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  payBtnDisabled: { backgroundColor: '#ccc' },
  payBtnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },

  /* ── Order confirmed overlay ── */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Outer pulsing glow ring
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // Main green circle
  successCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    marginBottom: 32,
  },

  // Sparkle dots around the circle
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.85,
  },

  // Info card below the circle
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    width: '82%',
  },
  confirmTitle:   { fontSize: 24, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
  confirmSub:     { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  orderIdRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fff0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  orderIdLabel:   { fontSize: 12, color: '#888', fontWeight: '600' },
  orderIdValue:   { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  confirmDivider: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 14 },
  confirmRedirect:{ fontSize: 13, color: '#999', fontWeight: '600' },
});
