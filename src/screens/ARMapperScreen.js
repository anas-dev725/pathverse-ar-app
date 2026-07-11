import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Modal, KeyboardAvoidingView, Platform,
  Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ViroARScene, ViroARSceneNavigator, ViroBox, ViroMaterials, ViroText } from '@reactvision/react-viro';
import { addNode, addEdge, getAllNodes } from '../database/database';

// Euclidean 3D distance between two captured positions
const euclid3D = (a, b) => {
  const dx = a[0]-b[0], dy = a[1]-b[1], dz = a[2]-b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
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
      <ViroText text="Mapper Active" position={[0, 0, -2]} scale={[0.25, 0.25, 0.25]}  />
    </ViroARScene>
  );
};

const { height: SCREEN_H } = Dimensions.get('window');

export default function ARMapperScreen({ onCancel }) {
  const [livePos, setLivePos]         = useState([0, 0, 0]);
  const [savedNodes, setSavedNodes]   = useState([]);
  const [modalVisible, setModal]      = useState(false);
  const [nodeType, setNodeType]       = useState('room');
  const [nodeName, setNodeName]       = useState('');
  const [capturedPos, setCapturedPos] = useState([0, 0, 0]);
  const [feedback, setFeedback]       = useState('');
  const [autoConnect, setAutoConnect] = useState(false);  // Instruction 5
  const prevNodeRef = useRef(null);                        // last captured node for auto-edge
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Poll live coordinates every 300ms
  useEffect(() => {
    const iv = setInterval(() => setLivePos([..._mapperPos]), 300);
    // Load already-saved nodes to display count
    setSavedNodes(getAllNodes());
    return () => clearInterval(iv);
  }, []);

  // Flash animation when node is saved
  const flashSuccess = () => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  };

  const openCaptureModal = () => {
    // Freeze the coordinates at the exact moment the button is pressed
    setCapturedPos([..._mapperPos]);
    setNodeName('');
    setNodeType('room');
    setModal(true);
  };

  const handleSave = () => {
    if (!nodeName.trim()) {
      setFeedback('⚠️  Please enter a landmark name.');
      return;
    }
    const id = `loc_${Date.now()}`;
    const newNode = { id, name: nodeName.trim(), x: capturedPos[0], y: capturedPos[1], z: capturedPos[2] };
    addNode(id, nodeName.trim(), capturedPos[0], capturedPos[1], capturedPos[2], nodeType);

    // Instruction 5: Auto-Connect — create edge to previous node automatically
    if (autoConnect && prevNodeRef.current) {
      const prev = prevNodeRef.current;
      const d = euclid3D(
        [prev.x, prev.y, prev.z],
        [capturedPos[0], capturedPos[1], capturedPos[2]]
      );
      addEdge(prev.id, id, parseFloat(d.toFixed(2)));
    }
    prevNodeRef.current = newNode;

    setSavedNodes(getAllNodes());
    setModal(false);
    setFeedback(`✅  "${nodeName.trim()}" saved!${autoConnect && prevNodeRef.current ? ' Auto-edge created.' : ''}`);
    flashSuccess();
    setTimeout(() => setFeedback(''), 2800);
  };

  const typeOptions = ['room', 'corridor', 'stairs', 'exit'];
  const bgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(46,204,113,0)', 'rgba(46,204,113,0.25)'],
  });

  return (
    <View style={styles.root}>
      {/* AR View fills the whole screen */}
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: MappingScene }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── TOP BAR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.exitBtn} onPress={onCancel}>
          <Text style={styles.exitTxt}>← Back</Text>
        </TouchableOpacity>
        {/* Instruction 5: Auto-Connect toggle */}
        <TouchableOpacity
          style={[styles.autoToggle, autoConnect && styles.autoToggleOn]}
          onPress={() => setAutoConnect(v => !v)}
        >
          <Text style={[styles.autoToggleTxt, autoConnect && styles.autoToggleTxtOn]}>
            {autoConnect ? '🔗 Auto ON' : '🔗 Auto OFF'}
          </Text>
        </TouchableOpacity>
        <View style={styles.nodeCountBadge}>
          <Text style={styles.nodeCountTxt}>{savedNodes.length} nodes</Text>
        </View>
      </View>

      {/* ── LIVE COORDINATE HUD ── */}
      <Animated.View style={[styles.coordCard, { backgroundColor: bgColor }]}>
        <Text style={styles.coordLabel}>LIVE POSITION</Text>
        <Text style={styles.coordValues}>
          X <Text style={styles.coordNum}>{livePos[0].toFixed(3)}</Text>
          {'   '}Y <Text style={styles.coordNum}>{livePos[1].toFixed(3)}</Text>
          {'   '}Z <Text style={styles.coordNum}>{livePos[2].toFixed(3)}</Text>
        </Text>
        {!!feedback && <Text style={styles.feedbackTxt}>{feedback}</Text>}
      </Animated.View>

      {/* ── CAPTURE BUTTON ── */}
      <View style={styles.captureRow}>
        <TouchableOpacity style={styles.captureBtn} onPress={openCaptureModal} activeOpacity={0.8}>
          <Text style={styles.captureBtnIcon}>📍</Text>
          <Text style={styles.captureBtnTxt}>Capture This Landmark</Text>
        </TouchableOpacity>
      </View>

      {/* ── SAVED NODE LIST (scrollable) ── */}
      {savedNodes.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Saved Landmarks</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {savedNodes.slice().reverse().map((n, i) => (
              <View key={n.id} style={styles.listRow}>
                <View style={[styles.typeDot, { backgroundColor: n.type === 'room' ? '#4db8ff' : n.type === 'stairs' ? '#f39c12' : '#2ecc71' }]} />
                <Text style={styles.listName}>{n.name}</Text>
                <Text style={styles.listCoords}>
                  ({n.x.toFixed(1)}, {n.y.toFixed(1)}, {n.z.toFixed(1)})
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── CAPTURE MODAL (keyboard-safe, slides up above keyboard) ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKAV}
          >
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.modalCard}>
              <Text style={styles.modalTitle}>📍 Capture Landmark</Text>

              {/* Frozen coordinates at time of capture */}
              <View style={styles.frozenCoords}>
                <Text style={styles.frozenLabel}>Coordinates locked at capture</Text>
                <Text style={styles.frozenValues}>
                  X {capturedPos[0].toFixed(3)}   Y {capturedPos[1].toFixed(3)}   Z {capturedPos[2].toFixed(3)}
                </Text>
              </View>

              {/* Landmark Name */}
              <Text style={styles.inputLabel}>Landmark Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g.  IT-301 Lab, Faculty Office..."
                placeholderTextColor="#666"
                value={nodeName}
                onChangeText={setNodeName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {/* Node Type Selector */}
              <Text style={styles.inputLabel}>Node Type</Text>
              <View style={styles.typeRow}>
                {typeOptions.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, nodeType === t && styles.typeChipActive]}
                    onPress={() => setNodeType(t)}
                  >
                    <Text style={[styles.typeChipTxt, nodeType === t && styles.typeChipTxtActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelModalTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSave}>
                  <Text style={styles.saveModalTxt}>Save to SQLite</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  exitTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  nodeCountBadge: {
    backgroundColor: 'rgba(77,184,255,0.2)', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#4db8ff'
  },
  nodeCountTxt: { color: '#4db8ff', fontSize: 13, fontWeight: '700' },
  autoToggle: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  autoToggleOn: { backgroundColor: 'rgba(46,204,113,0.2)', borderColor: '#2ecc71' },
  autoToggleTxt: { color: '#aaa', fontSize: 13, fontWeight: '700' },
  autoToggleTxtOn: { color: '#2ecc71' },

  // Live coords
  coordCard: {
    position: 'absolute', top: 110, left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(77,184,255,0.3)',
  },
  coordLabel:  { color: '#4db8ff', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  coordValues: { color: '#aaa', fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  coordNum:    { color: '#2ecc71', fontWeight: '900' },
  feedbackTxt: { marginTop: 8, color: '#2ecc71', fontSize: 13, fontWeight: '700' },

  // Capture button
  captureRow: {
    position: 'absolute', bottom: SCREEN_H * 0.28, left: 16, right: 16, alignItems: 'center'
  },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4db8ff', paddingVertical: 17, paddingHorizontal: 30,
    borderRadius: 30, elevation: 8,
    shadowColor: '#4db8ff', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 10,
  },
  captureBtnIcon: { fontSize: 22, marginRight: 10 },
  captureBtnTxt:  { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.3 },

  // Saved node list
  listContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SCREEN_H * 0.25,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingTop: 14, paddingHorizontal: 16,
  },
  listHeader: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 8, letterSpacing: 0.5 },
  list: { flex: 1 },
  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)'
  },
  typeDot:    { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  listName:   { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  listCoords: { color: '#aaa', fontSize: 11, fontFamily: 'monospace' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalKAV: { width: '100%' },
  modalCard: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 20, textAlign: 'center' },

  frozenCoords: {
    backgroundColor: 'rgba(46,204,113,0.1)', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)', marginBottom: 20,
  },
  frozenLabel:  { color: '#2ecc71', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  frozenValues: { color: '#fff', fontFamily: 'monospace', fontSize: 13, fontWeight: '600' },

  inputLabel: { color: '#A0B0B9', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  modalInput: {
    backgroundColor: '#1e2a3a', borderRadius: 12, padding: 15, fontSize: 16,
    color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 26, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)'
  },
  typeChipActive: { backgroundColor: '#4db8ff', borderColor: '#4db8ff' },
  typeChipTxt: { color: '#aaa', fontWeight: '600', fontSize: 13 },
  typeChipTxtActive: { color: '#fff' },

  modalActions: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: {
    flex: 1, padding: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  cancelModalTxt: { color: '#aaa', fontWeight: '700', fontSize: 15 },
  saveModalBtn: {
    flex: 2, padding: 16, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#2ecc71', elevation: 4,
    shadowColor: '#2ecc71', shadowOpacity: 0.5, shadowRadius: 8
  },
  saveModalTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
