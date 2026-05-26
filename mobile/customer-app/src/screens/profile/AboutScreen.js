import React from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../config';

const FEATURES = [
  { icon: '🐓', title: 'Country Breed Only',     desc: 'We source 100% native Desi country breed chickens — never broiler.' },
  { icon: '🌾', title: 'Free-Range Farming',     desc: 'Our birds roam freely outdoors, raised on natural grain and green feed.' },
  { icon: '🚫', title: 'Zero Antibiotics',        desc: 'No antibiotics, no growth hormones — ever. Guaranteed.' },
  { icon: '❄️', title: 'Cold-Chain Delivery',    desc: 'Fresh-cut chicken delivered chilled to preserve quality and flavour.' },
  { icon: '✅', title: 'FSSAI Certified',         desc: 'Fully licensed and certified by FSSAI for food safety standards.' },
  { icon: '👨‍🌾', title: 'Direct from Farmers',   desc: 'We partner directly with local Tamil Nadu farmers, cutting middlemen.' },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&q=80',
  'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=600&q=80',
  'https://images.unsplash.com/photo-1574870111867-089730e5a72b?w=600&q=80',
  'https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?w=600&q=80',
];

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About GoNaatu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <View style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=80' }}
            style={styles.heroBg}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>🐔 GoNaatu</Text></View>
            <Text style={styles.heroTitle}>Pure Desi Country{'\n'}Chicken</Text>
            <Text style={styles.heroSub}>Fresh · Natural · Sustainably Raised</Text>
          </View>
        </View>

        {/* ── Brand tagline ── */}
        <View style={styles.taglineCard}>
          <Text style={styles.taglineQuote}>"</Text>
          <Text style={styles.tagline}>
            From the farm to your family — we deliver the real taste of traditional country chicken,
            raised the way nature intended.
          </Text>
          <Text style={styles.taglineQuoteEnd}>"</Text>
          <Text style={styles.taglineBy}>— GoNaatu Team</Text>
        </View>

        {/* ── Our Story ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=700&q=80' }}
            style={styles.storyImg}
            resizeMode="cover"
          />
          <Text style={styles.storyText}>
            GoNaatu started with a question: <Text style={styles.bold}>why is it so hard to find real, unadulterated country chicken?</Text>
            {'\n\n'}
            Growing up, our founders enjoyed the rich taste of desi chicken raised in their family farms. When they moved to
            the city, that flavour was gone — replaced by pale, tasteless broiler chicken pumped with antibiotics.
            {'\n\n'}
            In 2022, they decided to bring it back. GoNaatu was built to connect city families with local Tamil Nadu farmers
            who still raise chickens the traditional way — free-range, on natural feed, completely antibiotic-free.
            {'\n\n'}
            Today, we deliver fresh-cut country chicken to hundreds of homes across Bangalore, straight from the farm to your
            doorstep — clean, honest, and full of flavour.
          </Text>
        </View>

        {/* ── Photo gallery ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Life on the Farm</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
            {GALLERY.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
            ))}
          </ScrollView>
        </View>

        {/* ── What makes us different ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Makes Us Different</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Nutrition comparison ── */}
        <View style={[styles.section, { paddingHorizontal: 0 }]}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>Country vs Broiler — The Facts</Text>
          <View style={styles.nutTable}>
            <View style={styles.nutHeader}>
              <Text style={[styles.nutCell, styles.nutLabelCell, styles.nutHeadText]}>Nutrient</Text>
              <Text style={[styles.nutCell, styles.nutHeadText, { color: COLORS.primary }]}>Country 🐓</Text>
              <Text style={[styles.nutCell, styles.nutHeadText, { color: '#e74c3c' }]}>Broiler</Text>
            </View>
            {[
              ['Protein',         '25–28 g',    '18–22 g'],
              ['Fat',             '1.5–3 g',    '6–9 g'],
              ['Cholesterol',     'Low',         'High'],
              ['Omega-3',         'Higher',      'Lower'],
              ['Antibiotics',     '❌ None',     '⚠️ Used'],
              ['Growth Hormones', '❌ None',     '⚠️ Given'],
            ].map(([label, good, bad], i) => (
              <View key={i} style={[styles.nutRow, i % 2 === 0 && { backgroundColor: '#f8fff8' }]}>
                <Text style={[styles.nutCell, styles.nutLabelCell, { color: '#555' }]}>{label}</Text>
                <Text style={[styles.nutCell, { color: COLORS.primary, fontWeight: '700' }]}>{good}</Text>
                <Text style={[styles.nutCell, { color: '#e74c3c' }]}>{bad}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.nutNote}>* Per 100g serving, approximate values</Text>
        </View>

        {/* ── Certifications ── */}
        <View style={styles.certRow}>
          {[
            { icon: '✅', label: 'FSSAI\nCertified' },
            { icon: '🌿', label: 'No\nAntibiotics' },
            { icon: '🏡', label: 'Farm\nDirect' },
            { icon: '❄️', label: 'Cold\nChain' },
          ].map((c, i) => (
            <View key={i} style={styles.certCard}>
              <Text style={styles.certIcon}>{c.icon}</Text>
              <Text style={styles.certLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Contact / social ── */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Get in Touch</Text>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('tel:+919876543210')}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <Text style={styles.contactText}>+91 98765 43210</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:hello@gonaatu.com')}>
            <Ionicons name="mail-outline" size={18} color={COLORS.primary} />
            <Text style={styles.contactText}>hello@gonaatu.com</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('https://www.instagram.com')}>
            <Ionicons name="logo-instagram" size={18} color={COLORS.primary} />
            <Text style={styles.contactText}>@gonaatu_official</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>🐔 GoNaatu</Text>
          <Text style={styles.footerTagline}>Pure Desi Country Chicken</Text>
          <Text style={styles.footerVersion}>Version 1.0.0  ·  Made with ❤️ in Bangalore</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#f5f5f5' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },

  /* Hero */
  hero:        { height: 260, position: 'relative' },
  heroBg:      { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,50,0,0.55)' },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  heroBadge:   { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  heroBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  heroTitle:   { fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 36 },
  heroSub:     { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 10, letterSpacing: 1, fontWeight: '600' },

  /* Tagline */
  taglineCard: { backgroundColor: COLORS.primary, marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20, alignItems: 'center' },
  taglineQuote: { fontSize: 48, color: 'rgba(255,255,255,0.3)', lineHeight: 40, alignSelf: 'flex-start', marginBottom: -10 },
  tagline:     { fontSize: 14, color: '#fff', textAlign: 'center', lineHeight: 22, fontStyle: 'italic' },
  taglineQuoteEnd: { fontSize: 48, color: 'rgba(255,255,255,0.3)', lineHeight: 30, alignSelf: 'flex-end', marginTop: -10 },
  taglineBy:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 8, fontWeight: '700' },

  /* Sections */
  section:     { backgroundColor: '#fff', marginHorizontal: 0, marginTop: 12, paddingHorizontal: 16, paddingVertical: 20 },
  sectionTitle:{ fontSize: 17, fontWeight: '900', color: '#1a1a1a', marginBottom: 14 },
  storyImg:    { width: '100%', height: 180, borderRadius: 16, marginBottom: 16, backgroundColor: '#f0f0f0' },
  storyText:   { fontSize: 14, color: '#555', lineHeight: 24 },
  bold:        { fontWeight: '800', color: '#222' },

  /* Gallery */
  galleryImg:  { width: 200, height: 140, borderRadius: 14, backgroundColor: '#f0f0f0' },

  /* Features */
  featureRow:  { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 14 },
  featureIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#f0fff0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureIcon: { fontSize: 22 },
  featureBody: { flex: 1 },
  featureTitle:{ fontSize: 14, fontWeight: '800', color: '#1a1a1a', marginBottom: 3 },
  featureDesc: { fontSize: 12, color: '#666', lineHeight: 18 },

  /* Nutrition table */
  nutTable:    { backgroundColor: '#fff' },
  nutHeader:   { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingVertical: 12, paddingHorizontal: 16 },
  nutRow:      { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  nutCell:     { flex: 1, fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
  nutLabelCell:{ flex: 1.4, textAlign: 'left', color: '#444' },
  nutHeadText: { fontSize: 12, fontWeight: '800', color: '#666' },
  nutNote:     { fontSize: 11, color: '#aaa', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  /* Certifications */
  certRow:     { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  certCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  certIcon:    { fontSize: 24, marginBottom: 6 },
  certLabel:   { fontSize: 10, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 15 },

  /* Contact */
  contactCard: { backgroundColor: '#fff', marginHorizontal: 0, marginTop: 12, paddingHorizontal: 16, paddingVertical: 20 },
  contactTitle:{ fontSize: 17, fontWeight: '900', color: '#1a1a1a', marginBottom: 14 },
  contactRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  contactText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  /* Footer */
  footer:      { alignItems: 'center', paddingVertical: 30, backgroundColor: '#1a1a1a' },
  footerLogo:  { fontSize: 24, marginBottom: 4 },
  footerTagline: { fontSize: 13, color: '#aaa', fontWeight: '600', marginBottom: 6 },
  footerVersion: { fontSize: 11, color: '#666' },
});
