import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useAddress } from '../../context/AddressContext';

// Fallback products (same as original web app) shown if API fails
// Verified working raw chicken images (BigBasket Fresho CDN + GoNaatu Wix CDN)
const IMG_CURRY_CUT  = 'https://www.bbassets.com/media/uploads/p/l/40048898_5-fresho-chicken-curry-cut-without-skin-antibiotic-residue-free.jpg';
const IMG_WHOLE_CHKN = 'https://static.wixstatic.com/media/8bcb0b_8a7a98ece34a495b82faeef4105c11b5~mv2.png/v1/fit/w_500,h_500,q_90/file.png';
const IMG_EGGS       = 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&q=80';
const IMG_PROTEIN    = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=500&q=80';
const IMG_PROTEIN2   = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80';

const FALLBACK_PRODUCTS = [
  // ── Chicken (4 only) ──
  {
    id: 1,  name: 'Chicken Curry Cut - Small Pieces',
    subTitle: 'Juicy bone-in chicken for delectable curries',
    weight: '500 g | 12-18 Pieces | Serves 4',
    price: 183, originalPrice: 218, discount: 16,
    image: IMG_CURRY_CUT,
    category: 'chicken', delivery: 'Delivery in 30 mins', isHit: true,
  },
  {
    id: 2,  name: 'Chicken Bites - Boneless',
    subTitle: 'Fresh, Antibiotic Residue Free boneless bites',
    weight: '250 g | 20-25 Pieces | Serves 2-3',
    price: 199, originalPrice: 239, discount: 17,
    image: IMG_WHOLE_CHKN,
    category: 'chicken', delivery: 'Delivery in 30 mins', isHit: false,
  },
  {
    id: 3,  name: 'Premium Chicken Leg Curry Cut',
    subTitle: 'A perfect mix of thighs & two drumsticks',
    weight: '6 Pieces | Serves 2-3',
    price: 269, originalPrice: 310, discount: 13,
    image: IMG_CURRY_CUT,
    category: 'chicken', delivery: 'Delivery in 30 mins', isHit: true,
  },
  {
    id: 13, name: 'Chicken Curry Cut - Large Pack',
    subTitle: 'Full 1 kg of fresh bone-in curry cut pieces',
    weight: '1 kg | Full Curry Cut | Serves 6-8',
    price: 355, originalPrice: 402, discount: 12,
    image: IMG_WHOLE_CHKN,
    category: 'chicken', delivery: 'Delivery in 25 mins', isHit: true,
  },

  // ── Eggs (2 only) ──
  {
    id: 5,  name: 'Desi Country Eggs - 6 Pack',
    subTitle: 'Free-range eggs with deep golden yolk',
    weight: '6 Eggs | Free Range | Rich in Omega-3',
    price: 90, originalPrice: 108, discount: 17,
    image: IMG_EGGS,
    category: 'eggs', delivery: 'Delivery in 30 mins', isHit: true,
  },
  {
    id: 6,  name: 'Desi Country Eggs - Dozen',
    subTitle: 'Best value pack of premium free-range eggs',
    weight: '12 Eggs | Free Range | Best Value',
    price: 168, originalPrice: 200, discount: 16,
    image: IMG_EGGS,
    category: 'eggs', delivery: 'Delivery in 30 mins', isHit: false,
  },

  // ── Protein Intake (2 only) ──
  {
    id: 7,  name: '100g Protein Power Combo',
    subTitle: '100g Chicken Breast + 3 Eggs + Sprouts',
    weight: '100g Breast + 3 Eggs + Sprouts | 41g Protein',
    price: 149, originalPrice: 199, discount: 25,
    image: IMG_PROTEIN,
    category: 'protein', delivery: 'Delivery in 30 mins', isHit: true, isProtein: true,
  },
  {
    id: 8,  name: 'Morning Protein Pack',
    subTitle: '100g Breast + 4 Eggs + Fresh Greens',
    weight: '100g Breast + 4 Eggs + Greens | 47g Protein',
    price: 169, originalPrice: 220, discount: 23,
    image: IMG_PROTEIN2,
    category: 'protein', delivery: 'Delivery in 30 mins', isHit: false, isProtein: true,
  },
];

/* ── Flash Sale Banner (stable component — not inside HomeScreen to avoid re-renders) ── */
const FlashBanner = memo(() => {
  const FLASH_END = useRef(Date.now() + (8 * 3600 + 21 * 60 + 31) * 1000).current;
  const [t, setT] = useState({ h: '08', m: '21', s: '31' });
  useEffect(() => {
    const id = setInterval(() => {
      const diff = Math.max(0, FLASH_END - Date.now());
      setT({
        h: String(Math.floor(diff / 3600000)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={flashStyles.banner}>
      <View>
        <Text style={flashStyles.title}>⚡ Flash Sale</Text>
        <View style={flashStyles.timerRow}>
          <View style={flashStyles.box}><Text style={flashStyles.num}>{t.h}</Text><Text style={flashStyles.unit}>Hrs</Text></View>
          <Text style={flashStyles.colon}>:</Text>
          <View style={flashStyles.box}><Text style={flashStyles.num}>{t.m}</Text><Text style={flashStyles.unit}>Mins</Text></View>
          <Text style={flashStyles.colon}>:</Text>
          <View style={flashStyles.box}><Text style={flashStyles.num}>{t.s}</Text><Text style={flashStyles.unit}>Secs</Text></View>
        </View>
      </View>
      <View style={flashStyles.badge}><Text style={flashStyles.badgeText}>44% OFF</Text></View>
    </View>
  );
});

const flashStyles = StyleSheet.create({
  banner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FF6B00', marginHorizontal: 12, marginTop: 10, marginBottom: 2, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14 },
  title:     { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 8 },
  timerRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  box:       { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 52 },
  num:       { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  unit:      { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textTransform: 'uppercase' },
  colon:     { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 12 },
  badge:     { backgroundColor: '#fff', borderRadius: 30, paddingHorizontal: 14, paddingVertical: 10 },
  badgeText: { fontSize: 16, fontWeight: '900', color: '#FF6B00' },
});

/* ── Why Country Chicken — stable footer section ─────────────── */
const BENEFITS = [
  { icon: '🧒', title: 'Safe for Kids',    sub: 'Zero antibiotics' },
  { icon: '❤️', title: 'Heart Healthy',    sub: 'Low cholesterol' },
  { icon: '💪', title: 'Rich in Protein',  sub: '+40% more protein' },
  { icon: '🌿', title: '100% Natural',     sub: 'No hormones added' },
  { icon: '🐓', title: 'Farm Fresh',       sub: 'Direct from farm' },
  { icon: '😋', title: 'Better Taste',     sub: 'Authentic desi flavour' },
];

const BenefitsSection = memo(() => (
  <View style={benefitStyles.wrap}>
    {/* Hero banner */}
    <View style={benefitStyles.hero}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80' }}
        style={benefitStyles.heroBg}
        resizeMode="cover"
      />
      <View style={benefitStyles.heroOverlay} />
      <View style={benefitStyles.heroContent}>
        <Text style={benefitStyles.heroTitle}>Pure Desi Country{'\n'}Chicken</Text>
        <Text style={benefitStyles.heroSub}>Fresh, natural, and sustainably{'\n'}raised for your healthy lifestyle</Text>
      </View>
    </View>

    {/* Why section heading */}
    <View style={benefitStyles.sectionHead}>
      <Text style={benefitStyles.sectionHeadLine} />
      <Text style={benefitStyles.sectionHeadText}>Why Country Chicken?</Text>
      <Text style={benefitStyles.sectionHeadLine} />
    </View>

    {/* Benefits grid */}
    <View style={benefitStyles.grid}>
      {BENEFITS.map((b, i) => (
        <View key={i} style={benefitStyles.card}>
          <Text style={benefitStyles.cardIcon}>{b.icon}</Text>
          <Text style={benefitStyles.cardTitle}>{b.title}</Text>
          <Text style={benefitStyles.cardSub}>{b.sub}</Text>
        </View>
      ))}
    </View>

    {/* Comparison table */}
    <View style={benefitStyles.table}>
      <Text style={benefitStyles.tableTitle}>Country Chicken vs Broiler</Text>
      <View style={benefitStyles.tableHeader}>
        <Text style={[benefitStyles.tableCol, benefitStyles.tableColHead, { flex: 1.4 }]}>Parameter</Text>
        <Text style={[benefitStyles.tableCol, benefitStyles.tableColHead, benefitStyles.tableColGreen]}>Country 🐓</Text>
        <Text style={[benefitStyles.tableCol, benefitStyles.tableColHead, { color: '#e74c3c' }]}>Broiler</Text>
      </View>
      {[
        ['Protein Level',   'High (+40%)', 'Normal'],
        ['Fat Content',     'Very Low',    'High'],
        ['Antibiotics',     'None',        'Used'],
        ['Growth Hormones', 'None',        'Given'],
        ['Taste',           'Rich & Desi', 'Bland'],
        ['Cholesterol',     'Low',         'High'],
      ].map(([label, good, bad], i) => (
        <View key={i} style={[benefitStyles.tableRow, i % 2 === 0 && { backgroundColor: '#f8fff8' }]}>
          <Text style={[benefitStyles.tableCol, { flex: 1.4, color: '#444' }]}>{label}</Text>
          <Text style={[benefitStyles.tableCol, benefitStyles.tableColGreen]}>{good}</Text>
          <Text style={[benefitStyles.tableCol, { color: '#e74c3c' }]}>{bad}</Text>
        </View>
      ))}
    </View>

    {/* Story card */}
    <View style={benefitStyles.storyCard}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=800&q=80' }}
        style={benefitStyles.storyImg}
        resizeMode="cover"
      />
      <View style={benefitStyles.storyBody}>
        <Text style={benefitStyles.storyTitle}>Our Story</Text>
        <Text style={benefitStyles.storyText}>
          GoNaatu was born from a simple belief — everyone deserves access to pure, naturally raised country chicken.
          We work directly with local farmers who raise their birds the traditional way — free-range, on natural feed,
          without any antibiotics or hormones.
        </Text>
        <View style={benefitStyles.storyBadges}>
          <View style={benefitStyles.badge}><Text style={benefitStyles.badgeText}>🌾 Free Range</Text></View>
          <View style={benefitStyles.badge}><Text style={benefitStyles.badgeText}>🏡 Farm Direct</Text></View>
          <View style={benefitStyles.badge}><Text style={benefitStyles.badgeText}>✅ FSSAI Certified</Text></View>
        </View>
      </View>
    </View>

    <View style={{ height: 100 }} />
  </View>
));

const benefitStyles = StyleSheet.create({
  wrap:          { marginTop: 16 },

  /* Hero */
  hero:          { marginHorizontal: 12, borderRadius: 20, overflow: 'hidden', height: 200, marginBottom: 20 },
  heroBg:        { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,60,0,0.52)' },
  heroContent:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  heroTitle:     { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 32 },
  heroSub:       { fontSize: 13, color: 'rgba(255,255,255,0.88)', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  /* Section heading */
  sectionHead:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14, gap: 10 },
  sectionHeadLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  sectionHeadText: { fontSize: 14, fontWeight: '800', color: '#1a1a1a', textAlign: 'center' },

  /* Benefits grid */
  grid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 20 },
  card:          { width: '30.5%', backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardIcon:      { fontSize: 26, marginBottom: 6 },
  cardTitle:     { fontSize: 11, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 3 },
  cardSub:       { fontSize: 9, color: '#888', textAlign: 'center', lineHeight: 13 },

  /* Comparison table */
  table:         { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  tableTitle:    { fontSize: 14, fontWeight: '800', color: '#1a1a1a', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tableHeader:   { flexDirection: 'row', backgroundColor: '#f8f8f8', paddingHorizontal: 12, paddingVertical: 10 },
  tableRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  tableCol:      { flex: 1, fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' },
  tableColHead:  { fontSize: 11, fontWeight: '800', color: '#666' },
  tableColGreen: { color: '#2d7a2d', fontWeight: '700' },

  /* Story */
  storyCard:     { marginHorizontal: 12, borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  storyImg:      { width: '100%', height: 160 },
  storyBody:     { padding: 16 },
  storyTitle:    { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 8 },
  storyText:     { fontSize: 13, color: '#555', lineHeight: 21 },
  storyBadges:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  badge:         { backgroundColor: '#f0fff0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#c8e6c9' },
  badgeText:     { fontSize: 12, fontWeight: '700', color: '#2d7a2d' },
});

const CATEGORIES = [
  { key: 'All',     icon: '🐔', label: 'All' },
  { key: 'chicken', icon: '🍗', label: 'Chicken' },
  { key: 'eggs',    icon: '🥚', label: 'Eggs' },
  { key: 'protein', icon: '💪', label: 'Protein Intake' },
];

/* ── Memoized ProductCard — never re-renders unless its own props change ── */
const ProductCard = memo(({ item, qty, onAdd, onIncrease, onDecrease, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={item.isProtein ? 0.85 : 1}>
    <View style={styles.imageWrap}>
      <Image
        source={{ uri: item.image || IMG_CURRY_CUT }}
        style={styles.productImage}
        resizeMode="cover"
        defaultSource={{ uri: IMG_CURRY_CUT }}
      />
      {item.isHit && (
        <View style={styles.hitBadge}><Text style={styles.hitBadgeText}>⭐ Best Seller</Text></View>
      )}
    </View>
    <View style={styles.productInfo}>
      <Text style={styles.productTitle} numberOfLines={2}>{item.name}</Text>
      {item.subTitle && <Text style={styles.subTitle} numberOfLines={1}>{item.subTitle}</Text>}
      {item.isProtein && <Text style={styles.proteinTag}>🥗 High Protein · Low Fat</Text>}
      <Text style={styles.productMeta} numberOfLines={1}>{item.weight || item.unit || ''}</Text>
      <Text style={styles.deliveryTime}>
        <Ionicons name="time-outline" size={10} color="#2d6a2d" /> {item.delivery || 'Delivery in 30 mins'}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.currentPrice}>₹{item.price}</Text>
        {item.originalPrice && item.originalPrice !== item.price
          ? <Text style={styles.originalPrice}>₹{item.originalPrice}</Text> : null}
        {item.discount
          ? <Text style={styles.discountLabel}>{item.discount}% off</Text> : null}
      </View>
      {qty === 0 ? (
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>{item.isProtein ? 'Order Now' : 'Add +'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyControls}>
          <TouchableOpacity style={styles.qtyBtn} onPress={onDecrease}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={onIncrease}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </TouchableOpacity>
));

/* ── Memoized SliderCard ─────────────────────────────────────── */
const SliderCard = memo(({ item, qty, onAdd, onIncrease, onDecrease, onPress }) => (
  <TouchableOpacity style={styles.sliderCard} onPress={onPress} activeOpacity={0.9}>
    <Image source={{ uri: item.image }} style={styles.sliderImage} resizeMode="cover" />
    <View style={styles.sliderDiscountBadge}>
      <Text style={styles.sliderDiscountText}>{item.discount}% off</Text>
    </View>
    <Text style={styles.sliderName} numberOfLines={2}>{item.name}</Text>
    <Text style={styles.sliderWeight} numberOfLines={1}>{(item.weight || '').split('|')[0].trim()}</Text>
    <View style={styles.sliderPriceRow}>
      <Text style={styles.sliderPrice}>₹{item.price}</Text>
      {item.originalPrice ? <Text style={styles.sliderOriginal}>₹{item.originalPrice}</Text> : null}
    </View>
    {qty === 0 ? (
      <TouchableOpacity style={styles.sliderAddBtn} onPress={onAdd}>
        <Text style={styles.sliderAddBtnText}>Add +</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.sliderQty}>
        <TouchableOpacity style={styles.sliderQtyBtn} onPress={onDecrease}>
          <Text style={styles.sliderQtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.sliderQtyNum}>{qty}</Text>
        <TouchableOpacity style={styles.sliderQtyBtn} onPress={onIncrease}>
          <Text style={styles.sliderQtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    )}
  </TouchableOpacity>
));

/* ── Stable footer — defined once at module level, never recreated ── */
const LIST_FOOTER = <BenefitsSection />;

export default function HomeScreen({ navigation, route }) {
  const { user }                                  = useAuth();
  const { addItem, itemCount, items, updateQty }  = useCart();
  const { selectedAddress, setSelectedAddress }   = useAddress();
  const [products, setProducts]                   = useState([]);
  const [filtered, setFiltered]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [refreshing, setRefreshing]               = useState(false);
  const [search, setSearch]                       = useState('');
  const [category, setCategory]                   = useState('All');

  // ── Read filterCategory param sent from Categories tab ──
  // useFocusEffect fires every time this tab comes into view
  useFocusEffect(
    useCallback(() => {
      const incoming = route?.params?.filterCategory;
      if (incoming) {
        setCategory(incoming);
        setSearch('');
        navigation.setParams({ filterCategory: null });
      }
    }, [route?.params?.filterCategory])
  );


  const fetchProducts = useCallback(async () => {
    try {
      const res  = await productAPI.getAll();
      const list = res.products || res || [];
      if (list.length > 0) {
        setProducts(list);
        setFiltered(list);
      } else {
        setProducts(FALLBACK_PRODUCTS);
        setFiltered(FALLBACK_PRODUCTS);
      }
    } catch {
      // Use fallback if API fails
      setProducts(FALLBACK_PRODUCTS);
      setFiltered(FALLBACK_PRODUCTS);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let list = products;
    if (category !== 'All') list = list.filter(p => (p.category || '').toLowerCase() === category);
    if (search.trim())       list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [search, category, products]);

  // ── Stable getQty — only recalculates when cart items change ──
  const getQty = useCallback((id) => {
    const found = items.find(i => String(i.id || i._id) === String(id));
    return found ? found.qty : 0;
  }, [items]);

  // ── Auth guard ──
  const requireLogin = useCallback((action) => {
    if (!user) {
      Alert.alert(
        '🔒 Login Required',
        'Please login to add items to your cart and place orders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login Now', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    action();
  }, [user, navigation]);

  // ── Stable renderProduct — only changes when cart or auth changes ──
  const renderProduct = useCallback(({ item, index }) => {
    const id  = item._id || item.id || index;
    const qty = getQty(id);
    return (
      <ProductCard
        item={item}
        qty={qty}
        onAdd={() => requireLogin(() => addItem({ ...item, id }))}
        onIncrease={() => updateQty(id, qty + 1)}
        onDecrease={() => updateQty(id, qty - 1)}
        onPress={() => {
          if (item.isProtein) navigation.navigate('ProteinDetail', { item });
          else navigation.navigate('ProductDetail', { item });
        }}
      />
    );
  }, [getQty, requireLogin, addItem, updateQty, navigation]);

  // ── Best sellers — filtered by selected category ──
  const bestSellers = useMemo(() => {
    const hits = products.filter(p => p.isHit);
    if (category === 'All') return hits;
    return hits.filter(p => (p.category || '').toLowerCase() === category);
  }, [products, category]);

  const renderSlider = useCallback(({ item, index }) => {
    const id  = item._id || item.id || `s_${index}`;
    const qty = getQty(id);
    return (
      <SliderCard
        item={item}
        qty={qty}
        onAdd={() => requireLogin(() => addItem({ ...item, id }))}
        onIncrease={() => updateQty(id, qty + 1)}
        onDecrease={() => updateQty(id, qty - 1)}
        onPress={() => {
          if (item.isProtein) navigation.navigate('ProteinDetail', { item });
          else navigation.navigate('ProductDetail', { item });
        }}
      />
    );
  }, [getQty, requireLogin, addItem, updateQty, navigation]);

  const categoryLabel = useMemo(() => {
    if (category === 'All')     return 'All Products';
    if (category === 'chicken') return '🍗 Chicken';
    if (category === 'eggs')    return '🥚 Eggs';
    if (category === 'protein') return '💪 Protein Intake';
    return category;
  }, [category]);

  const ListHeader = useCallback(() => (
    <>
      {bestSellers.length > 0 && (
        <View style={styles.sliderSection}>
          <Text style={styles.sliderTitle}>🔥 Best Sellers</Text>
          <FlatList
            horizontal
            data={bestSellers}
            keyExtractor={(item, i) => String(item._id || item.id || i)}
            renderItem={renderSlider}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
          />
        </View>
      )}
      <Text style={styles.sectionTitle}>{categoryLabel}</Text>
    </>
  ), [bestSellers, renderSlider, categoryLabel]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Pure Desi Country Chicken</Text>
          <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>GoNaatu</Text></View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color="#333" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{itemCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Location bar (tappable) ── */}
      <TouchableOpacity
        style={styles.locationBar}
        onPress={() => navigation.navigate('AddressList', {
          pickMode: true,
          onSelect: (addr) => setSelectedAddress(addr),
        })}
        activeOpacity={0.75}
      >
        <Ionicons name="location-sharp" size={14} color={COLORS.primary} />
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationLabel}>
            {selectedAddress?.label || 'Delivering to'}
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedAddress
              ? (selectedAddress.flatNo ? `${selectedAddress.flatNo}, ` : '') + selectedAddress.address
              : 'Select your delivery location'}
          </Text>
        </View>
        <View style={styles.locationRight}>
          <View style={styles.deliveryBadge}>
            <Ionicons name="bicycle-outline" size={10} color={COLORS.primary} />
            <Text style={styles.deliveryBadgeText}> 30 min</Text>
          </View>
          <Ionicons name="chevron-down" size={14} color="#999" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>

      {/* ── Search ── */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={15} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder='Search "chicken curry cut"'
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={15} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Category pills ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catPill, category === c.key && styles.catPillActive]}
            onPress={() => setCategory(c.key)}
          >
            <Text style={styles.catIcon}>{c.icon}</Text>
            <Text style={[styles.catLabel, category === c.key && styles.catLabelActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Flash Sale Banner ── */}
      <FlashBanner />

      {/* ── Product list ── */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item._id || item.id || i)}
          renderItem={renderProduct}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={LIST_FOOTER}
          contentContainerStyle={styles.listContent}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          initialNumToRender={5}
          windowSize={10}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchProducts(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🐔</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      {/* ── Cart FAB ── */}
      {itemCount > 0 && (
        <TouchableOpacity style={styles.cartFAB} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartFABLeft}>{itemCount} item{itemCount > 1 ? 's' : ''} added</Text>
          <Text style={styles.cartFABRight}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f8f8f8' },

  /* Header */
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  logoRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  logoText:         { fontSize: 13, fontWeight: '800', color: COLORS.primary, flexShrink: 1 },
  logoBadge:        { backgroundColor: COLORS.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20, flexShrink: 0 },
  logoBadgeText:    { fontSize: 9, color: '#fff', fontWeight: '700' },
  headerIcons:      { flexDirection: 'row', gap: 14 },
  iconBtn:          { position: 'relative', padding: 4 },
  cartBadge:        { position: 'absolute', top: -2, right: -4, backgroundColor: COLORS.secondary, borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText:    { fontSize: 9, color: '#fff', fontWeight: '800' },

  /* Location */
  locationBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 8 },
  locationTextWrap:  { flex: 1 },
  locationLabel:     { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  locationText:      { fontSize: 12, color: '#333', fontWeight: '600', marginTop: 1 },
  locationRight:     { flexDirection: 'row', alignItems: 'center' },
  deliveryBadge:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  deliveryBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },

  /* Search */
  searchBox:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 10, marginBottom: 6, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 8 },
  searchInput:      { flex: 1, fontSize: 13, color: '#1a1a1a' },

  /* Category pills */
  catScroll:        { maxHeight: 44, marginBottom: 6 },
  catContent:       { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  catPill:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  catPillActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catIcon:          { fontSize: 14 },
  catLabel:         { fontSize: 12, fontWeight: '600', color: '#333' },
  catLabelActive:   { color: '#fff' },

  /* Best Sellers slider */
  sliderSection:    { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 12 },
  sliderTitle:      { fontSize: 14, fontWeight: '800', color: '#1a1a1a', paddingHorizontal: 16, marginBottom: 10 },
  sliderCard:       { width: 140, backgroundColor: '#f9f9f9', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: '#eee' },
  sliderImage:      { width: '100%', height: 100, borderRadius: 10, backgroundColor: '#f0f0f0', marginBottom: 6 },
  sliderDiscountBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: '#e74c3c', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  sliderDiscountText:  { fontSize: 9, color: '#fff', fontWeight: '700' },
  sliderName:       { fontSize: 11, fontWeight: '700', color: '#1a1a1a', marginBottom: 2, minHeight: 28 },
  sliderWeight:     { fontSize: 10, color: '#888', fontWeight: '500', marginBottom: 4 },
  sliderPriceRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  sliderPrice:      { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  sliderOriginal:   { fontSize: 10, color: '#999', textDecorationLine: 'line-through' },
  sliderAddBtn:     { backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 5, alignItems: 'center' },
  sliderAddBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sliderQty:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderQtyBtn:     { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  sliderQtyBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  sliderQtyNum:     { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },

  /* Section title */
  sectionTitle:     { fontSize: 14, fontWeight: '800', color: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8 },

  /* Product list */
  listContent:      { paddingBottom: 0 },

  /* Product card — horizontal, exact web layout */
  card:             { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginHorizontal: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 12 },
  imageWrap:        { position: 'relative', flexShrink: 0 },
  productImage:     { width: 90, height: 90, borderRadius: 12, backgroundColor: '#f0f0f0' },
  hitBadge:         { position: 'absolute', bottom: 4, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: 'center', paddingVertical: 2 },
  hitBadgeText:     { fontSize: 8, color: '#fff', fontWeight: '700' },
  proteinBadge:     { position: 'absolute', top: 4, right: 4, backgroundColor: '#7c3aed', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  proteinBadgeText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  proteinTag:       { fontSize: 10, color: '#7c3aed', fontWeight: '700', marginBottom: 4 },
  subTitle:         { fontSize: 10, color: '#888', marginBottom: 2, fontStyle: 'italic' },
  productInfo:      { flex: 1 },
  productTitle:     { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  productMeta:      { fontSize: 10, color: '#666', marginBottom: 2 },
  deliveryTime:     { fontSize: 10, color: COLORS.primary, marginBottom: 6 },
  priceRow:         { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  currentPrice:     { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  originalPrice:    { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  discountLabel:    { fontSize: 10, color: '#e74c3c', fontWeight: '600' },
  addBtn:           { backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 6, borderRadius: 25, alignSelf: 'flex-start' },
  addBtnText:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  qtyControls:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:           { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText:       { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  qtyNum:           { fontSize: 14, fontWeight: '800', color: '#1a1a1a', minWidth: 20, textAlign: 'center' },

  /* Empty */
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 15, color: '#666', marginTop: 12 },

  /* Cart FAB */
  cartFAB:          { position: 'absolute', bottom: 66, left: 12, right: 12, backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  cartFABLeft:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  cartFABRight:     { color: '#fff', fontSize: 13, fontWeight: '800' },
});
