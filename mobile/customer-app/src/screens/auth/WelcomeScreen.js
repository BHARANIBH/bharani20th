import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, Dimensions, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

/* ── Benefit pills shown one-by-one ────────────────────────── */
const BENEFITS = [
  { icon: '🚫', text: 'Zero Antibiotics' },
  { icon: '❤️', text: 'Heart Healthy' },
  { icon: '💪', text: '+40% Protein' },
  { icon: '🌿', text: '100% Natural' },
  { icon: '🐓', text: 'Farm Fresh' },
];

/* ── Floating sparkle particle ──────────────────────────────── */
function Sparkle({ delay, x, size }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity,     { toValue: 1,    duration: 600, useNativeDriver: true }),
          Animated.timing(translateY,  { toValue: -20,  duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity,     { toValue: 0,    duration: 600, useNativeDriver: true }),
          Animated.timing(translateY,  { toValue: -40,  duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(translateY,    { toValue: 0,    duration: 0,   useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.sparkle, { left: x, opacity, transform: [{ translateY }], width: size, height: size, borderRadius: size / 2 }]} />
  );
}

/* ── Main screen ─────────────────────────────────────────────── */
export default function WelcomeScreen({ navigation }) {
  const { user, clearNewLogin } = useAuth();
  const name = user?.name?.split(' ')[0] || 'there';

  // Animation values
  const overlayOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale       = useRef(new Animated.Value(0.3)).current;
  const logoOpacity     = useRef(new Animated.Value(0)).current;
  const greetSlide      = useRef(new Animated.Value(50)).current;
  const greetOpacity    = useRef(new Animated.Value(0)).current;
  const taglineSlide    = useRef(new Animated.Value(40)).current;
  const taglineOpacity  = useRef(new Animated.Value(0)).current;
  const pillsOpacity    = useRef(new Animated.Value(0)).current;
  const pillsSlide      = useRef(new Animated.Value(30)).current;
  const cardSlide       = useRef(new Animated.Value(80)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const btnSlide        = useRef(new Animated.Value(40)).current;
  const btnOpacity      = useRef(new Animated.Value(0)).current;
  const shimmer         = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setHidden(true);

    // Shimmer loop on logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Main entrance sequence
    Animated.sequence([
      // 1. Overlay fade in
      Animated.timing(overlayOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // 2. Logo pops in
      Animated.parallel([
        Animated.spring(logoScale,  { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 3. Greeting slides up
      Animated.parallel([
        Animated.timing(greetSlide,   { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(greetOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 4. Tagline
      Animated.parallel([
        Animated.timing(taglineSlide,   { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 5. Pills
      Animated.parallel([
        Animated.timing(pillsSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(pillsOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // 6. Bottom card
      Animated.parallel([
        Animated.timing(cardSlide,   { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // 7. Button
      Animated.parallel([
        Animated.timing(btnSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Auto navigate after 3s
    const timer = setTimeout(handleContinue, 3000);
    return () => {
      clearTimeout(timer);
      StatusBar.setHidden(false);
    };
  }, []);

  const handleContinue = () => {
    clearNewLogin();
    navigation.replace('Main');
  };

  const shimmerColor = shimmer.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(255,255,255,0.6)', 'rgba(255,255,255,1)'],
  });

  return (
    <View style={styles.root}>
      {/* ── Background wallpaper — desi country chicken ── */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=900&q=90' }}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* ── Dark green gradient overlay ── */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />

      {/* ── Floating sparkles ── */}
      {[
        { x: width * 0.08,  delay: 0,    size: 8  },
        { x: width * 0.85,  delay: 300,  size: 6  },
        { x: width * 0.25,  delay: 600,  size: 10 },
        { x: width * 0.65,  delay: 900,  size: 7  },
        { x: width * 0.45,  delay: 200,  size: 5  },
        { x: width * 0.78,  delay: 700,  size: 9  },
        { x: width * 0.15,  delay: 1100, size: 6  },
        { x: width * 0.55,  delay: 400,  size: 8  },
      ].map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}

      {/* ── Content ── */}
      <View style={styles.content}>

        {/* Top: Logo + brand */}
        <Animated.View style={[styles.logoWrap, {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }]}>
          <View style={styles.logoCircleOuter}>
            <View style={styles.logoCircleInner}>
              <Text style={styles.logoEmoji}>🐔</Text>
            </View>
          </View>
          <Animated.Text style={[styles.brandName, { color: shimmerColor }]}>GoNaatu</Animated.Text>
          <Text style={styles.brandSub}>Pure Desi Country Chicken</Text>
        </Animated.View>

        {/* Greeting */}
        <Animated.View style={{
          opacity: greetOpacity,
          transform: [{ translateY: greetSlide }],
          alignItems: 'center',
          marginTop: 32,
        }}>
          <Text style={styles.hiText}>Welcome, {name}! 👋</Text>
          <Text style={styles.greetSub}>You've made the healthiest choice today</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{
          opacity: taglineOpacity,
          transform: [{ translateY: taglineSlide }],
          alignItems: 'center',
          marginTop: 14,
        }}>
          <View style={styles.taglineBox}>
            <Text style={styles.taglineLine}>"</Text>
            <Text style={styles.taglineText}>
              From our farm to your family —{'\n'}fresh, pure, and full of goodness.
            </Text>
            <Text style={[styles.taglineLine, { alignSelf: 'flex-end' }]}>"</Text>
          </View>
        </Animated.View>

        {/* Benefit pills */}
        <Animated.View style={[styles.pillsRow, {
          opacity: pillsOpacity,
          transform: [{ translateY: pillsSlide }],
        }]}>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.pill}>
              <Text style={styles.pillIcon}>{b.icon}</Text>
              <Text style={styles.pillText}>{b.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Bottom card */}
        <Animated.View style={[styles.card, {
          opacity: cardOpacity,
          transform: [{ translateY: cardSlide }],
        }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardItem}>
              <Ionicons name="shield-checkmark" size={22} color="#2ecc71" />
              <Text style={styles.cardItemText}>FSSAI{'\n'}Certified</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardItem}>
              <Ionicons name="leaf" size={22} color="#2ecc71" />
              <Text style={styles.cardItemText}>Zero{'\n'}Antibiotics</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardItem}>
              <Ionicons name="heart" size={22} color="#2ecc71" />
              <Text style={styles.cardItemText}>Heart{'\n'}Healthy</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardItem}>
              <Ionicons name="home" size={22} color="#2ecc71" />
              <Text style={styles.cardItemText}>Farm{'\n'}Direct</Text>
            </View>
          </View>
        </Animated.View>

        {/* CTA button */}
        <Animated.View style={{
          opacity: btnOpacity,
          transform: [{ translateY: btnSlide }],
          width: '100%',
          marginTop: 20,
        }}>
          <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.btnText}>Start Shopping</Text>
            <View style={styles.btnArrow}>
              <Ionicons name="arrow-forward" size={18} color={'#2d7a2d'} />
            </View>
          </TouchableOpacity>
          <Text style={styles.autoText}>Continuing automatically…</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0a2e0a' },
  bgImage:{ ...StyleSheet.absoluteFillObject, width, height },
  overlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 30, 5, 0.72)' },

  /* Sparkles */
  sparkle: { position: 'absolute', bottom: height * 0.28, backgroundColor: '#a8ffb0' },

  /* Content */
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 48,
  },

  /* Logo */
  logoWrap:        { alignItems: 'center' },
  logoCircleOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 14,
  },
  logoCircleInner: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(46,204,113,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(46,204,113,0.6)',
  },
  logoEmoji:  { fontSize: 44 },
  brandName:  { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  brandSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 1.5, marginTop: 4 },

  /* Greeting */
  hiText:   { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 32 },
  greetSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6, textAlign: 'center', fontWeight: '500' },

  /* Tagline */
  taglineBox:  { alignItems: 'center', paddingHorizontal: 8 },
  taglineLine: { fontSize: 32, color: 'rgba(46,204,113,0.6)', lineHeight: 28, alignSelf: 'flex-start' },
  taglineText: { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 22, fontStyle: 'italic', marginHorizontal: 8 },

  /* Pills */
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pillIcon: { fontSize: 13 },
  pillText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  /* Info card */
  card:      { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 10, marginTop: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  cardRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  cardItem:  { alignItems: 'center', gap: 6, flex: 1 },
  cardItemText: { fontSize: 10, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '700', lineHeight: 15, marginTop: 4 },
  cardDivider:  { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },

  /* Button */
  btn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 50, paddingVertical: 16, paddingHorizontal: 36, gap: 10 },
  btnText:  { fontSize: 17, fontWeight: '900', color: '#1a5c1a', letterSpacing: 0.5 },
  btnArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8f8e8', alignItems: 'center', justifyContent: 'center' },
  autoText: { fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 14, fontWeight: '500', letterSpacing: 0.5 },
});
