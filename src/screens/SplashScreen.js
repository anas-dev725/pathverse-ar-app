import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// Animated dot for background particle network
const Particle = ({ x, y, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.particle, { left: x, top: y, opacity }]} />
  );
};

const particles = Array.from({ length: 20 }, (_, i) => ({
  x: Math.random() * W,
  y: Math.random() * H,
  delay: i * 180,
}));

export default function SplashScreen({ onFinish }) {
  const logoScale     = useRef(new Animated.Value(0.3)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const taglineOpacity= useRef(new Animated.Value(0)).current;
  const ringScale     = useRef(new Animated.Value(0.6)).current;
  const ringOpacity   = useRef(new Animated.Value(0)).current;
  const barWidth      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Ring + logo appears
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(ringScale,   { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Text fades in
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(150),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      // Progress bar loads
      Animated.timing(barWidth, {
        toValue: W * 0.55,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(400),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#020818', '#061028', '#0a1a38']} style={StyleSheet.absoluteFill} />

      {/* Particle network */}
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Center glow ring */}
      <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <Animated.View style={[styles.ringInner, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <LinearGradient colors={['#4db8ff', '#0066cc']} style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🧭</Text>
        </LinearGradient>
      </Animated.View>

      {/* Brand name */}
      <Animated.Text style={[styles.brand, { opacity: textOpacity }]}>
        Path<Text style={styles.brandHighlight}>verse</Text>
        <Text style={styles.brandAR}> AR</Text>
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Visual-Semantic Indoor Navigation
      </Animated.Text>

      {/* Loading bar */}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </View>
      <Animated.Text style={[styles.loadingTxt, { opacity: taglineOpacity }]}>
        Initialising Spatial Engine...
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020818'
  },
  particle: {
    position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#4db8ff'
  },
  ring: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140,
    borderWidth: 1.5, borderColor: '#4db8ff',
  },
  ringInner: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(77,184,255,0.4)',
  },
  logoWrap: { marginBottom: 28 },
  logoCircle: {
    width: 110, height: 110, borderRadius: 35,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#4db8ff', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9, shadowRadius: 20, elevation: 20,
  },
  logoIcon: { fontSize: 52 },

  brand: {
    fontSize: 40, fontWeight: '900', color: '#fff',
    letterSpacing: 1, marginBottom: 10
  },
  brandHighlight: { color: '#fff' },
  brandAR: { color: '#4db8ff' },
  tagline: { color: '#607D8B', fontSize: 14, fontWeight: '500', letterSpacing: 1.5, marginBottom: 50 },

  barTrack: {
    width: W * 0.55, height: 3, backgroundColor: 'rgba(77,184,255,0.15)',
    borderRadius: 4, overflow: 'hidden', marginBottom: 14,
  },
  barFill: {
    height: 3,
    backgroundColor: '#4db8ff',
    borderRadius: 4,
    shadowColor: '#4db8ff', shadowOpacity: 1, shadowRadius: 6,
  },
  loadingTxt: { color: '#455A64', fontSize: 12, letterSpacing: 2 },
});
