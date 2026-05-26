import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, FlatList, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../config';

const { width } = Dimensions.get('window');

/* ── Slide data — one per category ──────────────────────────── */
const SLIDES = [
  {
    key:      'chicken',
    title:    'Pure Desi Country Chicken',
    sub:      'Farm fresh · Zero antibiotics · Rich flavour',
    tag:      '🍗 Fresh Today',
    tagColor: '#2d7a2d',
    tagBg:    '#e8f5e8',
    image:    'https://www.bbassets.com/media/uploads/p/l/40048898_5-fresho-chicken-curry-cut-without-skin-antibiotic-residue-free.jpg',
    overlay:  'rgba(0,40,0,0.45)',
    btnText:  'Shop Chicken →',
  },
  {
    key:      'eggs',
    title:    'Desi Free-Range Eggs',
    sub:      'Deep golden yolk · Omega-3 rich · No cages',
    tag:      '🥚 Free Range',
    tagColor: '#b7791f',
    tagBg:    '#fffde7',
    image:    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
    overlay:  'rgba(60,40,0,0.45)',
    btnText:  'Shop Eggs →',
  },
  {
    key:      'protein',
    title:    '100g Protein Combos',
    sub:      'Chicken + Eggs + Sprouts · 41g protein per meal',
    tag:      '💪 Premium',
    tagColor: '#7c3aed',
    tagBg:    '#f3e5f5',
    image:    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    overlay:  'rgba(30,0,60,0.45)',
    btnText:  'View Combos →',
  },
];

/* ── Category cards ──────────────────────────────────────────── */
const CATEGORY_LIST = [
  {
    key: 'chicken', label: 'Chicken',       sub: 'Fresh country chicken cuts',
    emoji: '🍗',
    image: 'https://www.bbassets.com/media/uploads/p/l/40048898_5-fresho-chicken-curry-cut-without-skin-antibiotic-residue-free.jpg',
    color: '#fff3e0', border: '#ffcc80',
  },
  {
    key: 'eggs',    label: 'Eggs',          sub: 'Desi free-range eggs',
    emoji: '🥚',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
    color: '#fffde7', border: '#fff176',
  },
  {
    key: 'protein', label: 'Protein Intake',sub: '100g combos · High protein meals',
    emoji: '💪',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
    color: '#f3e5f5', border: '#ce93d8', isPremium: true,
  },
];

/* ── Banner Slider ───────────────────────────────────────────── */
function BannerSlider({ navigation }) {
  const flatRef  = useRef(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeRef.current + 1) % SLIDES.length;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      activeRef.current = next;
      setActive(next);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
    }
  };

  return (
    <View style={sl.wrap}>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.key}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={sl.slide}>
            <Image source={{ uri: item.image }} style={sl.image} resizeMode="cover" />
            <View style={[sl.overlay, { backgroundColor: item.overlay }]} />
            {/* Tag */}
            <View style={[sl.tag, { backgroundColor: item.tagBg }]}>
              <Text style={[sl.tagText, { color: item.tagColor }]}>{item.tag}</Text>
            </View>
            {/* Text */}
            <View style={sl.textWrap}>
              <Text style={sl.title}>{item.title}</Text>
              <Text style={sl.sub}>{item.sub}</Text>
              <TouchableOpacity
                style={sl.btn}
                onPress={() => navigation.navigate('Home', { filterCategory: item.key })}
                activeOpacity={0.85}
              >
                <Text style={sl.btnText}>{item.btnText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      {/* Dots */}
      <View style={sl.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[sl.dot, i === active && sl.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap:     { height: 220, backgroundColor: '#000' },
  slide:    { width, height: 220, position: 'relative' },
  image:    { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay:  { ...StyleSheet.absoluteFillObject },
  tag:      { position: 'absolute', top: 16, left: 16, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagText:  { fontSize: 11, fontWeight: '800' },
  textWrap: { position: 'absolute', bottom: 28, left: 16, right: 16 },
  title:    { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  sub:      { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 12, lineHeight: 18 },
  btn:      { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, alignSelf: 'flex-start' },
  btnText:  { fontSize: 13, fontWeight: '800', color: '#1a1a1a' },
  dots:     { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive:{ width: 20, backgroundColor: '#fff' },
});

/* ── Main Screen ─────────────────────────────────────────────── */
export default function CategoryScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <Text style={styles.headerSub}>What are you looking for?</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Auto-sliding banner ── */}
        <BannerSlider navigation={navigation} />

        <View style={styles.content}>

          {/* ── Category cards ── */}
          {CATEGORY_LIST.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.card, { backgroundColor: cat.color, borderColor: cat.border }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Home', { filterCategory: cat.key })}
            >
              <View style={styles.cardLeft}>
                {cat.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>⭐ PREMIUM</Text>
                  </View>
                )}
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catSub}>{cat.sub}</Text>
                <View style={styles.shopBtn}>
                  <Text style={styles.shopBtnText}>Shop Now →</Text>
                </View>
              </View>
              <Image source={{ uri: cat.image }} style={styles.catImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}

          {/* ── Protein Info Banner ── */}
          <View style={styles.proteinBanner}>
            <Text style={styles.proteinBannerTitle}>💪 Why Protein Intake Matters?</Text>
            <View style={styles.proteinFacts}>
              {[
                { icon: '🍗', label: '100g Chicken Breast', val: '31g Protein' },
                { icon: '🥚', label: '1 Desi Egg',          val: '6g Protein'  },
                { icon: '🌱', label: 'Sprouts (50g)',        val: '4g Protein'  },
              ].map((f, i) => (
                <View key={i} style={styles.factRow}>
                  <Text style={styles.factIcon}>{f.icon}</Text>
                  <Text style={styles.factLabel}>{f.label}</Text>
                  <Text style={styles.factVal}>{f.val}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.proteinShopBtn}
              onPress={() => navigation.navigate('Home', { filterCategory: 'protein' })}
            >
              <Text style={styles.proteinShopBtnText}>View Protein Combos →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#f8f8f8' },
  header:  { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1a1a1a' },
  headerSub:   { fontSize: 13, color: '#888', marginTop: 2 },

  content: { padding: 14, gap: 14 },

  card: {
    borderRadius: 20, borderWidth: 1.5, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', height: 150, paddingLeft: 20,
  },
  cardLeft:         { flex: 1 },
  premiumBadge:     { backgroundColor: '#7c3aed', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  premiumBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  catEmoji:         { fontSize: 32, marginBottom: 4 },
  catLabel:         { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 2 },
  catSub:           { fontSize: 11, color: '#666', marginBottom: 10 },
  shopBtn:          { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start' },
  shopBtnText:      { fontSize: 12, fontWeight: '700', color: '#fff' },
  catImage:         { width: 140, height: '100%' },

  proteinBanner:      { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  proteinBannerTitle: { fontSize: 15, fontWeight: '900', color: '#1a1a1a', marginBottom: 14 },
  proteinFacts:       { gap: 10, marginBottom: 16 },
  factRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8f8f8', borderRadius: 12, padding: 10 },
  factIcon:           { fontSize: 22, width: 32, textAlign: 'center' },
  factLabel:          { flex: 1, fontSize: 13, fontWeight: '600', color: '#333' },
  factVal:            { fontSize: 13, fontWeight: '800', color: '#7c3aed' },
  proteinShopBtn:     { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  proteinShopBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
