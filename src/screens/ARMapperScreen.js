import React, { useState, useEffect, useRef, memo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Modal, KeyboardAvoidingView, Platform,
  Dimensions, Animated, Keyboard, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { ViroARScene, ViroARSceneNavigator, ViroBox, ViroMaterials, ViroText } from '@reactvision/react-viro';
import { addNode, addEdge, getAllNodes } from '../database/database';

// Euclidean 3D distance between two captured positions
const euclid3D = (a, b) => {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

ViroMaterials.createMaterials({
  mapperDot: { diffuseColor: '#2ecc71' }
});

// Global position — updated inside ViroARScene every frame
let _mapperPos = [0, 0, 0];

const MappingScene = () => {
  const onCameraTransformUpdate = (ct) => { _mapperPos = ct.position; };
  return (
    <ViroARScene onCameraTransformUpdate={onCameraTransformUpdate}>
      <ViroBox position={[0, -0.5, -0.8]} scale={[0.07, 0.07, 0.07]} materials={['mapperDot']} />
      <ViroText text="Mapper Active" position={[0, 0, -2]} scale={[0.25, 0.25, 0.25]} />
    </ViroARScene>
  );
};

const { height: SCREEN_H } = Dimensions.get('window');

// Dedicated sub-component for Live Coordinates to prevent whole screen re-renders
const LiveCoordinatesCard = memo(({ feedback, flashAnim }) => {
  const [coords, setCoords] = useState([0, 0, 0]);

  useEffect(() => {
    const iv = setInterval(() => {
      setCoords([_mapperPos[0], _mapperPos[1], _mapperPos[2]]);
    }, 200);
    return () => clearInterval(iv);
  }, []);

  const bgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(7, 20, 40, 0.85)', 'rgba(46, 204, 113, 0.35)'],
  });

  return (
    <Animated.View style={[styles.coordCard, { backgroundColor: bgColor }]}>
      <View style={styles.coordHeader}>
        <View style={styles.coordLiveDot} />
        <Text style={styles.coordLabel}>LIVE SPATIAL POSITION (METERS)</Text>
      </View>
      <Text style={styles.coordValues}>
        X <Text style={styles.coordNum}>{coords[0].toFixed(3)}</Text>
        {'   '}Y <Text style={styles.coordNum}>{coords[1].toFixed(3)}</Text>
        {'   '}Z <Text style={styles.coordNum}>{coords[2].toFixed(3)}</Text>
      </Text>
      {!!feedback && <Text style={styles.feedbackTxt}>{feedback}</Text>}
    </Animated.View>
  );
});

export default function ARMapperScreen({ onCancel }) {
  const viewShotRef                   = useRef(null);
  const [savedNodes, setSavedNodes]   = useState([]);
  const [modalVisible, setModal]      = useState(false);
  const [nodeType, setNodeType]       = useState('room');
  const [nodeName, setNodeName]       = useState('');
  const [capturedPos, setCapturedPos] = useState([0, 0, 0]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrStatus, setOcrStatus]     = useState('');
  const [feedback, setFeedback]       = useState('');
  const [autoConnect, setAutoConnect] = useState(false);
  const [activeParent, setActiveParent] = useState(null);
  const prevNodeRef = useRef(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Load saved nodes on initial mount (No default parent node set; user selects manually)
  useEffect(() => {
    const loaded = getAllNodes() || [];
    setSavedNodes(loaded);
    setActiveParent(null);
    prevNodeRef.current = null;
  }, []);

  // Flash animation when node is saved
  const flashSuccess = () => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
    ]).start();
  };

  const openCaptureModal = async () => {
    // Freeze coordinates at exact moment capture button is pressed
    setCapturedPos([_mapperPos[0], _mapperPos[1], _mapperPos[2]]);
    setNodeName('');
    setNodeType('room');
    setCapturedImage(null);
    setOcrStatus('📷 Capturing camera photo...');

    let photoUri = null;
    if (viewShotRef.current) {
      try {
        photoUri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.7, result: 'tmpfile' });
        setCapturedImage(photoUri);
        setOcrStatus('🔍 Scanning signboard text (OCR)...');
        
        const ocrResult = await TextRecognition.recognize(photoUri);
        if (ocrResult && ocrResult.text && ocrResult.text.trim().length > 0) {
          const firstLine = ocrResult.text.split('\n')[0].trim();
          if (firstLine.length >= 2) {
            setNodeName(firstLine);
            setOcrStatus(`✨ Auto-recognized: "${firstLine}"`);
          } else {
            setOcrStatus('📷 Photo captured! Enter name below.');
          }
        } else {
          setOcrStatus('📷 Photo captured! Enter name below.');
        }
      } catch (e) {
        console.log('Capture/OCR error:', e);
        setOcrStatus('📷 Photo captured! Enter name below.');
      }
    }
    setModal(true);
  };

  const handleSave = () => {
    if (!nodeName.trim()) {
      setFeedback('⚠️ Please enter a landmark name.');
      return;
    }
    const id = `loc_${Date.now()}`;
    const newNode = {
      id,
      name: nodeName.trim(),
      x: capturedPos[0],
      y: capturedPos[1],
      z: capturedPos[2],
      type: nodeType,
      image_uri: capturedImage
    };
    addNode(id, nodeName.trim(), capturedPos[0], capturedPos[1], capturedPos[2], nodeType, capturedImage);

    // Auto-Connect edge to active parent node
    const parentNode = activeParent || prevNodeRef.current;
    if (autoConnect && parentNode) {
      const d = euclid3D(
        [parentNode.x, parentNode.y, parentNode.z],
        [capturedPos[0], capturedPos[1], capturedPos[2]]
      );
      addEdge(parentNode.id, id, parseFloat(d.toFixed(2)));
    }
    prevNodeRef.current = newNode;
    setActiveParent(newNode);

    const updated = getAllNodes();
    setSavedNodes(updated);
    Keyboard.dismiss();
    setModal(false);
    setFeedback(`✅ "${nodeName.trim()}" saved! Photo attached.`);
    flashSuccess();
    setTimeout(() => setFeedback(''), 3000);
  };

  const typeOptions = [
    { label: 'Room', value: 'room', icon: 'business-outline' },
    { label: 'Corridor', value: 'corridor', icon: 'walk-outline' },
    { label: 'Stairs', value: 'stairs', icon: 'stats-chart-outline' },
    { label: 'Exit/Gate', value: 'exit', icon: 'log-out-outline' },
  ];

  return (
    <View style={styles.root}>
      {/* AR View wrapped in ViewShot for landmark camera snapshots */}
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.7 }} style={StyleSheet.absoluteFill}>
        <ViroARSceneNavigator
          autofocus
          initialScene={{ scene: MappingScene }}
          style={StyleSheet.absoluteFill}
        />
      </ViewShot>

      {/* ── TOP HEADER BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={onCancel} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.exitTxt}>Back</Text>
        </TouchableOpacity>

        {/* Auto-Connect Toggle */}
        <TouchableOpacity
          style={[styles.autoToggle, autoConnect && styles.autoToggleOn]}
          onPress={() => setAutoConnect(v => !v)}
          activeOpacity={0.7}
        >
          <Ionicons name={autoConnect ? "link" : "link-outline"} size={16} color={autoConnect ? "#2ecc71" : "#aaa"} />
          <Text style={[styles.autoToggleTxt, autoConnect && styles.autoToggleTxtOn]}>
            {autoConnect ? 'Auto Edge ON' : 'Auto Edge OFF'}
          </Text>
        </TouchableOpacity>

        <View style={styles.nodeCountBadge}>
          <Text style={styles.nodeCountTxt}>{savedNodes.length} Nodes</Text>
        </View>
      </View>

      {/* ── LIVE COORDINATE HUD CARD ── */}
      <LiveCoordinatesCard feedback={feedback} flashAnim={flashAnim} />

      {/* ── CAPTURE BUTTON ── */}
      <View style={styles.captureRow}>
        <TouchableOpacity style={styles.captureBtn} onPress={openCaptureModal} activeOpacity={0.85}>
          <LinearGradient
            colors={['#00e5ff', '#2979ff']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.captureBtnGradient}
          >
            <Ionicons name="camera" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.captureBtnTxt}>Capture Landmark & Photo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── SAVED LANDMARKS PANEL (TAP TO SELECT PARENT NODE FOR BRANCHING) ── */}
      {savedNodes.length > 0 && (
        <View style={styles.listContainer}>
          <View style={styles.listHeaderRow}>
            <Ionicons name="map-outline" size={16} color="#00e5ff" />
            <Text style={styles.listHeader}>Mapped Landmarks ({savedNodes.length}) — Tap to set parent</Text>
          </View>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {savedNodes.slice().reverse().map((n) => {
              const isParent = activeParent?.id === n.id;
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.listRow, isParent && { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: '#2ecc71', borderWidth: 1 }]}
                  onPress={() => {
                    setActiveParent(n);
                    prevNodeRef.current = n;
                    setFeedback(`🔗 Connect From set to: "${n.name}"`);
                    setTimeout(() => setFeedback(''), 2500);
                  }}
                  activeOpacity={0.7}
                >
                  {n.image_uri ? (
                    <Image source={{ uri: n.image_uri }} style={styles.listThumb} />
                  ) : (
                    <View style={[styles.typeDot, { backgroundColor: n.type === 'room' ? '#00e5ff' : n.type === 'stairs' ? '#f39c12' : '#2ecc71' }]} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listName, isParent && { color: '#2ecc71', fontWeight: 'bold' }]} numberOfLines={1}>
                      {n.name} {isParent ? ' 🔗 (Parent)' : ''}
                    </Text>
                  </View>
                  <Text style={styles.listCoords}>
                    ({n.x.toFixed(1)}, {n.y.toFixed(1)}, {n.z.toFixed(1)})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── CAPTURE MODAL (KEYBOARD-SAFE SLIDE UP WITH PHOTO PREVIEW) ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.modalKAV}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          >
            <View style={styles.modalCardContainer}>
              <LinearGradient colors={['#0a192f', '#0f2744']} style={styles.modalCard}>
                <ScrollView
                  contentContainerStyle={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.modalDragHandle} />
                  <Text style={styles.modalTitle}>📍 Landmark Details</Text>

                  {/* Captured Camera Snapshot Preview */}
                  {capturedImage && (
                    <View style={styles.photoPreviewWrap}>
                      <Image source={{ uri: capturedImage }} style={styles.capturedPhoto} />
                      {!!ocrStatus && <Text style={styles.ocrStatusTxt}>{ocrStatus}</Text>}
                    </View>
                  )}

                  {/* Frozen Captured Coordinates */}
                  <View style={styles.frozenCoords}>
                    <Text style={styles.frozenLabel}>LOCKED COORDINATES</Text>
                    <Text style={styles.frozenValues}>
                      X {capturedPos[0].toFixed(3)}   Y {capturedPos[1].toFixed(3)}   Z {capturedPos[2].toFixed(3)}
                    </Text>
                  </View>

                  {/* Auto-Connect Parent Node Indicator */}
                  {autoConnect && (
                    <View style={styles.parentBanner}>
                      <Ionicons name="link" size={15} color="#2ecc71" style={{ marginRight: 6 }} />
                      <Text style={styles.parentBannerTxt}>
                        Auto-Connecting Edge From: <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>{activeParent?.name || 'Start Anchor'}</Text>
                      </Text>
                    </View>
                  )}

                  {/* Landmark Name Input */}
                  <Text style={styles.inputLabel}>LANDMARK NAME</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Room 204, IT Lab 1, Stairs Base..."
                    placeholderTextColor="#64748b"
                    value={nodeName}
                    onChangeText={setNodeName}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                  />

                  {/* Node Type Selector */}
                  <Text style={styles.inputLabel}>NODE TYPE</Text>
                  <View style={styles.typeGrid}>
                    {typeOptions.map(t => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.typeChip, nodeType === t.value && styles.typeChipActive]}
                        onPress={() => setNodeType(t.value)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={t.icon}
                          size={15}
                          color={nodeType === t.value ? '#fff' : '#94a3b8'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.typeChipTxt, nodeType === t.value && styles.typeChipTxtActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelModalBtn}
                      onPress={() => { Keyboard.dismiss(); setModal(false); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelModalTxt}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave} activeOpacity={0.85}>
                      <LinearGradient
                        colors={['#2ecc71', '#27ae60']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.saveBtnGradient}
                      >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.saveModalTxt}>Save Node</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Top Bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 44, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: 'rgba(2, 8, 24, 0.75)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  exitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  exitTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  nodeCountBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.4)'
  },
  nodeCountTxt: { color: '#00e5ff', fontSize: 12, fontWeight: '800' },
  autoToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  autoToggleOn: { backgroundColor: 'rgba(46, 204, 113, 0.2)', borderColor: '#2ecc71' },
  autoToggleTxt: { color: '#aaa', fontSize: 12, fontWeight: '700' },
  autoToggleTxtOn: { color: '#2ecc71' },

  // Live Coordinates HUD
  coordCard: {
    position: 'absolute', top: Platform.OS === 'ios' ? 110 : 100, left: 16, right: 16,
    borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  coordHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  coordLiveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 8 },
  coordLabel:  { color: '#00e5ff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  coordValues: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  coordNum:    { color: '#2ecc71', fontWeight: '900' },
  feedbackTxt: { marginTop: 8, color: '#2ecc71', fontSize: 13, fontWeight: '700' },

  // Capture Button
  captureRow: {
    position: 'absolute', bottom: SCREEN_H * 0.28, left: 20, right: 20, alignItems: 'center'
  },
  captureBtn: {
    width: '100%', borderRadius: 30, overflow: 'hidden',
    shadowColor: '#00e5ff', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8,
  },
  captureBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 24,
  },
  captureBtnTxt: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  // Saved Landmarks Panel
  listContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_H * 0.25,
    backgroundColor: 'rgba(7, 20, 40, 0.92)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)',
    paddingTop: 14, paddingHorizontal: 18,
  },
  listHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  listHeader: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  list: { flex: 1 },
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)'
  },
  listThumb:  { width: 28, height: 28, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#00e5ff' },
  typeDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  listName:   { color: '#f8fafc', fontSize: 13, fontWeight: '600', flex: 1 },
  listCoords: { color: '#94a3b8', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  // Keyboard Safe Modal
  modalKAV: { flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
  modalCardContainer: { width: '100%', maxHeight: '85%' },
  modalCard: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.3)',
    overflow: 'hidden',
  },
  modalScroll: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  modalDragHandle: {
    width: 38, height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 14, textAlign: 'center' },

  photoPreviewWrap: {
    alignItems: 'center', marginBottom: 16, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1.5, borderColor: '#00e5ff',
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 6,
  },
  capturedPhoto: { width: '100%', height: 110, borderRadius: 12 },
  ocrStatusTxt:  { marginTop: 6, color: '#00e5ff', fontSize: 11, fontWeight: '800', textAlign: 'center' },

  frozenCoords: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.35)', marginBottom: 18,
  },
  frozenLabel:  { color: '#2ecc71', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  frozenValues: { color: '#fff', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13, fontWeight: '700' },

  parentBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.3)',
    marginBottom: 14,
  },
  parentBannerTxt: { color: '#e2e8f0', fontSize: 12, fontWeight: '600' },

  inputLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)', borderRadius: 14, padding: 14, fontSize: 15,
    color: '#fff', marginBottom: 18, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.25)'
  },

  typeGrid: { flexDirection: 'row', gap: 8, marginBottom: 22, flexWrap: 'wrap' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)'
  },
  typeChipActive: { backgroundColor: '#00e5ff', borderColor: '#00e5ff' },
  typeChipTxt: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  typeChipTxtActive: { color: '#071428' },

  modalActions: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  cancelModalTxt: { color: '#cbd5e1', fontWeight: '700', fontSize: 14 },
  saveModalBtn: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  saveBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14,
  },
  saveModalTxt: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
