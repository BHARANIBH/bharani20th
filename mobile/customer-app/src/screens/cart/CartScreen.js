import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, Alert, Animated, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 28; // 14px padding each side
const MIN_ORDER   = 100;

/* ─── helpers ─────────────────────────────────────────────── */
const origPrice = (price) => Math.ceil((price * 1.25) / 5) * 5;

/* ════════════════════════════════════════════════════════════
   1.  MARQUEE STRIP  — scrolling trust bar below header
   ════════════════════════════════════════════════════════════ */
const MARQUEE =
  '🐓 100% Desi Country Chicken   ·   Zero Antibiotics   ·   Farm Raised   ·   ' +
  'FSSAI Certified   ·   Heart Healthy   ·   Free-Range Naatu Breed   ·   ';

function MarqueeStrip() {
  const tx = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* Animate 700 px to the left (approx width of one copy of text),
       then instantly reset — seamless because text is duplicated 3×  */
    Animated.loop(
      Animated.timing(tx, {
        toValue:  -720,
        duration: 14000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={styles.marqueeWrap}>
      <Animated.View style={[styles.marqueeInner, { transform: [{ translateX: tx }] }]}>
        <Text style={styles.marqueeTxt}>{MARQUEE}{MARQUEE}{MARQUEE}</Text>
      </Animated.View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════
   2.  IMAGE SLIDER  — 3 farm slides with overlay text
   ════════════════════════════════════════════════════════════ */
const SLIDES = [
  {
    uri:   'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=700&q=85',
    title: '100% Desi Country Chicken',
    sub:   'Free-range · Naturally raised on open farms',
    badge: '🐓 Naatu Breed',
  },
  {
    uri:   'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=700&q=85',
    title: 'Zero Antibiotics · Farm Direct',
    sub:   'From our farm straight to your table',
    badge: '🌿 100% Natural',
  },
  {
    uri:   'https://images.unsplash.com/photo-1574484284002-952d92456975?w=700&q=85',
    title: 'Heart Healthy Choice',
    sub:   '+40% Protein vs regular broiler chicken',
    badge: '❤️ Heart Healthy',
  },
];

function ImageSlider() {
  const scrollRef  = useRef(null);
  const [active, setActive] = useState(0);

  /* Auto-advance every 3.2 s */
  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true });
        return next;
      });
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    setActive(idx);
  };

  return (
    <View style={styles.sliderWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width: SLIDE_WIDTH }]}>
            <Image
              source={{ uri: s.uri }}
              style={styles.slideImg}
              resizeMode="cover"
            />
            {/* dark gradient overlay via semi-transparent view */}
            <View style={styles.slideOverlay} />

            {/* Badge top-right */}
            <View style={styles.slideBadge}>
              <Text style={styles.slideBadgeTxt}>{s.badge}</Text>
            </View>

            {/* Text bottom */}
            <View style={styles.slideTextBox}>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideSub}>{s.sub}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === active && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════
   3.  SAVINGS BANNER
   ════════════════════════════════════════════════════════════ */
function SavingsBanner({ savings }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.savingsBanner, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.savingsEmoji}>🎉</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.savingsText}>
          You're saving <Text style={styles.savingsAmt}>₹{savings}</Text> on this order!
        </Text>
        <Text style={styles.savingsSub}>Desi chicken at the best farm-fresh price</Text>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════
   4.  DELIVERY SLOT CARD
   ════════════════════════════════════════════════════════════ */
function DeliverySlot() {
  return (
    <View style={styles.slotCard}>
      <View style={styles.slotLeft}>
        <View style={styles.slotIconBox}>
          <Text style={{ fontSize: 18 }}>⚡</Text>
        </View>
        <View>
          <Text style={styles.slotTitle}>Express Delivery</Text>
          <Text style={styles.slotSub}>Fresh chicken in 30–45 mins</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.slotChangeBtn}>
        <Text style={styles.slotChangeTxt}>Change</Text>
        <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════
   5.  CART ITEM CARD  — with NAATU badge on image
   ════════════════════════════════════════════════════════════ */
function CartItem({ item, onAdd, onRemove, onDelete }) {
  const id   = item.id || item._id;
  const orig = origPrice(item.price);
  const disc = Math.round(((orig - item.price) / orig) * 100);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bump = () =>
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80,  useNativeDriver: true }),
      Animated.spring(scaleAnim,  { toValue: 1,    friction: 4,   useNativeDriver: true }),
    ]).start();

  return (
    <Animated.View style={[styles.itemCard, { transform: [{ scale: scaleAnim }] }]}>
      {/* ── Product image + NAATU badge ── */}
      <View style={styles.imgBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
        ) : (
          <Text style={styles.productEmoji}>🍗</Text>
        )}
        {/* NAATU stamp badge */}
        <View style={styles.natuBadge}>
          <Text style={styles.natuBadgeTxt}>NAATU</Text>
        </View>
      </View>

      {/* ── Item info ── */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemUnit}>{item.unit || '1 kg'}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.currentPrice}>₹{item.price}</Text>
          <Text style={styles.strikePrince}>₹{orig}</Text>
          <View style={styles.discBadge}>
            <Text style={styles.discTxt}>{disc}% off</Text>
          </View>
        </View>

        <Text style={styles.itemTotal}>
          Subtotal: <Text style={{ fontWeight: '900', color: COLORS.primary }}>₹{item.price * item.qty}</Text>
        </Text>
      </View>

      {/* ── Right: delete + qty ── */}
      <View style={styles.itemActions}>
        <TouchableOpacity onPress={() => onDelete(id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={15} color="#e74c3c" />
        </TouchableOpacity>

        <View style={styles.qtyControls}>
          <TouchableOpacity
            style={[styles.qtyBtn, styles.qtyMinus]}
            onPress={() => { bump(); onRemove(id, item.qty - 1); }}
            activeOpacity={0.75}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.qtyNum}>{item.qty}</Text>

          <TouchableOpacity
            style={[styles.qtyBtn, styles.qtyPlus]}
            onPress={() => { bump(); onAdd(id, item.qty + 1); }}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════
   6.  EMPTY STATE
   ════════════════════════════════════════════════════════════ */
function EmptyCart({ navigation }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyWrap}>
      <Animated.Text style={[styles.emptyEmoji, { transform: [{ translateY: floatAnim }] }]}>
        🛒
      </Animated.Text>
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySub}>Add some fresh desi country chicken to get started</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
        <Ionicons name="storefront-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.shopBtnText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN SCREEN
   ════════════════════════════════════════════════════════════ */
export default function CartScreen({ navigation }) {
  const { items, updateQty, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();

  const deliveryFee  = total >= 500 ? 0 : 40;
  const grandTotal   = total + deliveryFee;

  const totalSavings = items.reduce(
    (acc, item) => acc + (origPrice(item.price) - item.price) * item.qty,
    0
  );

  const handleCheckout = () => {
    if (!user) {
      Alert.alert(
        '🔒 Login Required',
        'Please login to place an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login Now', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    if (total < MIN_ORDER) {
      Alert.alert(
        '🛒 Minimum Order',
        `Minimum order amount is ₹${MIN_ORDER}. Add ₹${MIN_ORDER - total} more to continue.`,
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  /* ── Empty cart ── */
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={{ width: 40 }} />
        </View>
        <MarqueeStrip />
        <EmptyCart navigation={navigation} />
      </SafeAreaView>
    );
  }

  /* ── Filled cart ── */
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSub}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() =>
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearCart },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color="#e74c3c" />
          <Text style={styles.clearTxt}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Marquee trust strip */}
      <MarqueeStrip />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Savings banner */}
        {totalSavings > 0 && <SavingsBanner savings={totalSavings} />}

        {/* Image slider */}
        <ImageSlider />

        {/* Delivery slot */}
        <DeliverySlot />

        {/* Section header */}
        <View style={styles.sectionHdr}>
          <Text style={styles.sectionTitle}>🐔 Your Items</Text>
          <Text style={styles.sectionSub}>All 100% Naatu Country Chicken</Text>
        </View>

        {/* Item cards */}
        {items.map(item => (
          <CartItem
            key={String(item.id || item._id)}
            item={item}
            onAdd={(id, qty)    => updateQty(id, qty)}
            onRemove={(id, qty) => updateQty(id, qty)}
            onDelete={(id)      => removeItem(id)}
          />
        ))}

        {/* Free delivery progress */}
        {deliveryFee > 0 && (
          <View style={styles.freeDelivCard}>
            <Ionicons name="bicycle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.freeDelivText}>
              Add{' '}
              <Text style={{ fontWeight: '900', color: COLORS.primary }}>₹{500 - total}</Text>
              {' '}more for{' '}
              <Text style={{ fontWeight: '900', color: COLORS.primary }}>FREE delivery</Text>
            </Text>
          </View>
        )}

        {/* Bill summary */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <View style={styles.billValRow}>
              <Text style={styles.billOrig}>
                ₹{items.reduce((a, i) => a + origPrice(i.price) * i.qty, 0)}
              </Text>
              <Text style={styles.billVal}>₹{total}</Text>
            </View>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billVal, deliveryFee === 0 && styles.freeText]}>
              {deliveryFee === 0 ? '🎁 FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          {totalSavings > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#27ae60' }]}>Total Savings</Text>
              <Text style={[styles.billVal, { color: '#27ae60', fontWeight: '900' }]}>
                −₹{totalSavings}
              </Text>
            </View>
          )}

          <View style={styles.billDivider} />

          <View style={styles.billRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandVal}>₹{grandTotal}</Text>
          </View>

          {total < MIN_ORDER && (
            <View style={styles.minOrderBanner}>
              <Ionicons name="alert-circle" size={15} color="#e67e22" />
              <Text style={styles.minOrderTxt}>
                Minimum order ₹{MIN_ORDER} — add ₹{MIN_ORDER - total} more
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating checkout bar */}
      <View style={styles.checkoutBar}>
        <View style={styles.checkoutMeta}>
          <Text style={styles.checkoutTotal}>₹{grandTotal}</Text>
          <Text style={styles.checkoutSub}>
            {totalSavings > 0 ? `You saved ₹${totalSavings} 🎉` : `${items.length} item${items.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, total < MIN_ORDER && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutBtnTxt}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ─────────────────── Styles ─────────────────── */
const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f3f5f3' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 10 },

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#1a1a1a' },
  headerSub:   { fontSize: 11, color: '#888', fontWeight: '600', marginTop: 1 },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 7, backgroundColor: '#fff0f0', borderRadius: 10 },
  clearTxt:    { fontSize: 12, color: '#e74c3c', fontWeight: '700' },

  /* ── Marquee ── */
  marqueeWrap: {
    backgroundColor: COLORS.primary,
    overflow: 'hidden',
    height: 28,
    justifyContent: 'center',
  },
  marqueeInner: { flexDirection: 'row' },
  marqueeTxt:  { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.3 },

  /* ── Image Slider ── */
  sliderWrap:  { marginBottom: 12 },
  slide: {
    height: 152, borderRadius: 18, overflow: 'hidden',
    position: 'relative',
  },
  slideImg:    { width: '100%', height: '100%' },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,20,0,0.52)',
  },
  slideBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(46,204,113,0.92)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  slideBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  slideTextBox:  { position: 'absolute', bottom: 12, left: 14, right: 14 },
  slideTitle:    { fontSize: 16, fontWeight: '900', color: '#fff', lineHeight: 20 },
  slideSub:      { fontSize: 11, color: 'rgba(255,255,255,0.82)', marginTop: 3, fontWeight: '500' },
  dotsRow:       { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 5 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ccc' },
  dotActive:     { width: 18, borderRadius: 3, backgroundColor: COLORS.primary },

  /* ── Savings banner ── */
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#e8f8ee', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12,
    borderWidth: 1, borderColor: '#b2dfc2',
  },
  savingsEmoji: { fontSize: 22 },
  savingsText:  { fontSize: 13, color: '#1a5c1a', fontWeight: '700' },
  savingsAmt:   { fontSize: 15, fontWeight: '900' },
  savingsSub:   { fontSize: 11, color: '#3a8c3a', marginTop: 2, fontWeight: '500' },

  /* ── Delivery Slot ── */
  slotCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6,
    borderWidth: 1, borderColor: '#e0f0e0',
  },
  slotLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  slotIconBox:   { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e8f8ee', alignItems: 'center', justifyContent: 'center' },
  slotTitle:     { fontSize: 14, fontWeight: '800', color: '#1a1a1a' },
  slotSub:       { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '500' },
  slotChangeBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#e8f8ee', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  slotChangeTxt: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  /* ── Section header ── */
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#1a1a1a' },
  sectionSub:   { fontSize: 11, color: '#2e9c2e', fontWeight: '700' },

  /* ── Item card ── */
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18,
    padding: 13, marginBottom: 12,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
    borderWidth: 1, borderColor: '#f0f0f0',
  },
  imgBox: {
    width: 76, height: 76, borderRadius: 14,
    backgroundColor: '#f9f0e6',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, overflow: 'hidden',
    position: 'relative',
  },
  productImg:   { width: 76, height: 76 },
  productEmoji: { fontSize: 38 },

  /* NAATU stamp badge */
  natuBadge: {
    position: 'absolute', top: 0, left: 0,
    backgroundColor: '#1a7a1a',
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 10,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  natuBadgeTxt: { fontSize: 8, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },

  itemInfo:     { flex: 1, paddingRight: 6 },
  itemName:     { fontSize: 14, fontWeight: '800', color: '#1a1a1a', lineHeight: 19 },
  itemUnit:     { fontSize: 12, color: '#888', fontWeight: '500', marginTop: 2 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  currentPrice: { fontSize: 15, fontWeight: '900', color: '#1a1a1a' },
  strikePrince: { fontSize: 12, color: '#bbb', textDecorationLine: 'line-through' },
  discBadge:    { backgroundColor: '#fff0e0', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  discTxt:      { fontSize: 10, color: '#e67e22', fontWeight: '800' },
  itemTotal:    { fontSize: 12, color: '#555', fontWeight: '600', marginTop: 4 },

  itemActions:  { alignItems: 'center', gap: 10 },
  deleteBtn:    { width: 30, height: 30, borderRadius: 10, backgroundColor: '#fff0f0', alignItems: 'center', justifyContent: 'center' },

  /* Qty controls */
  qtyControls:  { flexDirection: 'row', alignItems: 'center' },
  qtyBtn:       { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyMinus:     { backgroundColor: '#e74c3c', borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  qtyPlus:      { backgroundColor: COLORS.primary, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  qtyNum:       { width: 34, textAlign: 'center', fontSize: 15, fontWeight: '900', color: '#1a1a1a', backgroundColor: '#f5f5f5', paddingVertical: 6 },

  /* ── Free delivery ── */
  freeDelivCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 11, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#c8e6c8', borderStyle: 'dashed',
  },
  freeDelivText: { fontSize: 13, color: '#444', flex: 1 },

  /* ── Bill card ── */
  billCard: {
    backgroundColor: '#fff', borderRadius: 18,
    padding: 18, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  billTitle:   { fontSize: 15, fontWeight: '900', color: '#1a1a1a', marginBottom: 14 },
  billRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  billLabel:   { fontSize: 13, color: '#555', fontWeight: '500' },
  billValRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  billOrig:    { fontSize: 12, color: '#bbb', textDecorationLine: 'line-through' },
  billVal:     { fontSize: 13, color: '#1a1a1a', fontWeight: '700' },
  freeText:    { color: '#27ae60', fontWeight: '800' },
  billDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  grandLabel:  { fontSize: 16, fontWeight: '900', color: '#1a1a1a' },
  grandVal:    { fontSize: 19, fontWeight: '900', color: COLORS.primary },

  /* Min order */
  minOrderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginTop: 10,
    borderWidth: 1, borderColor: '#fde3c0',
  },
  minOrderTxt: { fontSize: 12, color: '#e67e22', fontWeight: '600', flex: 1 },

  /* ── Floating checkout bar ── */
  checkoutBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 22,
    borderTopWidth: 1, borderTopColor: '#eee',
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 16,
    gap: 14,
  },
  checkoutMeta:       { flex: 1 },
  checkoutTotal:      { fontSize: 21, fontWeight: '900', color: '#1a1a1a' },
  checkoutSub:        { fontSize: 11, color: '#27ae60', fontWeight: '700', marginTop: 1 },
  checkoutBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16 },
  checkoutBtnDisabled:{ backgroundColor: '#aaa' },
  checkoutBtnTxt:     { fontSize: 13, fontWeight: '800', color: '#fff' },

  /* ── Empty state ── */
  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyEmoji:   { fontSize: 80 },
  emptyTitle:   { fontSize: 22, fontWeight: '900', color: '#1a1a1a', marginTop: 20 },
  emptySub:     { fontSize: 14, color: '#888', marginTop: 8, marginBottom: 28, textAlign: 'center', paddingHorizontal: 32 },
  shopBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 16, elevation: 4 },
  shopBtnText:  { color: '#fff', fontSize: 15, fontWeight: '800' },
});
