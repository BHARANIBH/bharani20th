import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Dimensions, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../../config';

const { width } = Dimensions.get('window');

/* ─── Per-category metadata ─────────────────────────────────── */
const CATEGORY_META = {
  chicken: {
    badge:       '🐔 Pure Desi Country Chicken',
    badgeColor:  '#e8f5e8',
    badgeText:   COLORS.primary,
    qualityLine: '✅ Antibiotic Free · Farm Raised · FSSAI Certified',
    tags:        ['Bone-in', 'Curry Cut', 'No Hormones'],
    nutrition:   [
      { icon: '💪', label: 'Protein',  val: '27g',  color: '#7c3aed' },
      { icon: '🔥', label: 'Calories', val: '165',  color: '#f59e0b' },
      { icon: '💧', label: 'Fat',      val: '3.6g', color: '#ef4444' },
      { icon: '🌾', label: 'Carbs',    val: '0g',   color: '#10b981' },
    ],
    whyPoints: [
      '🐓 Free-range desi breed — not broiler',
      '🌿 Zero antibiotics, zero hormones',
      '❤️ Lower cholesterol than broiler chicken',
      '😋 Richer, authentic desi flavour',
      '🧊 Processed fresh, never frozen',
    ],
  },
  eggs: {
    badge:       '🥚 Desi Free-Range Eggs',
    badgeColor:  '#fffde7',
    badgeText:   '#b7791f',
    qualityLine: '✅ Free Range · Rich in Omega-3 · No Artificial Feed',
    tags:        ['Free Range', 'Desi Breed', 'Rich Yolk'],
    nutrition:   [
      { icon: '💪', label: 'Protein',  val: '6g',   color: '#7c3aed' },
      { icon: '🔥', label: 'Calories', val: '70',   color: '#f59e0b' },
      { icon: '💧', label: 'Fat',      val: '5g',   color: '#ef4444' },
      { icon: '🌾', label: 'Carbs',    val: '0.6g', color: '#10b981' },
    ],
    whyPoints: [
      '🌾 Hens raised on natural grain feed',
      '🥗 Higher omega-3 than commercial eggs',
      '💛 Deep golden yolk — full of nutrients',
      '🏡 Sourced directly from free-range farms',
      '🧼 Hand-washed & hygienically packed',
    ],
  },
  protein: {
    badge:       '💪 Premium Protein Combo',
    badgeColor:  '#f3e5f5',
    badgeText:   '#7c3aed',
    qualityLine: '✅ High Protein · Low Fat · Nutritionist Approved',
    tags:        ['High Protein', 'Low Fat', 'Balanced Meal'],
    nutrition:   [
      { icon: '💪', label: 'Protein',  val: '41g',  color: '#7c3aed' },
      { icon: '🔥', label: 'Calories', val: '280',  color: '#f59e0b' },
      { icon: '💧', label: 'Fat',      val: '8g',   color: '#ef4444' },
      { icon: '🌾', label: 'Carbs',    val: '6g',   color: '#10b981' },
    ],
    whyPoints: [
      '🏋️ Perfect post-workout recovery meal',
      '🍗 100g desi chicken breast — 31g protein',
      '🥚 3 free-range eggs — 18g protein',
      '🌱 Sprouts & greens — fibre & antioxidants',
      '🩺 Doctor & dietitian recommended',
    ],
  },
};

/* ─── Product descriptions ──────────────────────────────────── */
const DESCRIPTIONS = {
  1:  'Our Chicken Curry Cut - Small Pieces is hand-cut from pure desi country chicken, giving you 12–18 tender bone-in pieces. Each piece absorbs masala deeply for that authentic homemade curry flavour. Raised free-range without antibiotics or growth hormones — clean, fresh, and full of natural taste. Perfect for traditional Indian gravies, pepper fry, and everyday cooking.',
  2:  'Our Chicken Bites are perfectly trimmed boneless cubes, 100% free of antibiotic residues. At just 250g with 20–25 bite-sized pieces, they cook fast and absorb any marinade beautifully. Great for stir-fries, quick curries, rolls, or snack platters. Trusted by health-conscious home cooks across the city.',
  3:  'Premium Chicken Leg Curry Cut brings you the most flavourful part of the chicken — a perfect mix of juicy thigh pieces and two meaty drumsticks. The bone-in cut releases rich stock as it slow-cooks, giving your curry a depth that boneless chicken simply cannot match. Serves 2–3 people generously.',
  13: 'Our 1 kg Chicken Curry Cut Large Pack is the family favourite — a full kilo of fresh, properly cleaned bone-in desi chicken pieces. Mixed cuts include leg, thigh, breast, and wing portions. Ideal for biryani, large-batch curries, or stocking your fridge for the week. No wastage, no odour, just pure fresh chicken.',
  5:  'Our Desi Country Eggs 6-Pack comes from free-range hens raised on natural grain feed — no cages, no artificial feed. The yolk is deep golden-orange, a clear sign of superior nutrition. Each egg is rich in omega-3, vitamin D, and choline. Perfect boiled, fried, scrambled, or baked. Taste the difference real desi eggs make.',
  6:  'Our Desi Country Eggs Dozen gives you the best value on premium free-range eggs. Hens raised stress-free, outdoors, on natural grain. The result is eggs that taste richer, cook better, and nourish more than standard commercial eggs. Stock up and power your breakfasts all week long without compromise.',
  7:  'The 100g Protein Power Combo is your complete high-protein meal in one pack — 100g boneless desi chicken breast (31g protein), 3 free-range eggs (18g protein), and a fresh sprouts mix (4g protein). That\'s 41g of clean protein with minimal fat. No fillers, no preservatives. Ideal for gym-goers, athletes, and anyone serious about nutrition.',
  8:  'Start your day with our Morning Protein Pack — scientifically balanced for maximum morning fuel. 100g chicken breast provides 31g protein, 4 desi eggs add 24g more, and a fresh greens mix delivers fibre and antioxidants. Together, 47g+ of protein with essential vitamins, omega-3, and zero junk. The smartest breakfast you can order.',
};

const DEFAULT_DESC = 'Sourced directly from trusted desi farms, this product is raised the natural way — free-range, antibiotic-free, and full of authentic flavour. We believe you deserve clean, honest food with no shortcuts.';

/* ─── Main Screen ───────────────────────────────────────────── */
export default function ProductDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  const { addItem, items, updateQty } = useCart();
  const { user } = useAuth();

  const category = (item?.category || 'chicken').toLowerCase();
  const meta      = CATEGORY_META[category] || CATEGORY_META.chicken;
  const desc      = DESCRIPTIONS[item?.id] || DEFAULT_DESC;
  const id        = item?._id || item?.id;
  const cartItem  = items.find(i => String(i.id || i._id) === String(id));
  const qty       = cartItem ? cartItem.qty : 0;

  // Image gallery — use main image + 2 variants
  const fallbackByCategory = {
    chicken: 'https://www.bbassets.com/media/uploads/p/l/40048898_5-fresho-chicken-curry-cut-without-skin-antibiotic-residue-free.jpg',
    eggs:    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80',
    protein: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  };
  const secondImg = {
    chicken: 'https://static.wixstatic.com/media/8bcb0b_8a7a98ece34a495b82faeef4105c11b5~mv2.png/v1/fit/w_500,h_500,q_90/file.png',
    eggs:    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80',
    protein: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  };
  // 3rd slide — real chicken from Home & About hero banner
  const thirdImg = {
    chicken: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=90',
    eggs:    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80',
    protein: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
  };
  const images = [
    item?.image || fallbackByCategory[category] || fallbackByCategory.chicken,
    secondImg[category] || secondImg.chicken,
    thirdImg[category]  || thirdImg.chicken,
  ];

  const [activeImg, setActiveImg] = useState(0);

  const requireLogin = (action) => {
    if (!user) {
      Alert.alert('🔒 Login Required', 'Please login to add items to your cart.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    action();
  };

  // Parse weight display info
  const weightParts = (item?.weight || '').split('|').map(s => s.trim());

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Top nav ── */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="search-outline" size={22} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Image Gallery ── */}
        <View style={styles.galleryWrap}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={e => setActiveImg(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item: uri }) => (
              <Image source={{ uri }} style={styles.heroImage} resizeMode="cover" />
            )}
          />
          {/* Dots */}
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── Product Info ── */}
        <View style={styles.infoCard}>
          {/* Name */}
          <Text style={styles.productName}>{item?.name || 'Product'}</Text>

          {/* Tags row */}
          <View style={styles.tagRow}>
            {weightParts.map((t, i) => (
              <Text key={i} style={styles.tagChip}>{t}</Text>
            ))}
          </View>

          {/* Quality badge */}
          <View style={[styles.qualityBadge, { backgroundColor: meta.badgeColor }]}>
            <Text style={[styles.qualityBadgeText, { color: meta.badgeText }]}>
              {meta.qualityLine}
            </Text>
          </View>

          {/* Category badge */}
          <View style={[styles.catBadge, { backgroundColor: meta.badgeColor }]}>
            <Text style={[styles.catBadgeText, { color: meta.badgeText }]}>{meta.badge}</Text>
          </View>
        </View>

        {/* ── Info chips (weight / pieces / serves) ── */}
        <View style={styles.chipsRow}>
          {weightParts.slice(0, 3).map((chip, i) => {
            const icons = ['scale-outline', 'restaurant-outline', 'people-outline'];
            return (
              <View key={i} style={styles.chip}>
                <Ionicons name={icons[i] || 'information-circle-outline'} size={16} color="#666" />
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this product</Text>
          <Text style={styles.descText}>{desc}</Text>
        </View>

        {/* ── Nutrition ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
          <View style={styles.nutritionRow}>
            {meta.nutrition.map((n, i) => (
              <View key={i} style={styles.nutritionBox}>
                <Text style={styles.nutritionIcon}>{n.icon}</Text>
                <Text style={[styles.nutritionVal, { color: n.color }]}>{n.val}</Text>
                <Text style={styles.nutritionLabel}>{n.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Why Choose ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why GoNaatu?</Text>
          <View style={styles.whyCard}>
            {meta.whyPoints.map((p, i) => (
              <Text key={i} style={styles.whyPoint}>{p}</Text>
            ))}
          </View>
        </View>

        {/* ── Delivery info ── */}
        <View style={styles.deliveryRow}>
          <Ionicons name="bicycle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.deliveryText}>
            {item?.delivery || 'Delivery in 30 mins'} · Packed fresh daily
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Price + Add/Qty Bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.priceCol}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item?.price}</Text>
            {item?.originalPrice && item.originalPrice !== item.price && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
          </View>
          {item?.discount ? (
            <Text style={styles.discountText}>{item.discount}% off · Incl. taxes</Text>
          ) : null}
        </View>

        {qty === 0 ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => requireLogin(() => addItem({ ...item, id }))}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>Add  +</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyBox}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(id, qty - 1)}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(id, qty + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f8f8' },

  /* Top nav */
  topNav:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, zIndex: 10 },
  navBtn:      { padding: 6 },

  /* Gallery */
  galleryWrap: { backgroundColor: '#fff' },
  heroImage:   { width, height: 300 },
  dots:        { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotActive:   { backgroundColor: COLORS.primary, width: 20 },

  /* Info card */
  infoCard:    { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  productName: { fontSize: 22, fontWeight: '900', color: '#1a1a1a', marginBottom: 8, lineHeight: 28 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagChip:     { fontSize: 12, color: '#666', fontWeight: '600' },
  qualityBadge:{ borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  qualityBadgeText: { fontSize: 12, fontWeight: '700' },
  catBadge:    { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 4 },
  catBadgeText:{ fontSize: 12, fontWeight: '800' },

  /* Chips */
  chipsRow:    { flexDirection: 'row', backgroundColor: '#fff', marginTop: 2, paddingHorizontal: 16, paddingVertical: 14, gap: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  chip:        { flex: 1, alignItems: 'center', gap: 4 },
  chipText:    { fontSize: 11, color: '#444', fontWeight: '700', textAlign: 'center' },

  /* Section */
  section:     { backgroundColor: '#fff', marginTop: 8, paddingHorizontal: 16, paddingVertical: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: '900', color: '#1a1a1a', marginBottom: 12 },

  /* Description */
  descText:    { fontSize: 14, color: '#555', lineHeight: 24 },

  /* Nutrition */
  nutritionRow:{ flexDirection: 'row', justifyContent: 'space-around' },
  nutritionBox:{ alignItems: 'center', gap: 4 },
  nutritionIcon:{ fontSize: 22 },
  nutritionVal: { fontSize: 18, fontWeight: '900' },
  nutritionLabel: { fontSize: 10, color: '#888', fontWeight: '600' },

  /* Why */
  whyCard:     { backgroundColor: '#f8fff8', borderRadius: 14, padding: 14, gap: 10 },
  whyPoint:    { fontSize: 13, color: '#2d6a2d', fontWeight: '600', lineHeight: 20 },

  /* Delivery */
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, backgroundColor: '#e8f5e8', borderRadius: 12, padding: 12 },
  deliveryText:{ fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  /* Bottom bar */
  bottomBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#eee', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 8 },
  priceCol:    { gap: 2 },
  priceRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price:       { fontSize: 26, fontWeight: '900', color: '#1a1a1a' },
  originalPrice:{ fontSize: 15, color: '#aaa', textDecorationLine: 'line-through' },
  discountText:{ fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  addBtn:      { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  addBtnText:  { color: '#fff', fontSize: 16, fontWeight: '900' },
  qtyBox:      { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#f0f9f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.primary },
  qtyBtn:      { padding: 2 },
  qtyBtnText:  { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  qtyNum:      { fontSize: 18, fontWeight: '900', color: '#1a1a1a', minWidth: 24, textAlign: 'center' },
});
