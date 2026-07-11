import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, Easing,
  TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveUserProfile, getUserProfile } from '../database/database';

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

// Graphic illustration components matching the premium onboarding mockup
const SlideGraphic = ({ index }) => {
  if (index === 0) {
    return (
      <View style={styles.graphicContainer}>
        {/* Card Deck stack matching Slide 1 */}
        <View style={[styles.deckCard, styles.deckCardBack]} />
        <View style={[styles.deckCard, styles.deckCardMiddle]} />
        <View style={[styles.deckCard, styles.deckCardFront]}>
          <View style={styles.scanTarget}>
            <Ionicons name="scan-outline" size={40} color="#8EB3D3" />
            <Text style={styles.scanCodeText}>ROOM 302</Text>
            <View style={styles.scanSubLabel}>
              <View style={styles.pulseDot} />
              <Text style={styles.scanStatusText}>Calibrating AR</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (index === 1) {
    return (
      <View style={styles.graphicContainer}>
        {/* Location Feed list matching Slide 2 */}
        <View style={styles.feedContainer}>
          {[
            { name: 'Physics Lab 202', floor: 'Floor 2, Block A', icon: 'school-outline', active: true },
            { name: 'Central Library', floor: 'Floor 1, Block B', icon: 'book-outline', active: false },
            { name: 'Student Cafeteria', floor: 'Floor 1, Block C', icon: 'cafe-outline', active: false }
          ].map((item, i) => (
            <View key={i} style={styles.feedItem}>
              <View style={styles.feedIconBox}>
                <Ionicons name={item.icon} size={20} color="#8EB3D3" />
              </View>
              <View style={styles.feedTextBox}>
                <Text style={styles.feedTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.feedSub}>{item.floor}</Text>
              </View>
              <View style={[styles.feedBtn, item.active && styles.feedBtnActive]}>
                <Text style={[styles.feedBtnText, item.active && styles.feedBtnTextActive]}>
                  {item.active ? 'Active' : 'Go'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (index === 2) {
    return (
      <View style={styles.graphicContainer}>
        {/* Radar concentric circular tracks and nodes matching Slide 3 */}
        <View style={styles.radarGraphicFrame}>
          <View style={styles.radarGraphicRingOuter} />
          <View style={styles.radarGraphicRingMiddle} />
          <View style={styles.radarGraphicRingInner} />
          
          {/* Central dark circle */}
          <View style={styles.radarGraphicCenter}>
            <Ionicons name="navigate" size={24} color="#FFF" />
          </View>

          {/* Orbiting nodes */}
          <View style={[styles.orbitNode, { top: 15, left: 40 }]}>
            <Ionicons name="location-outline" size={14} color="#8EB3D3" />
          </View>
          <View style={[styles.orbitNode, { bottom: 25, right: 25 }]}>
            <Ionicons name="footsteps-outline" size={14} color="#8EB3D3" />
          </View>
          <View style={[styles.orbitNode, { top: 95, right: 10 }]}>
            <Ionicons name="flag-outline" size={14} color="#8EB3D3" />
          </View>
          <View style={[styles.orbitNode, { bottom: 65, left: 15 }]}>
            <Ionicons name="time-outline" size={14} color="#8EB3D3" />
          </View>
        </View>
      </View>
    );
  }

  return null;
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
          Animated.timing(scale, { toValue: 1.5, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
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
    desc: 'Search for any classroom, lab, or office on campus. We calculate the optimal path, guiding you seamlessly across multiple floors.',
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
      useNativeDriver: true,
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
        useNativeDriver: true,
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

    // 5. Wordmark + Subtitle + CTA reveal sequence
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(wordmarkTranslate, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.delay(150),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const transitionTo = (newScreen) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSubScreen(newScreen);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleNextSlide = () => {
    if (slideIndex < TUTORIAL_SLIDES.length - 1) {
      Animated.timing(slideFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setSlideIndex(prev => prev + 1);
        Animated.timing(slideFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      transitionTo('REGISTER');
    }
  };

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      Animated.timing(slideFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setSlideIndex(prev => prev - 1);
        Animated.timing(slideFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleRegister = () => {
    setValidationErr('');
    if (!name.trim()) {
      setValidationErr('Please enter your full name.');
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
      saveUserProfile(name.trim(), cleanEmail, selectedRole);
      
      setSubScreen('GREETING');
      Animated.timing(greetingAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }).start(() => {
            onFinish();
          });
        }, 1800);
      });
    } catch (e) {
      setValidationErr('Error completing setup. Please try again.');
    }
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
                  colors={['#00E5FF', '#2979FF']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <View style={styles.centerIconInner}>
                  <Ionicons name="navigate-outline" size={22} color="#2979FF" />
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
                <LinearGradient
                  colors={['#8EB3D3', '#7CA2C4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.ctaBtnText}>Get started</Text>
                <Ionicons name="arrow-forward" size={17} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* ── STAGE 2: SWIPE TUTORIAL CARDS ────────────────────────────────── */}
        {subScreen === 'TUTORIAL' && (
          <View style={styles.tutorialContent}>
            <View style={styles.tutorialHeader}>
              {slideIndex > 0 ? (
                <TouchableOpacity onPress={handlePrevSlide} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                  <Ionicons name="chevron-back" size={20} color="#64748B" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.progressIndicatorLabel}>STEP {slideIndex + 1} OF {TUTORIAL_SLIDES.length}</Text>
              )}
              
              {/* Centered logo matching mockup layout */}
              <View style={styles.headerLogoContainer}>
                <Ionicons name="navigate-outline" size={16} color="#1E293B" style={{ marginRight: 4 }} />
                <Text style={styles.headerLogoText}>pathverse</Text>
              </View>

              <TouchableOpacity onPress={() => transitionTo('REGISTER')} hitSlop={{top:15, bottom:15, left:15, right:15}}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Illustration Graphic */}
            <SlideGraphic index={slideIndex} />

            {/* Text container directly on screen */}
            <Animated.View style={[styles.slideTextContainer, { opacity: slideFadeAnim }]}>
              <Text style={styles.slideTitleText}>{activeSlide.title}</Text>
              <Text style={styles.slideDescText}>{activeSlide.desc}</Text>
            </Animated.View>

            {/* Swipe dots */}
            <View style={styles.progressDotsContainer}>
              {TUTORIAL_SLIDES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    slideIndex === idx ? styles.indicatorDotActive : null
                  ]}
                />
              ))}
            </View>

            {/* Bottom wide action button */}
            <View style={styles.bottomCtaRow}>
              <TouchableOpacity
                style={styles.nextSlideBtnFull}
                onPress={handleNextSlide}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#8EB3D3', '#7CA2C4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.nextSlideBtnTextFull}>
                  {slideIndex === TUTORIAL_SLIDES.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STAGE 3: ACCOUNT CREATION / PROFILE SETUP ─────────────────────── */}
        {subScreen === 'REGISTER' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.registerContainer}
          >
            <ScrollView
              contentContainerStyle={styles.registerScrollArea}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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

              {/* Form Input fields */}
              <View style={styles.formInputCard}>
                <Text style={styles.textLabel}>Full name</Text>
                <View style={[
                  styles.formInputContainer,
                  nameFocused && styles.formInputContainerFocused
                ]}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={nameFocused ? '#2979FF' : '#94A3B8'}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="example"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                <View style={{ height: 16 }} />

                <Text style={styles.textLabel}>Email address</Text>
                <View style={[
                  styles.formInputContainer,
                  emailFocused && styles.formInputContainerFocused
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={emailFocused ? '#2979FF' : '#94A3B8'}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                </View>

                <View style={{ height: 20 }} />

                <Text style={styles.textLabel}>Sign up as</Text>
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

              <TouchableOpacity
                style={styles.finishBtn}
                activeOpacity={0.8}
                onPress={handleRegister}
              >
                <LinearGradient
                  colors={['#8EB3D3', '#7CA2C4']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.finishBtnText}>Create account</Text>
                <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
              </TouchableOpacity>
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

  // ── STAGE 1: INTRO RADAR STYLES ─────────────────────────────────────────
  introContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  
  radarFrame: {
    width: 320, height: 320,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  radarRingStatic: {
    position: 'absolute',
    width: 68, height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.55)',
  },
  radarRing1: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(0, 229, 255, 0.65)',
  },
  radarRing2: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(41, 121, 255, 0.55)',
    borderStyle: 'dashed',
  },
  radarRing3: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  pingDot: {
    position: 'absolute',
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF', shadowOpacity: 0.8, shadowRadius: 4,
  },
  orbitContainer: {
    position: 'absolute',
    width: 180, height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(41, 121, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitingCyanBall: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
    shadowColor: '#00E5FF', shadowOpacity: 0.8, shadowRadius: 5,
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
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 36,
    alignSelf: 'center',
    shadowColor: '#8EB3D3', shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaBtnText: {
    color: '#fff', fontSize: 15, fontWeight: '700',
    fontFamily: FONT_BODY, letterSpacing: 0.5,
  },

  // ── STAGE 2: SWIPE TUTORIAL STYLES ──────────────────────────────────────
  tutorialContent: { flex: 1, justifyContent: 'space-between', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 30 },
  tutorialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressIndicatorLabel: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 2, fontFamily: FONT_TITLE },
  skipBtnText: { color: '#64748B', fontSize: 13, fontWeight: '700', fontFamily: FONT_BODY },
  
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

  graphicContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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

  slideTextContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginVertical: 15,
  },
  slideTitleText: {
    color: '#1E293B', fontSize: 26, fontWeight: '900',
    fontFamily: FONT_TITLE, marginBottom: 12, letterSpacing: 0.3,
    textAlign: 'center',
  },
  slideDescText: {
    color: '#64748B', fontSize: 14, fontWeight: '500',
    fontFamily: FONT_BODY, lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  progressDotsContainer: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 20 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  indicatorDotActive: { width: 20, backgroundColor: '#8EB3D3' },

  bottomCtaRow: { width: '100%', paddingHorizontal: 4 },
  nextSlideBtnFull: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8EB3D3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  nextSlideBtnTextFull: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: FONT_BODY },

  // ── STAGE 3: PROFILE SETUP STYLES ───────────────────────────────────────
  registerContainer: { flex: 1, paddingTop: 60 },
  registerScrollArea: { paddingHorizontal: 28, paddingBottom: 40, alignItems: 'center' },
  
  formIntro: { alignItems: 'center', marginBottom: 28 },
  shieldPulseIcon: {
    width: 68, height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2979FF', shadowOpacity: 0.15, shadowRadius: 8,
  },
  profileTitleText: { color: '#1E293B', fontSize: 26, fontWeight: '900', fontFamily: FONT_TITLE, marginBottom: 8 },
  profileSubText: {
    color: '#64748B', fontSize: 13, fontWeight: '500',
    fontFamily: FONT_BODY, textAlign: 'center', lineHeight: 18,
    paddingHorizontal: 10,
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
    backgroundColor: '#8EB3D3',
    borderColor: '#8EB3D3',
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

  formInputCard: {
    width: '100%', borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 28, overflow: 'hidden',
    elevation: 2,
  },
  textLabel: {
    color: '#64748B', fontSize: 11, fontWeight: '700',
    fontFamily: FONT_BODY, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 8,
  },
  formInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  formInputContainerFocused: {
    borderColor: '#2979FF',
    backgroundColor: '#FFF',
  },
  textInput: { flex: 1, color: '#1E293B', fontSize: 15, fontWeight: '600', fontFamily: FONT_BODY },
  
  validationErrorCard: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    backgroundColor: 'rgba(255,77,77,0.08)', padding: 10,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,77,77,0.2)',
  },
  validationErrorText: { color: '#ff4d4d', fontSize: 12, fontWeight: '600', fontFamily: FONT_BODY },
  
  finishBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 18, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#8EB3D3', shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: FONT_BODY, letterSpacing: 0.5 },

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
