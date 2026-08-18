import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveUserProfile, getUserProfile, findProfileByEmail } from '../database/database'; // Resolves to database.web.js on Web

const IMG_SCAN = require('../../assets/onboarding_scan.png');
const IMG_SEARCH = require('../../assets/onboarding_search.png');
const IMG_AR = require('../../assets/onboarding_ar.png');

const { width: W, height: H } = Dimensions.get('window');

// Georgia serif for classic academic look, Avenir/sans-serif for modern tech contrast
const FONT_TITLE = Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium';

// Decorative soft ambient glow background elements
const GlowBackground = () => {
  return (
    <View style={styles.glowOverlay} pointerEvents="none">
      <LinearGradient
        colors={['rgba(142, 179, 211, 0.15)', 'transparent']}
        style={styles.glowOrbLeft}
      />
      <LinearGradient
        colors={['rgba(125, 162, 196, 0.15)', 'transparent']}
        style={styles.glowOrbRight}
      />
    </View>
  );
};

// Graphic illustration components displaying character images
const SlideGraphic = ({ index }) => {
  let imgSource;
  if (index === 0) imgSource = IMG_SCAN;
  else if (index === 1) imgSource = IMG_SEARCH;
  else imgSource = IMG_AR;

  return (
    <View style={styles.graphicContainer}>
      <Image
        source={imgSource}
        style={styles.onboardingImage}
        resizeMode="cover"
      />
    </View>
  );
};

// Corner HUD brackets from the mockup image
const HUDCornerBrackets = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[styles.hudCorner, { top: 40, left: 24, borderTopWidth: 1.5, borderLeftWidth: 1.5 }]} />
    <View style={[styles.hudCorner, { top: 40, right: 24, borderTopWidth: 1.5, borderRightWidth: 1.5 }]} />
    <View style={[styles.hudCorner, { bottom: 40, left: 24, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }]} />
    <View style={[styles.hudCorner, { bottom: 40, right: 24, borderBottomWidth: 1.5, borderRightWidth: 1.5 }]} />
  </View>
);

// Animated background navigation nodes
const NodeParticle = ({ x, y, delay }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.5, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: false }),
          Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: false }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[
      styles.particle,
      {
        left: x,
        top: y,
        opacity,
        transform: [{ scale }]
      }
    ]} />
  );
};

const particles = Array.from({ length: 10 }, (_, i) => ({
  x: Math.random() * (W - 60) + 30,
  y: Math.random() * (H - 120) + 60,
  delay: i * 350,
}));

const TUTORIAL_SLIDES = [
  {
    title: 'Find Your Starting Point',
    desc: 'Hold up your phone and scan any room number or hallway sign. The app instantly recognizes your location, getting you ready to navigate without GPS.',
  },
  {
    title: 'Choose Where to Go',
    desc: 'Select your current location (such as Lab 7) and your desired destination (such as Lab 3). We instantly map the shortest path through the hallways.',
  },
  {
    title: 'Follow the 3D Runway',
    desc: 'Follow the bright neon arrows overlaid directly on the floor. Real-time voice guidance will call out turns and alert you when you arrive.',
  },
];

export default function SplashScreen({ onFinish }) {
  const [subScreen, setSubScreen] = useState('INTRO'); // 'INTRO' | 'TUTORIAL' | 'REGISTER'
  const [slideIndex, setSlideIndex] = useState(0);

  // Form profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'faculty' | 'visitor'
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [validationErr, setValidationErr] = useState('');

  // Fade transition for subscreen switches
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideFadeAnim = useRef(new Animated.Value(1)).current;
  const greetingAnim = useRef(new Animated.Value(0)).current;

  // Animations from the template code & mockup blip movements
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const ring1Radius = useRef(new Animated.Value(34)).current;
  const ring1Opacity = useRef(new Animated.Value(0.55)).current;
  const ring2Radius = useRef(new Animated.Value(34)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;
  
  // Floating AR guide ping
  const pingY = useRef(new Animated.Value(170)).current;
  const pingOpacity = useRef(new Animated.Value(0)).current;

  // Orbiting radar blip rotation
  const radarOrbitSpin = useRef(new Animated.Value(0)).current;

  // 3D Loop Animation refs for Slides Graphics
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const rotateXAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const rotateZAnim = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef(null);

  // Wordmark + Subtitle + CTA reveal sequence values
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslate = useRef(new Animated.Value(8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslate = useRef(new Animated.Value(12)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Icon fades in first
    Animated.timing(iconOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // 2. Sonar pulse rings - continuous loop, staggered (no native driver for radius)
    const pulse = (radiusVal, opacityVal, delay, maxR) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(radiusVal, {
              toValue: maxR,
              duration: 3000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(opacityVal, {
              toValue: 0,
              duration: 3000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false,
            }),
          ]),
          Animated.timing(radiusVal, { toValue: 34, duration: 0, useNativeDriver: false }),
          Animated.timing(opacityVal, { toValue: 0.55, duration: 0, useNativeDriver: false }),
        ])
      );

    pulse(ring1Radius, ring1Opacity, 0, 126).start();
    pulse(ring2Radius, ring2Opacity, 1000, 100).start();

    // 3. Orbiting Radar Blip Ball (moves along the circular track)
    Animated.loop(
      Animated.timing(radarOrbitSpin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // 4. Quiet AR ping moving vertically
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pingY, {
            toValue: 90,
            duration: 3000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(pingOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
            Animated.timing(pingOpacity, { toValue: 0, duration: 2800, useNativeDriver: false }),
          ]),
        ]),
        Animated.timing(pingY, { toValue: 170, duration: 0, useNativeDriver: false }),
      ])
    ).start();

    // 5. 3D loops for slider visualizations (Floating & Rotating) - useNativeDriver: false for web previews
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateYAnim, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(rotateYAnim, { toValue: -1, duration: 3200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateXAnim, { toValue: 1, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(rotateXAnim, { toValue: -1, duration: 3800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateZAnim, { toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: false })
    ).start();

    // 6. Wordmark + Subtitle + CTA reveal sequence
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 450, useNativeDriver: false }),
        Animated.timing(wordmarkTranslate, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(ctaTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, []);

  const transitionTo = (newScreen) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setSubScreen(newScreen);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    });
  };

  const handleNextSlide = () => {
    if (slideIndex < TUTORIAL_SLIDES.length - 1) {
      const nextIdx = slideIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIdx * W, animated: true });
      setSlideIndex(nextIdx);
    } else {
      transitionTo('REGISTER');
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      const prevIdx = slideIndex - 1;
      scrollViewRef.current?.scrollTo({ x: prevIdx * W, animated: true });
      setSlideIndex(prevIdx);
    }
  };

  const handleSignUp = () => {
    setValidationErr('');
    if (!name.trim()) {
      setValidationErr('Please enter your full name to sign up.');
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationErr('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setValidationErr('Please check your email address formatting.');
      return;
    }

    try {
      const existing = findProfileByEmail(cleanEmail);
      if (existing) {
        setValidationErr('An account with this email already exists. Tap Login to restore.');
        return;
      }
      saveUserProfile(name.trim(), cleanEmail, selectedRole);
      proceedToGreeting(name.trim());
    } catch (e) {
      setValidationErr('Error completing setup. Please try again.');
    }
  };

  const handleLogin = () => {
    setValidationErr('');
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setValidationErr('Please enter your email address to log in.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setValidationErr('Please check your email address formatting.');
      return;
    }

    try {
      const existing = findProfileByEmail(cleanEmail);
      if (!existing) {
        setValidationErr('No profile found with this email. Fill out details and tap Sign Up.');
        return;
      }
      saveUserProfile(existing.name, existing.email, existing.role);
      proceedToGreeting(existing.name);
    } catch (e) {
      setValidationErr('Error logging in. Please try again.');
    }
  };

  const proceedToGreeting = (userName) => {
    setSubScreen('GREETING');
    Animated.timing(greetingAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: false,
        }).start(() => {
          onFinish();
        });
      }, 1800);
    });
  };

  // Interpolate radar sweep orbit rotation
  const orbitAngle = radarOrbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const activeSlide = TUTORIAL_SLIDES[slideIndex];

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient colors={['#A2B9D4', '#F4F7FB']} style={StyleSheet.absoluteFill} />

      {/* Hidden pre-cache images to ensure immediate load */}
      <View style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} pointerEvents="none">
        <Image source={IMG_SCAN} />
        <Image source={IMG_SEARCH} />
        <Image source={IMG_AR} />
      </View>

      {/* Soft Ambient Glow Background */}
      <GlowBackground />

      <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
        
        {/* ── STAGE 1: INTRO RADAR STYLES ───────────────────────────────────── */}
        {subScreen === 'INTRO' && (
          <View style={styles.introContent}>
            
            {/* Animated Concentric Circle Grid */}
            <View style={styles.radarFrame}>
              {/* Static background ring reference */}
              <View style={styles.radarRingStatic} />

              {/* Sonar pulse ring 1 (staggered) */}
              <Animated.View style={[
                styles.radarRing1,
                { width: ring1Radius, height: ring1Radius, borderRadius: 999, opacity: ring1Opacity }
              ]} />
              
              {/* Sonar pulse ring 2 (dashed) */}
              <Animated.View style={[
                styles.radarRing2,
                { width: ring2Radius, height: ring2Radius, borderRadius: 999, opacity: ring2Opacity }
              ]} />

              {/* Moving green AR guide ping (vertical animation from code) */}
              <Animated.View style={[
                styles.pingDot,
                { top: pingY, opacity: pingOpacity }
              ]} />

              {/* Orbiting Radar Blip Ball (The cyan moving ball on orbit) */}
              <Animated.View style={[
                styles.orbitContainer,
                { transform: [{ rotate: orbitAngle }] }
              ]}>
                <View style={styles.orbitingCyanBall} />
              </Animated.View>

              {/* Center Compass Rounded Square Logo Box */}
              <Animated.View style={[styles.centerIconContainer, { opacity: iconOpacity }]}>
                <LinearGradient
                  colors={['#2979FF', '#1E293B']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <View style={styles.centerIconInner}>
                  <Ionicons name="navigate-outline" size={22} color="#1E293B" />
                </View>
              </Animated.View>
            </View>

            {/* Branding Header */}
            <View style={styles.wordmarkWrap}>
              <Animated.View style={{
                opacity: wordmarkOpacity,
                transform: [{ translateY: wordmarkTranslate }]
              }}>
                <Text style={styles.brandTitle}>
                  PATH<Text style={styles.brandHighlight}>VERSE</Text>
                  <Text style={styles.brandAR}> AR</Text>
                </Text>
              </Animated.View>
              <Animated.Text style={[styles.brandSubtitle, { opacity: subtitleOpacity }]}>
                AR · INDOOR NAVIGATION · IoBM
              </Animated.Text>
              <Animated.Text style={[styles.taglineText, { opacity: subtitleOpacity }]}>
                Navigate the campus with clarity and ease.
              </Animated.Text>
            </View>

            {/* Pill Gradient CTA Button */}
            <Animated.View style={{
              opacity: ctaOpacity,
              transform: [{ translateY: ctaTranslate }],
              marginTop: 65,
              width: '100%',
              paddingHorizontal: 24,
            }}>
              <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.85}
                onPress={() => transitionTo('TUTORIAL')}
              >
                <Text style={styles.ctaBtnText}>Get started</Text>
                <Ionicons name="arrow-forward" size={17} color="#fff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* ── STAGE 2: SWIPE TUTORIAL CARDS ────────────────────────────────── */}
        {subScreen === 'TUTORIAL' && (
          <View style={StyleSheet.absoluteFill}>
            {/* Absolute Hovered Header */}
            <View style={styles.tutorialHeaderHover}>
              {slideIndex > 0 ? (
                <TouchableOpacity
                  style={styles.backButtonCircle}
                  onPress={handlePrevSlide}
                  hitSlop={{top:15, bottom:15, left:15, right:15}}
                >
                  <Ionicons name="chevron-back" size={18} color="#1E293B" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 32 }} />
              )}
              
              {/* Centered logo matching mockup layout */}
              <View style={styles.headerLogoContainer}>
                <Ionicons name="navigate-outline" size={16} color="#1E293B" style={{ marginRight: 4 }} />
                <Text style={styles.headerLogoText}>pathverse</Text>
              </View>

              <TouchableOpacity
                style={styles.skipButtonPill}
                onPress={() => transitionTo('REGISTER')}
                hitSlop={{top:15, bottom:15, left:15, right:15}}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Full Screen ScrollView */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / W);
                setSlideIndex(newIndex);
              }}
              style={StyleSheet.absoluteFill}
            >
              {TUTORIAL_SLIDES.map((slide, idx) => (
                <View key={idx} style={{ width: W, height: H, justifyContent: 'space-between' }}>
                  {/* Top Graphic Space */}
                  <View style={styles.slideGraphicWrap}>
                    <SlideGraphic index={idx} />
                  </View>

                  {/* Bottom White Card */}
                  <View style={styles.bottomWhiteCard}>
                    <Text style={styles.slideTitleText}>{slide.title}</Text>
                    <Text style={styles.slideDescText}>{slide.desc}</Text>

                    {/* Progress dots inside white card */}
                    <View style={styles.progressDotsContainer}>
                      {TUTORIAL_SLIDES.map((_, dotIdx) => (
                        <View
                          key={dotIdx}
                          style={[
                            styles.indicatorDot,
                            slideIndex === dotIdx ? styles.indicatorDotActive : null
                          ]}
                        />
                      ))}
                    </View>

                    {/* Action button inside white card */}
                    <TouchableOpacity
                      style={styles.nextSlideBtnFull}
                      onPress={handleNextSlide}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.nextSlideBtnTextFull}>
                        {slideIndex === TUTORIAL_SLIDES.length - 1 ? 'Get Started' : 'Next'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── STAGE 3: ACCOUNT CREATION / PROFILE SETUP ─────────────────────── */}
        {subScreen === 'REGISTER' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.registerContainer}
          >
            {/* Top Navigation Bar matching Mockup */}
            <View style={styles.registerHeaderHover}>
              <TouchableOpacity
                style={styles.backButtonCircle}
                onPress={() => transitionTo('TUTORIAL')}
                hitSlop={{top:15, bottom:15, left:15, right:15}}
              >
                <Ionicons name="chevron-back" size={18} color="#1E293B" />
              </TouchableOpacity>
              
              <View style={{ width: 32 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.registerScrollArea}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Profile Intro header block inside scroll */}
              <View style={styles.formIntro}>
                <View style={styles.shieldPulseIcon}>
                  <LinearGradient
                    colors={['#00E5FF', '#2979FF']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                  <View style={styles.centerIconInner}>
                    <Ionicons name="navigate-outline" size={24} color="#2979FF" />
                  </View>
                </View>
                <Text style={styles.profileTitleText}>Create Your Account</Text>
                <Text style={styles.profileSubText}>Create your profile to explore exciting features and start navigation.</Text>
              </View>

              <View style={styles.registerFormWrap}>
                {/* Full Name Input Field */}
                <Text style={styles.inputLabelText}>Full Name</Text>
                <View style={[
                  styles.mockupInputContainer,
                  nameFocused && styles.mockupInputContainerFocused
                ]}>
                  <TextInput
                    style={styles.mockupTextInput}
                    placeholder="Enter your name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                {/* Email Address Input Field */}
                <Text style={styles.inputLabelText}>Email</Text>
                <View style={[
                  styles.mockupInputContainer,
                  emailFocused && styles.mockupInputContainerFocused
                ]}>
                  <TextInput
                    style={styles.mockupTextInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>

                {/* Role Selector Field */}
                <Text style={styles.inputLabelText}>Select Role</Text>
                <View style={styles.roleContainer}>
                  {[
                    { id: 'student', label: 'Student', icon: 'school-outline' },
                    { id: 'faculty', label: 'Faculty', icon: 'briefcase-outline' },
                    { id: 'visitor', label: 'Visitor', icon: 'people-outline' },
                  ].map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleCard,
                        selectedRole === role.id && styles.roleCardActive
                      ]}
                      onPress={() => setSelectedRole(role.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={role.icon}
                        size={20}
                        color={selectedRole === role.id ? '#FFF' : '#64748B'}
                      />
                      <Text style={[
                        styles.roleCardText,
                        selectedRole === role.id && styles.roleCardTextActive
                      ]}>
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {!!validationErr && (
                  <View style={styles.validationErrorCard}>
                    <Ionicons name="information-circle" size={16} color="#ff4d4d" style={{ marginRight: 6 }} />
                    <Text style={styles.validationErrorText}>{validationErr}</Text>
                  </View>
                )}
              </View>

              {/* Actions Stack */}
              <View style={styles.authActionsWrap}>
                <TouchableOpacity
                  style={styles.mockupSubmitBtn}
                  activeOpacity={0.8}
                  onPress={handleSignUp}
                >
                  <Text style={styles.mockupSubmitBtnText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mockupSubmitBtn, styles.mockupSubmitBtnOutline]}
                  activeOpacity={0.8}
                  onPress={handleLogin}
                >
                  <Text style={[styles.mockupSubmitBtnText, styles.mockupSubmitBtnTextOutline]}>Login</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── STAGE 4: DYNAMIC GREETING SCREEN ────────────────────────────── */}
        {subScreen === 'GREETING' && (
          <Animated.View style={[styles.greetingContainer, { opacity: greetingAnim }]}>
            <View style={styles.greetingHeaderIcon}>
              <LinearGradient
                colors={['#00E5FF', '#2979FF']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={styles.centerIconInner}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#2979FF" />
              </View>
            </View>

            <Text style={styles.greetingWelcomeText}>
              {getGreeting()},
            </Text>
            <Text style={styles.greetingNameText}>
              {name.trim()}
            </Text>

            <Text style={styles.greetingSubText}>
              Your account has been successfully configured. Preparing your navigation interface...
            </Text>
          </Animated.View>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#A2B9D4' },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowOrbLeft: {
    position: 'absolute',
    top: H * 0.1,
    left: -W * 0.35,
    width: W * 0.9,
    height: W * 0.9,
    borderRadius: (W * 0.9) / 2,
  },
  glowOrbRight: {
    position: 'absolute',
    bottom: H * 0.15,
    right: -W * 0.4,
    width: W * 1.0,
    height: W * 1.0,
    borderRadius: W / 2,
  },
  hudCorner: {
    position: 'absolute',
    width: 18, height: 18,
    borderColor: '#8EB3D3',
    opacity: 0.35,
  },
  particle: {
    position: 'absolute',
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#8EB3D3',
    shadowColor: '#8EB3D3',
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  mainWrapper: { flex: 1 },

  // ── STAGE 1: INTRO RADAR STYLES ──────────────────────�  radarRingStatic: {
    position: 'absolute',
    width: 68, height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(41, 121, 255, 0.6)',
  },
  radarRing1: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(41, 121, 255, 0.75)',
  },
  radarRing2: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(30, 41, 59, 0.6)',
    borderStyle: 'dashed',
  },
  radarRing3: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(30, 41, 59, 0.25)',
  },
  pingDot: {
    position: 'absolute',
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2979FF',
    shadowColor: '#2979FF', shadowOpacity: 0.8, shadowRadius: 4,
  },
  orbitContainer: {
    position: 'absolute',
    width: 180, height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(30, 41, 59, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitingCyanBall: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#2979FF',
    shadowColor: '#2979FF', shadowOpacity: 0.8, shadowRadius: 5,
    marginLeft: -4,
  },
  centerIconContainer: {
    width: 44, height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2979FF', shadowOpacity: 0.2, shadowRadius: 8,
    zIndex: 10,
  },
  centerIconInner: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },ntent: 'center',
    alignItems: 'center',
    shadowColor: '#2979FF', shadowOpacity: 0.2, shadowRadius: 8,
    zIndex: 10,
  },
  centerIconInner: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  wordmarkWrap: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 32, fontWeight: '900', color: '#1E293B',
    letterSpacing: 1.5, fontFamily: FONT_TITLE, marginBottom: 8,
  },
  brandHighlight: {
    color: '#8EB3D3',
    fontFamily: FONT_TITLE,
    fontWeight: '900',
  },
  brandAR: {
    fontSize: 18,
    color: '#64748B',
    fontFamily: FONT_TITLE,
    fontWeight: '600',
  },
  brandSubtitle: {
    color: '#64748B', fontSize: 11, fontWeight: '800',
    fontFamily: FONT_BODY, textAlign: 'center', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  taglineText: {
    color: '#64748B', fontSize: 13, fontWeight: '500',
    fontFamily: FONT_BODY, textAlign: 'center', letterSpacing: 0.5,
    lineHeight: 20, paddingHorizontal: 28, marginTop: 4,
  },

  ctaButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 36,
    alignSelf: 'center',
    shadowColor: '#1E293B', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaBtnText: {
    color: '#fff', fontSize: 15, fontWeight: '700',
    fontFamily: FONT_BODY, letterSpacing: 0.5,
  },

  // ── STAGE 2: SWIPE TUTORIAL STYLES ──────────────────────────────────────
  tutorialHeaderHover: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    left: 0,
    right: 0,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  backButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.1)',
    shadowColor: '#1E293B',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  skipButtonPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.1)',
    shadowColor: '#1E293B',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: FONT_BODY,
    letterSpacing: 0.5,
  },
  progressIndicatorLabel: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 2, fontFamily: FONT_TITLE },
  skipBtnText: { color: '#64748B', fontSize: 13, fontWeight: '700', fontFamily: FONT_BODY },

  slideGraphicWrap: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  graphicContainer: {
    flex: 1,
    width: '100%',
  },
  onboardingImage: {
    width: '100%',
    height: '100%',
  },
  // Slide 1 deck
  deckCard: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deckCardBack: {
    width: 190,
    height: 130,
    transform: [{ rotate: '-8deg' }, { translateX: -20 }, { translateY: -15 }],
    opacity: 0.6,
  },
  deckCardMiddle: {
    width: 190,
    height: 130,
    transform: [{ rotate: '6deg' }, { translateX: 20 }, { translateY: -8 }],
    opacity: 0.8,
  },
  deckCardFront: {
    width: 210,
    height: 150,
    zIndex: 10,
    padding: 16,
    justifyContent: 'center',
  },
  scanTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
    letterSpacing: 2,
    fontFamily: FONT_TITLE,
  },
  scanSubLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  scanStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: FONT_BODY,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00E5FF',
    opacity: 0.8,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },

  // Slide 2 feed
  feedContainer: {
    width: '95%',
    alignItems: 'center',
    gap: 10,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  feedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedTextBox: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: FONT_BODY,
  },
  feedSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    fontFamily: FONT_BODY,
  },
  feedBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  feedBtnActive: {
    backgroundColor: '#8EB3D3',
  },
  feedBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: FONT_BODY,
  },
  feedBtnTextActive: {
    color: '#fff',
  },

  // Slide 3 radar
  radarGraphicFrame: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  radarGraphicRingOuter: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  radarGraphicRingMiddle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarGraphicRingInner: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarGraphicCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  orbitNode: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },

  bottomWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 45 : 35,
    width: '100%',
    shadowColor: '#1E293B',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  slideTitleText: {
    color: '#1E293B',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: FONT_TITLE,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 30,
  },
  slideDescText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_BODY,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  progressDotsContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 28,
  },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  indicatorDotActive: { width: 20, backgroundColor: '#1E293B' },

  nextSlideBtnFull: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  nextSlideBtnTextFull: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_BODY,
    letterSpacing: 0.5,
  },

  registerContainer: { flex: 1, paddingTop: 0 },
  registerScrollArea: { paddingHorizontal: 28, paddingBottom: 40, width: '100%', alignItems: 'center' },
  
  formIntro: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  shieldPulseIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2979FF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  centerIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTitleText: {
    color: '#1E293B',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: FONT_TITLE,
    marginBottom: 8,
    textAlign: 'center',
  },
  profileSubText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONT_BODY,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  
  registerHeaderHover: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingBottom: 15,
    width: '100%',
    zIndex: 100,
  },
  registerHeaderTitle: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: FONT_TITLE,
    textAlign: 'center',
  },

  registerFormWrap: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 15,
  },
  inputLabelText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_BODY,
    marginBottom: 8,
    marginTop: 18,
  },
  mockupInputContainer: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  mockupInputContainerFocused: {
    borderColor: '#1E293B',
  },
  mockupTextInput: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONT_BODY,
  },

  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
  },
  roleCardActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  roleCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: FONT_BODY,
  },
  roleCardTextActive: {
    color: '#FFF',
  },
  
  validationErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(255,77,77,0.08)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.2)',
  },
  validationErrorText: { color: '#ff4d4d', fontSize: 12, fontWeight: '600', fontFamily: FONT_BODY },
  
  mockupSubmitBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mockupSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_BODY,
    letterSpacing: 0.5,
  },
  authActionsWrap: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 35,
    gap: 12,
  },
  mockupSubmitBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    elevation: 0,
    shadowOpacity: 0,
  },
  mockupSubmitBtnTextOutline: {
    color: '#1E293B',
  },

  // ── STAGE 4: DYNAMIC GREETING STYLES ────────────────────────────────────
  greetingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  greetingHeaderIcon: {
    width: 80, height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2979FF', shadowOpacity: 0.25, shadowRadius: 10,
    elevation: 4,
  },
  greetingWelcomeText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_BODY,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  greetingNameText: {
    color: '#1E293B',
    fontSize: 28,
    fontWeight: '900',
    fontFamily: FONT_TITLE,
    textAlign: 'center',
    marginBottom: 16,
  },
  greetingSubText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FONT_BODY,
    textAlign: 'center',
    lineHeight: 20,
  },
});
