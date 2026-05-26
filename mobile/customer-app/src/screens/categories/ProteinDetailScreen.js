import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../../config';

const { width } = Dimensions.get('window');

const NUTRITION = [
  { label: 'Protein',      val: '41g',   color: '#7c3aed', icon: '💪' },
  { label: 'Calories',     val: '280',   color: '#f59e0b', icon: '🔥' },
  { label: 'Fat',          val: '8g',    color: '#ef4444', icon: '💧' },
  { label: 'Carbs',        val: '6g',    color: '#10b981', icon: '🌾' },
];

const INCLUDES = [
  { icon: '🍗', item: '100g Chicken Breast',  detail: 'Boneless · Antibiotic free · Desi breed', protein: '31g protein' },
  { icon: '🥚', item: '3 Desi Country Eggs',  detail: 'Free range · Rich in omega-3',            protein: '18g protein' },
  { icon: '🌱', item: 'Fresh Sprouts (50g)',  detail: 'Mixed sprouts · High fibre',               protein: '4g protein' },
  { icon: '🥗', item: 'Greens Mix (30g)',     detail: 'Spinach + methi · Antioxidants',           protein: '2g protein' },
];

const BENEFITS = [
  '✅ Perfect post-workout meal',
  '✅ Zero artificial additives',
  '✅ Supports muscle building',
  '✅ Low calorie, high satiety',
  '✅ Doctor & nutritionist approved',
];

export default function ProteinDetailScreen({ route, navigation }) {
  const { item } = route.params || {};
  const { addItem } = useCart();
  const { user }   = useAuth();

  const handleOrder = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    addItem({ ...item, id: item.id || item._id });
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero Image */}
      <View style={styles.hero}>
        <Image
          source={{ uri: item?.image || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Premium badge */}
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>⭐ PREMIUM PROTEIN</Text>
        </View>

        {/* Hero text */}
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{item?.name || '100g Protein Power Combo'}</Text>
          <Text style={styles.heroSub}>{item?.weight || '100g Chicken Breast + 3 Eggs + Sprouts'}</Text>
          <View style={styles.heroPriceRow}>
            <Text style={styles.heroPrice}>₹{item?.price || 149}</Text>
            {item?.originalPrice && (
              <Text style={styles.heroOriginal}>₹{item.originalPrice}</Text>
            )}
            {item?.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{item.discount}% OFF</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Nutrition Strip */}
        <View style={styles.nutritionStrip}>
          {NUTRITION.map((n, i) => (
            <View key={i} style={styles.nutritionItem}>
              <Text style={styles.nutritionIcon}>{n.icon}</Text>
              <Text style={[styles.nutritionVal, { color: n.color }]}>{n.val}</Text>
              <Text style={styles.nutritionLabel}>{n.label}</Text>
            </View>
          ))}
        </View>

        {/* What's Included */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 What's Included</Text>
          {INCLUDES.map((inc, i) => (
            <View key={i} style={styles.includeRow}>
              <Text style={styles.includeIcon}>{inc.icon}</Text>
              <View style={styles.includeInfo}>
                <Text style={styles.includeItem}>{inc.item}</Text>
                <Text style={styles.includeDetail}>{inc.detail}</Text>
              </View>
              <View style={styles.proteinTag}>
                <Text style={styles.proteinTagText}>{inc.protein}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Why This Combo?</Text>
          <View style={styles.benefitsCard}>
            {BENEFITS.map((b, i) => (
              <Text key={i} style={styles.benefitText}>{b}</Text>
            ))}
          </View>
        </View>

        {/* Ideal For */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Ideal For</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {['🏋️ Gym Goers', '🏃 Athletes', '🥗 Diet Plans', '🩺 Health Conscious', '💊 Post Surgery'].map((tag, i) => (
              <View key={i} style={styles.idealTag}>
                <Text style={styles.idealTagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Delivery info */}
        <View style={styles.deliveryInfo}>
          <Ionicons name="bicycle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.deliveryText}>Delivered fresh in 30 minutes · Packed hygienically</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Order Button */}
      <View style={styles.orderBtnWrap}>
        <TouchableOpacity style={styles.orderBtn} onPress={handleOrder} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.orderBtnText}>  Order Now · ₹{item?.price || 149}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f8f8' },

  /* Hero */
  hero:        { height: 320, position: 'relative' },
  heroImage:   { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  backBtn:     { position: 'absolute', top: 50, left: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 8, zIndex: 10 },
  premiumBadge: { position: 'absolute', top: 52, right: 16, backgroundColor: '#7c3aed', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  premiumBadgeText: { fontSize: 10, color: '#fff', fontWeight: '900', letterSpacing: 0.5 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub:     { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  heroPriceRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroPrice:   { fontSize: 28, fontWeight: '900', color: '#fff' },
  heroOriginal:{ fontSize: 16, color: 'rgba(255,255,255,0.6)', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#ef4444', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  discountText:  { fontSize: 12, color: '#fff', fontWeight: '800' },

  /* Nutrition strip */
  nutritionStrip: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 14, marginTop: -20, borderRadius: 16, padding: 16, justifyContent: 'space-around', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, zIndex: 10 },
  nutritionItem:  { alignItems: 'center', gap: 2 },
  nutritionIcon:  { fontSize: 20 },
  nutritionVal:   { fontSize: 18, fontWeight: '900' },
  nutritionLabel: { fontSize: 10, color: '#888', fontWeight: '600' },

  /* Sections */
  body:         { flex: 1 },
  section:      { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 14, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#1a1a1a', marginBottom: 14 },

  /* Includes */
  includeRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 12 },
  includeIcon:  { fontSize: 28, width: 40, textAlign: 'center' },
  includeInfo:  { flex: 1 },
  includeItem:  { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  includeDetail:{ fontSize: 11, color: '#888', marginTop: 2 },
  proteinTag:   { backgroundColor: '#f3e5f5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  proteinTagText: { fontSize: 11, fontWeight: '800', color: '#7c3aed' },

  /* Benefits */
  benefitsCard: { backgroundColor: '#f8fff8', borderRadius: 12, padding: 14, gap: 8 },
  benefitText:  { fontSize: 13, color: '#2d6a2d', fontWeight: '600' },

  /* Ideal for */
  idealTag:     { backgroundColor: '#f3e5f5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#e1bee7' },
  idealTagText: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },

  /* Delivery */
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 14, backgroundColor: '#e8f5e8', borderRadius: 12, padding: 12 },
  deliveryText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', flex: 1 },

  /* Order button */
  orderBtnWrap: { position: 'absolute', bottom: 20, left: 14, right: 14 },
  orderBtn:     { backgroundColor: '#7c3aed', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  orderBtnText: { color: '#fff', fontSize: 17, fontWeight: '900' },
});
