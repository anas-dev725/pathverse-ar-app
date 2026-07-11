import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, Dimensions,
  Animated, TextInput, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ocrSearchNodes, fuzzySearchRooms } from '../services/SearchService';
import { getAllNodes, addOCRLog } from '../database/database';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

const SCAN_DIR = FileSystem.documentDirectory + 'ocr_scans/';
FileSystem.makeDirectoryAsync(SCAN_DIR, { intermediates: true }).catch(() => {});

const { width: W, height: H } = Dimensions.get('window');
const FRAME_SIZE = W * 0.72;

export default function ScannerScreen({ onAnchorFound, onCancel, preselectedDestination }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef     = useRef(null);
  const viewShotRef   = useRef(null);
  const scanRunning   = useRef(false);

  const [nodes, setNodes]       = useState([]);
  const [phase, setPhase]       = useState('CALIBRATING');
  const [anchorNode, setAnchor] = useState(null);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [ocrDebug, setOcrDebug] = useState('');
  const [scanCount, setScanCount] = useState(0);

  // Animations
  const ringScale   = useRef(new Animated.Value(0.9)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;
  const scanLineY   = useRef(new Animated.Value(0)).current;
  const pulseDot    = useRef(new Animated.Value(1)).current;
  const successScale= useRef(new Animated.Value(0)).current;
  const successOp   = useRef(new Animated.Value(0)).current;
  const searchSlide = useRef(new Animated.Value(H * 0.5)).current;
  const searchOp    = useRef(new Animated.Value(0)).current;
  const statusAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setNodes(getAllNodes());

    Speech.speak('Please point your camera at the nearest room sign to calibrate.', {
      language: 'en-US', rate: 0.9,
    });

    // Breathing outer ring
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(ringScale,   { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.9,  duration: 1200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ringScale,   { toValue: 0.9,  duration: 1200, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0.35, duration: 1200, useNativeDriver: true }),
      ]),
    ])).start();

    // Scan line sweep
    Animated.loop(
      Animated.timing(scanLineY, { toValue: 1, duration: 1800, useNativeDriver: true })
    ).start();

    // Red dot pulse
    Animated.loop(Animated.sequence([
      Animated.timing(pulseDot, { toValue: 1.7, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseDot, { toValue: 1,   duration: 600, useNativeDriver: true }),
    ])).start();

    return () => { scanRunning.current = false; Speech.stop(); };
  }, []);

  useEffect(() => {
    setResults(query ? fuzzySearchRooms(query, nodes) : []);
  }, [query, nodes]);

  const scanLoop = useCallback(async () => {
    if (!scanRunning.current || !cameraRef.current) return;

    let persistentUri = null;
    let rawText = '';

    try {
      if (!cameraRef.current) return;
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      const uri = photo.uri;
      persistentUri = uri;

      const result = await TextRecognition.recognize(uri);
      rawText = result.blocks.map(b => b.text).join('\n');

      setScanCount(c => c + 1);
      const preview = rawText.trim().slice(0, 60);
      setOcrDebug(preview || 'Analyzing…');

      const candidates = [
        ...result.blocks.map(b => b.text),
        ...result.blocks.flatMap(b => b.lines?.map?.(l => l.text) ?? []),
        rawText,
      ];

      for (const text of candidates) {
        const matches = ocrSearchNodes(text, nodes);
        if (matches.length > 0) {
          scanRunning.current = false;
          const detected = matches[0];
          addOCRLog(persistentUri, rawText, detected.name);

          setAnchor(detected);
          setOcrDebug(`✓ ${detected.name}`);

          if (preselectedDestination) {
            Speech.speak(
              `Location confirmed. ${detected.name} detected. Navigating to ${preselectedDestination.name}.`,
              { language: 'en-US', rate: 0.93 }
            );

            // Success animation
            Animated.parallel([
              Animated.spring(successScale, { toValue: 1, friction: 4, useNativeDriver: true }),
              Animated.timing(successOp,   { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();

            setTimeout(() => {
              successOp.setValue(0); successScale.setValue(0);
              onAnchorFound(detected, preselectedDestination);
            }, 1600);
            return;
          }

          Speech.speak(
            `Location confirmed. ${detected.name} detected. Where would you like to go?`,
            { language: 'en-US', rate: 0.93 }
          );

          // Success animation
          Animated.parallel([
            Animated.spring(successScale, { toValue: 1, friction: 4, useNativeDriver: true }),
            Animated.timing(successOp,   { toValue: 1, duration: 250, useNativeDriver: true }),
          ]).start();

          setTimeout(() => {
            successOp.setValue(0); successScale.setValue(0);
            setPhase('SELECTING');
            Animated.parallel([
              Animated.spring(searchSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
              Animated.timing(searchOp,   { toValue: 1, duration: 350, useNativeDriver: true }),
            ]).start();
          }, 1600);
          return;
        }
      }

      addOCRLog(persistentUri, rawText, '');
    } catch (e) {
      console.error("Scanner OCR loop error:", e);
      if (persistentUri) addOCRLog(persistentUri, rawText, '');
    }

    if (scanRunning.current) setTimeout(scanLoop, 1200);
  }, [nodes]);

  const onCameraReady = useCallback(() => {
    if (!scanRunning.current) {
      scanRunning.current = true;
      setTimeout(scanLoop, 800);
    }
  }, [scanLoop]);

  const selectDestination = (dest) => {
    setPhase('LOCKED');
    Speech.speak(`Navigating to ${dest.name}. Starting AR guidance.`, { language: 'en-US' });
    setTimeout(() => onAnchorFound(anchorNode, dest), 600);
  };

  const selectManualStart = (node) => {
    setAnchor(node);
    setQuery('');
    setPhase('SELECTING');
  };

  const showManualPicker = () => {
    scanRunning.current = false;
    setPhase('MANUAL_START');
    Animated.parallel([
      Animated.spring(searchSlide, { toValue: 0, friction: 8, useNativeDriver: true }),
      Animated.timing(searchOp,   { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#020818', '#071428']} style={styles.permContainer}>
        <View style={styles.permCard}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>
            Pathverse AR reads room signs using Google ML Kit OCR to establish your indoor position — no GPS needed.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnTxt}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const scanTranslate = scanLineY.interpolate({
    inputRange: [0, 1], outputRange: [-FRAME_SIZE / 2 + 4, FRAME_SIZE / 2 - 4]
  });
  const allRooms = nodes.filter(n => n.type === 'room');

  return (
    <View style={styles.root}>
      {/* ── CAMERA ── */}
      <View collapsable={false} ref={viewShotRef} style={StyleSheet.absoluteFill}>
        <CameraView 
          ref={cameraRef}
          style={StyleSheet.absoluteFill} 
          facing="back" 
          onCameraReady={onCameraReady} 
        />
      </View>

      {/* ── GRADIENT OVERLAYS ── */}
      {/* Top fade */}
      <LinearGradient
        colors={['rgba(2,8,24,0.92)', 'rgba(2,8,24,0.4)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      {/* Bottom fade */}
      <LinearGradient
        colors={['transparent', 'rgba(2,8,24,0.5)', 'rgba(2,8,24,0.85)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.stepLabel}>{phase === 'CALIBRATING' ? 'STEP 1 / 2' : 'STEP 2 / 2'}</Text>
          <Text style={styles.stepTitle}>{phase === 'CALIBRATING' ? 'Find Your Location' : 'Choose Destination'}</Text>
        </View>

        {/* Live indicator */}
        <View style={styles.liveChip}>
          <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseDot }] }]} />
          <Text style={styles.liveTxt}>LIVE</Text>
        </View>
      </View>

      {/* ── SCAN FRAME (CALIBRATING phase) ── */}
      {phase === 'CALIBRATING' && (
        <View style={styles.scanCenter} pointerEvents="none">

          {/* Instruction text above frame */}
          <Text style={styles.instructTxt}>Point at a door number or room sign</Text>

          {/* Outer breathing ring */}
          <Animated.View style={[styles.outerRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Sweep line */}
            <Animated.View style={[styles.sweepLine, { transform: [{ translateY: scanTranslate }] }]}>
              <LinearGradient
                colors={['transparent', '#4db8ff', '#4db8ff', 'transparent']}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* OCR debug — what ML Kit actually reads */}
          <View style={styles.ocrReadout}>
            <Ionicons name="eye-outline" size={14} color="#4db8ff" />
            <Text style={styles.ocrReadoutTxt} numberOfLines={1}>
              {ocrDebug || (scanCount > 0 ? `${scanCount} frames analyzed…` : 'Starting scanner…')}
            </Text>
          </View>
        </View>
      )}

      {/* ── SUCCESS FLASH ── */}
      <Animated.View
        style={[styles.successOverlay, { opacity: successOp, transform: [{ scale: successScale }] }]}
        pointerEvents="none"
      >
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={52} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Location Found!</Text>
        {anchorNode && <Text style={styles.successSub}>{anchorNode.name}</Text>}
      </Animated.View>

      {/* ── MANUAL OVERRIDE (bottom of calibration phase) ── */}
      {phase === 'CALIBRATING' && (
        <View style={styles.manualWrap}>
          <TouchableOpacity style={styles.manualBtn} onPress={showManualPicker} activeOpacity={0.7}>
            <Ionicons name="list-outline" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.manualTxt}>Sign not showing? Select manually</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── DESTINATION SEARCH PANEL (phase 2 & Manual Start) ── */}
      {(phase === 'SELECTING' || phase === 'MANUAL_START') && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.searchKAV}
        >
          <Animated.View style={[styles.searchPanel, { opacity: searchOp, transform: [{ translateY: searchSlide }] }]}>
            {/* Handle pill */}
            <View style={styles.panelHandle} />

            {/* Anchor confirmed row (only shown in Phase 2) */}
            {phase === 'SELECTING' && (
              <View style={styles.anchorRow}>
                <View style={styles.anchorIconWrap}>
                  <Ionicons name="radio-button-on" size={14} color="#9b59b6" />
                </View>
                <Text style={styles.anchorTxt}>
                  {anchorNode ? `Starting at: ${anchorNode.name}` : ''}
                </Text>
              </View>
            )}

            <Text style={styles.searchTitle}>
              {phase === 'MANUAL_START' ? 'Where are you currently?' : 'Where to?'}
            </Text>

            {/* Search input */}
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={18} color="#4db8ff" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search rooms, labs, offices…"
                placeholderTextColor="#37474F"
                value={query}
                onChangeText={setQuery}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#455A64" />
                </TouchableOpacity>
              )}
            </View>

            {/* Results */}
            <ScrollView
              style={styles.resultList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {(query.length === 0 ? allRooms : results).map(item => (
                <TouchableOpacity 
                   key={item.id} 
                   style={styles.resultItem} 
                   onPress={() => phase === 'MANUAL_START' ? selectManualStart(item) : selectDestination(item)} 
                   activeOpacity={0.7}
                >
                  <View style={styles.resultIcon}>
                    <Ionicons name="location" size={16} color="#4db8ff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultSub}>IoBM · {item.type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                </TouchableOpacity>
              ))}
              {query.length > 0 && results.length === 0 && (
                <View style={styles.noResultWrap}>
                  <Text style={styles.noResultTxt}>No rooms found for "{query}"</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const CORNER_SZ = 28;
const CORNER_TK = 3;
const CORNER_R  = 6;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Gradient overlays
  topGradient:    { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.28 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.25 },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingHorizontal: 18, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  topCenter: { flex: 1, alignItems: 'center' },
  stepLabel: { color: '#4db8ff', fontSize: 10, fontWeight: '800', letterSpacing: 2.5 },
  stepTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginTop: 2 },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,60,60,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,60,60,0.3)' },
  liveDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ff4d4d' },
  liveTxt:  { color: '#ff4d4d', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },

  // Scan frame
  scanCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  instructTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600', marginBottom: 28, letterSpacing: 0.3 },

  outerRing: {
    position: 'absolute',
    width: FRAME_SIZE + 48, height: FRAME_SIZE + 48,
    borderRadius: 28, borderWidth: 1.5, borderColor: 'rgba(77,184,255,0.3)',
  },

  scanFrame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },

  // Corner brackets
  corner: { position: 'absolute', width: CORNER_SZ, height: CORNER_SZ },
  cornerTL: { top: 0, left: 0,
    borderTopWidth: CORNER_TK, borderLeftWidth: CORNER_TK,
    borderColor: '#4db8ff', borderTopLeftRadius: CORNER_R },
  cornerTR: { top: 0, right: 0,
    borderTopWidth: CORNER_TK, borderRightWidth: CORNER_TK,
    borderColor: '#4db8ff', borderTopRightRadius: CORNER_R },
  cornerBL: { bottom: 0, left: 0,
    borderBottomWidth: CORNER_TK, borderLeftWidth: CORNER_TK,
    borderColor: '#4db8ff', borderBottomLeftRadius: CORNER_R },
  cornerBR: { bottom: 0, right: 0,
    borderBottomWidth: CORNER_TK, borderRightWidth: CORNER_TK,
    borderColor: '#4db8ff', borderBottomRightRadius: CORNER_R },

  // Sweep line
  sweepLine: { position: 'absolute', left: 0, right: 0, height: 2 },

  // OCR readout
  ocrReadout: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 28, backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(77,184,255,0.25)',
    maxWidth: W * 0.85,
  },
  ocrReadoutTxt: { color: '#4db8ff', fontSize: 12, fontWeight: '600', flex: 1 },

  // Manual button
  manualWrap: { position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' },
  manualBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 24, paddingHorizontal: 20, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  manualTxt: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', flex: 1 },

  // Success overlay
  successOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#2ecc71', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2ecc71', shadowOpacity: 0.6, shadowRadius: 24,
  },
  successTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 6 },
  successSub:   { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },

  // Search panel
  searchKAV:    { position: 'absolute', bottom: 0, left: 0, right: 0 },
  searchPanel:  {
    backgroundColor: '#0c1a30',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 14, paddingHorizontal: 22, paddingBottom: 44,
    borderTopWidth: 1, borderColor: 'rgba(77,184,255,0.18)',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  panelHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  anchorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  anchorIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(155,89,182,0.18)', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(155,89,182,0.35)' },
  anchorTxt: { color: '#A0B0B9', fontSize: 13, fontWeight: '700' },
  searchTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 18 },
  searchInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(77,184,255,0.2)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  resultList:  { maxHeight: 260 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  resultIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(77,184,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(77,184,255,0.2)',
  },
  resultName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  resultSub:  { color: '#455A64', fontSize: 11 },
  noResultWrap: { paddingVertical: 30, alignItems: 'center' },
  noResultTxt:  { color: '#455A64', fontSize: 14 },

  // Permission screen
  permContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  permCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 28, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  permIcon:   { fontSize: 60, marginBottom: 20 },
  permTitle:  { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  permSub:    { color: '#607D8B', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permBtn:    { backgroundColor: '#4db8ff', paddingHorizontal: 36, paddingVertical: 16, borderRadius: 18 },
  permBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
