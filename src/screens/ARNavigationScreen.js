import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  ViroARScene, ViroARSceneNavigator, ViroText,
  ViroTrackingStateConstants, ViroNode, ViroPolyline,
  ViroImage, ViroMaterials, ViroAnimations, ViroDirectionalLight
} from '@reactvision/react-viro';
import ViewShot, { captureRef } from 'react-native-view-shot';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as Speech from 'expo-speech';
import { ocrSearchNodes } from '../services/SearchService';
import { getAllNodes } from '../database/database';

// ── Materials ───────────────────────────────────────────────────────────────
ViroMaterials.createMaterials({
  neonGreen:  { diffuseColor: '#00FF00', lightingModel: 'Constant' },
  destMarker: { diffuseColor: '#FF6B35', lightingModel: 'Constant' },
});

// ── Animations: gentle hover + destination pulse ────────────────────────────
ViroAnimations.registerAnimations({
  hoverUp:      { properties: { positionY: '+=0.04' }, duration: 700, easing: 'EaseInEaseOut' },
  hoverDown:    { properties: { positionY: '-=0.04' }, duration: 700, easing: 'EaseInEaseOut' },
  hoverLoop:    [['hoverUp', 'hoverDown']],
  pulseUp:      { properties: { scaleX: 1.15, scaleY: 1.15, scaleZ: 1.15 }, duration: 600, easing: 'EaseInEaseOut' },
  pulseDown:    { properties: { scaleX: 1.0,  scaleY: 1.0,  scaleZ: 1.0  }, duration: 600, easing: 'EaseInEaseOut' },
  pulseLoop:    [['pulseUp', 'pulseDown']],
});

// ── Image assets ────────────────────────────────────────────────────────────
const CHEVRON_IMG     = require('../../assets/neon_chevron_trans.png');
const DESTINATION_IMG = require('../../assets/destination_diamond_trans.png');

// ── Global C++ ↔ JS bridge state (never re-initialised) ────────────────────
let _cameraPos    = [0, 0, 0];
let _originOffset = [0, 0, 0];   // maps SQLite anchor node → AR world origin
let _routeNodes   = [];
let _anchorNode   = null;

// Helper: euclidean distance ignoring Y (horizontal plane)
const eucXZ = (a, b) => {
  const dx = a[0] - b[0]; const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
};

// ── Interpolate chevron positions along path at fixed intervals ─────────────
const CHEVRON_SPACING = 0.5; // Denser sequence for a solid "runway" look

const interpolateChevrons = (worldPos) => {
  const chevrons = [];
  let distLeft = CHEVRON_SPACING / 2;

  for (let i = 0; i < worldPos.length - 1; i++) {
    const from = worldPos[i];
    const to = worldPos[i + 1];
    
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];
    const segLen = Math.sqrt(dx * dx + dz * dz);
    
    if (segLen < 0.01) continue;
    
    // Rotation perfectly facing the geometric path segment
    const angleDeg = Math.atan2(-dx, -dz) * (180 / Math.PI);

    let walked = 0;
    while (walked + distLeft <= segLen) {
      walked += distLeft;
      const t = walked / segLen;
      chevrons.push({
        pos: [
          from[0] + dx * t,
          from[1] + dy * t, // Smooth vertical interpolation (rising/sloping ramps)
          from[2] + dz * t
        ],
        rotY: angleDeg
      });
      distLeft = CHEVRON_SPACING;
    }
    distLeft -= (segLen - walked); 
  }
  
  return chevrons;
};

// ── Inner ViroARScene — NEVER unmounted ─────────────────────────────────────
const NavigationRouteScene = ({ sceneNavigator }) => {
  const [tracking, setTracking] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const onTrackingUpdated = s => setTracking(s === ViroTrackingStateConstants.TRACKING_NORMAL);

  // Expose re-render to outer component for re-localization
  sceneNavigator.viroAppProps.rerender = () => setRenderKey(k => k + 1);

  const ox = _originOffset[0];
  const oy = _originOffset[1];
  const oz = _originOffset[2];

  const nodes = _routeNodes;
  const anchor = _anchorNode;

  if (!nodes || nodes.length === 0 || !anchor) {
    return (
      <ViroARScene onTrackingUpdated={onTrackingUpdated}>
        <ViroText text={tracking ? 'Waiting for route...' : 'Initializing AR...'} scale={[0.3, 0.3, 0.3]} position={[0, 0, -1.5]} />
      </ViroARScene>
    );
  }

  // Standardized 3D mapping: map DB coords directly to AR coordinates,
  // making Y relative to the starting anchor node's height (shifted for floor level origin at -1.2).
  const worldPos = nodes.map(n => {
    return [
      n.x - ox,
      (n.y - oy) - 1.2,
      n.z - oz,
    ];
  });

  const chevronData = interpolateChevrons(worldPos);

  return (
    <ViroARScene 
      onTrackingUpdated={onTrackingUpdated} 
      key={renderKey}
      onCameraTransformUpdate={(ct) => { _cameraPos = ct.position; }}
    >
      <ViroDirectionalLight color="#ffffff" direction={[0, -1, 0]} />

      {/* ── Floor-laid transparent neon green chevrons (ViroImage) ── */}
      {chevronData.map((chev, i) => (
        <ViroNode
          key={`chev-${i}-${renderKey}`}
          position={chev.pos}
          rotation={[-90, chev.rotY, 0]}
          animation={{ name: 'hoverLoop', run: true, loop: true, delay: i * 100 }}
        >
          <ViroImage
            source={CHEVRON_IMG}
            width={0.6}
            height={0.6}
          />
        </ViroNode>
      ))}



      {/* ── Destination diamond marker (ViroImage) ── */}
      {nodes.length > 1 && (
        <ViroNode
          key={`dest-${renderKey}`}
          position={worldPos[worldPos.length - 1]}
          animation={{ name: 'pulseLoop', run: true, loop: true }}
        >
          <ViroImage
            source={DESTINATION_IMG}
            width={0.8}
            height={0.8}
            rotation={[-90, 0, 0]}
            position={[0, -0.8, 0]}
          />
          <ViroText
            text={`🏁 ${nodes[nodes.length - 1].name}`}
            scale={[0.12, 0.12, 0.12]}
            position={[0, 0.45, 0]}
            style={{ color: '#FF6B35', fontWeight: 'bold' }}
            transformBehaviors={['billboard']}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
};

// ── Outer component: HUD + voice + re-localization ──────────────────────────
export default function ARNavigationScreen({ routeNodes, anchorNode, onStop, onReturnHome }) {
  const viewShotRef   = useRef(null);
  const relocRunning  = useRef(false);
  const rerenderScene = useRef(null);
  const announcedNodes= useRef(new Set());   // prevents repeat voice for same node
  const arrivedRef    = useRef(false);

  const [distMeters, setDistMeters]   = useState(null);
  const [relocStatus, setRelocStatus] = useState('');
  const [showSummaryModal, setShowModal] = useState(false);
  const [totalRouteDistance, setTotalDistance] = useState('0.0');
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const relocOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    _routeNodes   = routeNodes   || [];
    _anchorNode   = anchorNode   || null;
    _originOffset = anchorNode
      ? [anchorNode.x, anchorNode.y, anchorNode.z]
      : [0, 0, 0];
    announcedNodes.current.clear();
    arrivedRef.current = false;

    // Calculate total route distance
    let dist = 0;
    if (_routeNodes.length > 1) {
      for (let i = 0; i < _routeNodes.length - 1; i++) {
        const dx = _routeNodes[i+1].x - _routeNodes[i].x;
        const dz = _routeNodes[i+1].z - _routeNodes[i].z;
        dist += Math.sqrt(dx*dx + dz*dz);
      }
    }
    setTotalDistance(dist.toFixed(1));

    // ── Welcome voice: tell user navigation has started ──────────────────
    const dest = (routeNodes || [])[routeNodes.length - 1];
    setTimeout(() => {
      if (dest) {
        Speech.speak(
          `Navigation started. Head towards ${dest.name}. Follow the green arrows on the floor.`,
          { language: 'en-US', rate: 0.92 }
        );
      }
    }, 1500); // Wait for AR to initialise before speaking

    // Pulsing HUD badge
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ])).start();

    // ── Distance polling + proximity voice ───────────────────────────────
    // WARMUP: Wait 10s before enabling proximity/arrival checks.
    // This prevents false-positives because at t=0, _cameraPos=[0,0,0]
    // and the anchor world-position is also [0,0,0], so dist=0 triggers
    // the arrival sound immediately on every session start.
    let warmupDone = false;
    const warmupTimer = setTimeout(() => { warmupDone = true; }, 3000);

    const distIv = setInterval(() => {
      if (!_routeNodes.length) return;
      const finalDest = _routeNodes[_routeNodes.length - 1];
      const destWorld = [
        finalDest.x - _originOffset[0],
        (finalDest.y - _originOffset[1]) - 1.2,
        finalDest.z - _originOffset[2]
      ];

      const dx = _cameraPos[0] - destWorld[0];
      const dy = _cameraPos[1] - destWorld[1];
      const dz = _cameraPos[2] - destWorld[2];
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      const distY = Math.abs(dy);

      // Display horizontal distance on the HUD when on the same floor, 
      // but if the target is on a different floor (dy > 2.0m), show full 3D distance.
      let displayDist = distXZ;
      if (distY > 2.0) {
        displayDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      }
      setDistMeters(displayDist.toFixed(1));

      if (!warmupDone) return; // skip voice until user has had time to move

      // 3D Arrival check: horizontal distance < 1.5m and vertical elevation matches within 2m tolerance
      if (!arrivedRef.current && distXZ < 1.5 && distY < 2.0) {
        arrivedRef.current = true;
        Speech.speak('You have reached your destination.', { language: 'en-US', rate: 0.92, pitch: 1.1 });
        setShowModal(true);
      }

      // Intermediate node proximity — announce once per node, within 3D bounding box
      _routeNodes.forEach((node, i) => {
        if (i === 0) return; // skip anchor node itself
        const nWorld = [
          node.x - _originOffset[0],
          (node.y - _originOffset[1]) - 1.2,
          node.z - _originOffset[2]
        ];
        const ndx = _cameraPos[0] - nWorld[0];
        const ndy = _cameraPos[1] - nWorld[1];
        const ndz = _cameraPos[2] - nWorld[2];
        const ndistXZ = Math.sqrt(ndx * ndx + ndz * ndz);
        const ndistY = Math.abs(ndy);

        if (ndistXZ < 2.0 && ndistY < 2.0 && !announcedNodes.current.has(node.id)) {
          announcedNodes.current.add(node.id);
          // If the next node is a transition node (e.g. stairs) and we are changing elevation:
          const prevNode = _routeNodes[i - 1];
          if (node.type === 'stairs' && prevNode && Math.abs(node.y - prevNode.y) > 0.5) {
            Speech.speak(`Approaching stairs. Prepare to transition to the next floor.`, { language: 'en-US', rate: 0.95 });
          } else {
            Speech.speak(`Approaching ${node.name}`, { language: 'en-US', rate: 0.95 });
          }
        }
      });
    }, 300);

    // Start passive re-localization loop
    relocRunning.current = true;
    relocLoop();

    return () => {
      clearInterval(distIv);
      clearTimeout(warmupTimer);
      relocRunning.current = false;
      Speech.stop();
    };
  }, []);

  // Silent snap re-localization (Instruction 7)
  const relocLoop = useCallback(async () => {
    if (!relocRunning.current) return;
    try {
      if (viewShotRef.current) {
        const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.5, result: 'tmpfile' });
        const result = await TextRecognition.recognize(uri);
        const allNodes = getAllNodes();
        for (const block of result.blocks) {
          const matches = ocrSearchNodes(block.text, allNodes);
          if (matches.length > 0 && matches[0].id !== _anchorNode?.id) {
            const det = matches[0];
            _originOffset = [
              det.x - _cameraPos[0],
              det.y - _cameraPos[1],
              det.z - _cameraPos[2],
            ];
            _anchorNode = det;
            // Flash purple banner
            setRelocStatus(`📡 Re-anchored: ${det.name}`);
            Animated.sequence([
              Animated.timing(relocOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
              Animated.delay(2200),
              Animated.timing(relocOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
            ]).start(() => setRelocStatus(''));
            if (rerenderScene.current) rerenderScene.current();
            break;
          }
        }
      }
    } catch (_) {}
    if (relocRunning.current) setTimeout(relocLoop, 3000);
  }, []);


  const dest = routeNodes?.[routeNodes.length - 1];
  const startNode = routeNodes?.[0];

  // Dynamically calculate stats for the arrival success modal
  const walkSpeed = 1.2; // 1.2 meters per second
  const timeSeconds = Math.round(parseFloat(totalRouteDistance || '0') / walkSpeed) || 5;
  const timeString = timeSeconds >= 60 
    ? `${Math.floor(timeSeconds / 60)}m ${timeSeconds % 60}s` 
    : `${timeSeconds}s`;
  const xpEarned = Math.max(10, Math.round(parseFloat(totalRouteDistance || '0') * 0.5) + 5);
  const stepsTaken = Math.round(parseFloat(totalRouteDistance || '0') * 1.35) || 8;

  return (
    <View style={styles.container}>
      <ViewShot ref={viewShotRef} style={{ flex: 1 }}>
        <ViroARSceneNavigator
          autofocus
          initialScene={{ scene: NavigationRouteScene }}
          viroAppProps={{ rerender: fn => { rerenderScene.current = fn; } }}
          style={StyleSheet.absoluteFill}
        />
      </ViewShot>

      {/* ── Top background fade (Emergency Fallback) ── */}
      <View
        style={[styles.topGrad, { backgroundColor: 'rgba(2,8,24,0.7)' }]}
        pointerEvents="none"
      />

      {/* ── Distance HUD ── */}
      {distMeters !== null && dest && (
        <View style={styles.hudWrap} pointerEvents="none">
          <Animated.View style={[styles.distCard, { transform: [{ scale: pulseAnim }] }]}>
            {/* Header row */}
            <View style={styles.distCardHeader}>
              <View style={styles.navDot} />
              <Text style={styles.distLabel}>NAVIGATING TO</Text>
            </View>
            <Text style={styles.destName} numberOfLines={1}>{dest.name}</Text>

            {/* Distance value */}
            <View style={styles.distRow}>
              <Text style={styles.distValue}>{distMeters}</Text>
              <Text style={styles.distUnit}>m away</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={['#4db8ff', '#2ecc71']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, 100 - parseFloat(distMeters) * 4))}%` }]}
              />
            </View>

            {/* Route breadcrumb */}
            {routeNodes?.length > 0 && (
              <Text style={styles.crumbTxt} numberOfLines={1}>
                {routeNodes.map(n => n.name).join(' › ')}
              </Text>
            )}
          </Animated.View>

          {/* Re-loc banner */}
          {!!relocStatus && (
            <Animated.View style={[styles.relocBanner, { opacity: relocOpacity }]}>
              <Text style={styles.relocTxt}>{relocStatus}</Text>
            </Animated.View>
          )}
        </View>
      )}

      {/* ── Stop pill button ── */}
      <View style={styles.stopWrap}>
        <TouchableOpacity style={styles.stopBtn} onPress={onStop} activeOpacity={0.8}>
          <Ionicons name="stop-circle-outline" size={18} color="#fff" />
          <Text style={styles.stopTxt}>End Navigation</Text>
        </TouchableOpacity>
      </View>

      {/* ── DESTINATION REACHED SUMMARY MODAL ── */}
      <Modal visible={showSummaryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="trophy" size={38} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>Arrived Successfully!</Text>
            <Text style={styles.modalSub}>You have completed your campus route.</Text>

            {/* Visual Route Flow */}
            <View style={styles.routeFlowCard}>
              <View style={styles.routeFlowRow}>
                {/* Start Node */}
                <View style={styles.flowNodeWrap}>
                  <View style={[styles.flowIconCircle, { borderColor: '#00e5ff' }]}>
                    <Ionicons name="location-outline" size={16} color="#00e5ff" />
                  </View>
                  <Text style={styles.flowLabel}>START</Text>
                  <Text style={styles.flowNodeName} numberOfLines={1}>{startNode?.name || 'Start Point'}</Text>
                </View>

                {/* Connecting Path Arrow */}
                <View style={styles.flowConnectorCol}>
                  <Text style={styles.flowConnectorDist}>{totalRouteDistance}m</Text>
                  <View style={styles.flowConnectorLineWrap}>
                    <View style={styles.flowConnectorDot} />
                    <View style={styles.flowConnectorLine} />
                    <Ionicons name="chevron-forward" size={12} color="rgba(255, 255, 255, 0.4)" style={{ marginLeft: -4 }} />
                  </View>
                </View>

                {/* Destination Node */}
                <View style={styles.flowNodeWrap}>
                  <View style={[styles.flowIconCircle, { borderColor: '#2ecc71' }]}>
                    <Ionicons name="flag-outline" size={16} color="#2ecc71" />
                  </View>
                  <Text style={styles.flowLabel}>DESTINATION</Text>
                  <Text style={styles.flowNodeName} numberOfLines={1}>{dest?.name || 'Destination'}</Text>
                </View>
              </View>
            </View>

            {/* Expanded Gamified Stat Grid */}
            <View style={styles.successStatsGrid}>
              <View style={styles.successStatCard}>
                <Ionicons name="time-outline" size={18} color="#00e5ff" style={{ marginBottom: 4 }} />
                <Text style={styles.successStatVal}>{timeString}</Text>
                <Text style={styles.successStatLabel}>Duration</Text>
              </View>

              <View style={styles.successStatCard}>
                <Ionicons name="sparkles-outline" size={18} color="#2ecc71" style={{ marginBottom: 4 }} />
                <Text style={styles.successStatVal}>+{xpEarned} XP</Text>
                <Text style={styles.successStatLabel}>Level Reward</Text>
              </View>

              <View style={styles.successStatCard}>
                <Ionicons name="footsteps-outline" size={18} color="#f39c12" style={{ marginBottom: 4 }} />
                <Text style={styles.successStatVal}>{stepsTaken}</Text>
                <Text style={styles.successStatLabel}>Steps Taken</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.finishBtn} onPress={onReturnHome || onStop}>
              <Text style={styles.finishBtnTxt}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 170 },

  hudWrap: { position: 'absolute', top: 52, left: 16, right: 16, alignItems: 'center' },
  distCard: {
    backgroundColor: 'rgba(2,8,24,0.9)', borderRadius: 24,
    paddingHorizontal: 22, paddingVertical: 18, width: '100%',
    borderWidth: 1, borderColor: 'rgba(77,184,255,0.35)',
    shadowColor: '#4db8ff', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  distCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  navDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 8 },
  distLabel: { color: '#4db8ff', fontSize: 10, fontWeight: '800', letterSpacing: 2.5 },
  destName: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 10, marginTop: 2 },
  distRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  distValue: { color: '#fff', fontSize: 46, fontWeight: '900', letterSpacing: -1, lineHeight: 50 },
  distUnit:  { color: '#4db8ff', fontSize: 16, fontWeight: '700', marginLeft: 8, marginBottom: 6 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: 4, borderRadius: 2 },
  crumbTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },

  relocBanner: {
    marginTop: 10, backgroundColor: 'rgba(155,89,182,0.88)', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 10, alignSelf: 'center',
    borderWidth: 1, borderColor: 'rgba(155,89,182,0.5)',
  },
  relocTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  stopWrap: { position: 'absolute', bottom: 44, left: 0, right: 0, alignItems: 'center' },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,77,77,0.45)',
  },
  stopTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── Destination Modal ────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(2,8,24,0.88)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContent: {
    width: '100%', backgroundColor: '#071428', borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: 'rgba(77,184,255,0.2)', alignItems: 'center',
  },
  modalIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(46,204,113,0.12)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: 'rgba(46,204,113,0.4)',
  },
  modalTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  modalSub: { color: '#A0B0B9', fontSize: 14, textAlign: 'center', marginBottom: 24 },

  routeFlowCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 20,
  },
  routeFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flowNodeWrap: {
    alignItems: 'center',
    flex: 1.2,
  },
  flowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginBottom: 6,
  },
  flowLabel: {
    color: '#607D8B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  flowNodeName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  flowConnectorCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  flowConnectorDist: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  flowConnectorLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  flowConnectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  flowConnectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  successStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 24,
  },
  successStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successStatVal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  successStatLabel: {
    color: '#607D8B',
    fontSize: 10,
    fontWeight: '700',
  },

  finishBtn: {
    backgroundColor: '#4db8ff', width: '100%', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4db8ff', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  finishBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});
