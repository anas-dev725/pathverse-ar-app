import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  ViroARScene, ViroARSceneNavigator, ViroText,
  ViroTrackingStateConstants, ViroNode, ViroPolyline,
  ViroImage, ViroQuad, ViroMaterials, ViroAnimations, ViroDirectionalLight
} from '@reactvision/react-viro';
import ViewShot, { captureRef } from 'react-native-view-shot';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as Speech from 'expo-speech';
import { ocrSearchNodes } from '../services/SearchService';
import { getAllNodes, getAllEdges } from '../database/database';
import { calculateAStarPath } from '../services/AStarAlgorithm';

// ── Image assets ────────────────────────────────────────────────────────────
const CHEVRON_IMG     = require('../../assets/neon_chevron_trans.png');
const DESTINATION_IMG = require('../../assets/destination_diamond_trans.png');

// ── Materials with explicit Alpha Blend Mode (prevents solid white fallback) ──
ViroMaterials.createMaterials({
  neonChevronMat: {
    diffuseTexture: CHEVRON_IMG,
    lightingModel: 'Constant',
    blendMode: 'Alpha',
  },
  destMarkerMat: {
    diffuseTexture: DESTINATION_IMG,
    lightingModel: 'Constant',
    blendMode: 'Alpha',
  },
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

// ── Global C++ ↔ JS bridge state (never re-initialised) ────────────────────
let _cameraPos    = [0, 0, 0];
let _originOffset = [0, 0, 0];   // maps SQLite anchor node → AR world origin
let _routeNodes   = [];
let _anchorNode   = null;
let _rotationAngle = 0;
let _currentNearestIdx = 0;

// Helper: euclidean distance ignoring Y (horizontal plane)
const eucXZ = (a, b) => {
  const dx = a[0] - b[0]; const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
};

// ── Interpolate chevron positions along path at fixed intervals ─────────────
const CHEVRON_SPACING = 0.6;

const interpolateChevrons = (worldPos) => {
  const chevrons = [];
  if (!worldPos || worldPos.length < 2) return chevrons;

  // Pre-calculate segment angles & pitches for smooth corner blending
  const segs = [];
  for (let i = 0; i < worldPos.length - 1; i++) {
    const from = worldPos[i], to = worldPos[i + 1];
    const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
    const segLen = Math.sqrt(dx * dx + dz * dz);
    if (segLen < 0.01) continue;
    const angleDeg = Math.atan2(-dx, -dz) * (180 / Math.PI);
    const rawPitch = Math.atan2(dy, Math.max(0.01, segLen)) * (180 / Math.PI);
    const pitch = Math.max(-40, Math.min(40, rawPitch));
    segs.push({ from, to, dx, dy, dz, segLen, angleDeg, pitch, segIdx: i });
  }

  let distLeft = CHEVRON_SPACING / 2;

  // Process all route segments (Floor level isolation automatically hides different-floor arrows)
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const nextSeg = segs[i + 1];
    let walked = 0;

    while (walked + distLeft <= s.segLen) {
      walked += distLeft;
      const t = walked / s.segLen;
      
      let curRotY = s.angleDeg;
      let curPitch = s.pitch;

      // Smoothly blend rotation & pitch near corner transitions (last 1.2 meters of segment)
      if (nextSeg && s.segLen - walked < 1.2) {
        const blendFactor = (1.2 - (s.segLen - walked)) / 1.2;
        let diffRot = nextSeg.angleDeg - s.angleDeg;
        while (diffRot > 180) diffRot -= 360;
        while (diffRot < -180) diffRot += 360;
        curRotY = s.angleDeg + diffRot * blendFactor * 0.5;
        curPitch = s.pitch + (nextSeg.pitch - s.pitch) * blendFactor * 0.5;
      }

      const chevPos = [
        s.from[0] + s.dx * t,
        s.from[1] + s.dy * t,
        s.from[2] + s.dz * t
      ];

      // Rule 2: Floor Level Isolation — Hide chevrons on different floors (vertical height diff > 1.6m)
      const dyFromCam = Math.abs(chevPos[1] - _cameraPos[1]);
      if (dyFromCam > 1.6) {
        distLeft = CHEVRON_SPACING;
        continue;
      }

      // Rule 3: Filter out chevrons that are >0.8m behind camera vector on current segment
      const cdx = chevPos[0] - _cameraPos[0];
      const cdz = chevPos[2] - _cameraPos[2];
      const distFromCam = Math.sqrt(cdx * cdx + cdz * cdz);
      const dotCam = (cdx * s.dx + cdz * s.dz) / Math.max(0.01, s.segLen);

      if (dotCam >= -0.8 || distFromCam < 1.0) {
        chevrons.push({
          pos: chevPos,
          rotY: curRotY,
          pitch: curPitch
        });
      }
      distLeft = CHEVRON_SPACING;
    }
    distLeft -= (s.segLen - walked);
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
  const cosA = Math.cos(_rotationAngle);
  const sinA = Math.sin(_rotationAngle);
  const worldPos = nodes.map(n => {
    const dx = n.x - ox;
    const dz = n.z - oz;
    return [
      dx * cosA - dz * sinA,
      (n.y - oy) - 1.2,
      dx * sinA + dz * cosA,
    ];
  });

  const chevronData = interpolateChevrons(worldPos);

  return (
    <ViroARScene 
      onTrackingUpdated={onTrackingUpdated} 
      onCameraTransformUpdate={(ct) => { _cameraPos = ct.position; }}
    >
      <ViroDirectionalLight color="#ffffff" direction={[0, -1, 0]} />

      {/* ── Floor-laid transparent neon green chevrons (ViroImage with explicit Alpha material) ── */}
      {chevronData.map((chev, i) => (
        <ViroNode
          key={`chev-${i}`}
          position={chev.pos}
          rotation={[-90 + (chev.pitch || 0), chev.rotY, 0]}
        >
          <ViroImage
            source={CHEVRON_IMG}
            materials={['neonChevronMat']}
            width={0.6}
            height={0.6}
          />
        </ViroNode>
      ))}

      {/* ── Destination diamond marker (ViroImage) ── */}
      {nodes.length > 1 && (
        <ViroNode
          key="dest-marker"
          position={worldPos[worldPos.length - 1]}
          animation={{ name: 'pulseLoop', run: true, loop: true }}
        >
          <ViroImage
            source={DESTINATION_IMG}
            materials={['destMarkerMat']}
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
  const lastRerouteTs = useRef(0);

  const [distMeters, setDistMeters]     = useState(null);
  const [legMeters, setLegMeters]       = useState(null);
  const [nextNodeName, setNextNodeName] = useState('');
  const [relocStatus, setRelocStatus]   = useState('');
  const [showSummaryModal, setShowModal] = useState(false);
  const [totalRouteDistance, setTotalDistance] = useState('0.0');
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const relocOpacity = useRef(new Animated.Value(0)).current;

  // Synchronous initialization for instant 1st-click rotation & origin alignment
  _routeNodes   = routeNodes   || [];
  _anchorNode   = anchorNode   || null;
  _originOffset = anchorNode
    ? [anchorNode.x, anchorNode.y, anchorNode.z]
    : [0, 0, 0];

  if (_routeNodes && _routeNodes.length >= 2) {
    const dx = _routeNodes[1].x - _routeNodes[0].x;
    const dz = _routeNodes[1].z - _routeNodes[0].z;
    const pathAngle = Math.atan2(dx, dz);
    _rotationAngle = pathAngle - Math.PI;
  } else {
    _rotationAngle = 0;
  }

  useEffect(() => {
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
    }, 1500);

    // Pulsing HUD badge
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ])).start();

    // ── Real-Time Distance Polling + Proximity Voice ─────────────────────
    let warmupDone = false;
    const warmupTimer = setTimeout(() => { warmupDone = true; }, 3000);

    const distIv = setInterval(() => {
      if (!_routeNodes || _routeNodes.length === 0) return;

      // 0. If already arrived, lock distance counters to 0.0m permanently
      if (arrivedRef.current) {
        setDistMeters('0.0');
        setLegMeters('0.0');
        return;
      }

      const cosA = Math.cos(_rotationAngle);
      const sinA = Math.sin(_rotationAngle);

      // 1. Find nearest path node to user's current camera position
      let nearestIdx = 0;
      let minDistToNode = Infinity;

      _routeNodes.forEach((node, idx) => {
        const ndx = node.x - _originOffset[0];
        const ndz = node.z - _originOffset[2];
        const nw = [
          ndx * cosA - ndz * sinA,
          (node.y - _originOffset[1]) - 1.2,
          ndx * sinA + ndz * cosA
        ];
        const dy = Math.abs(_cameraPos[1] - nw[1]);
        const dxz = Math.sqrt((_cameraPos[0] - nw[0]) ** 2 + (_cameraPos[2] - nw[2]) ** 2);
        // Heavily penalize vertical floor height mismatch so upper floor rooms aren't matched on lower floors
        const d = dxz + (dy > 1.8 ? dy * 4.0 : dy * 0.5);

        if (d < minDistToNode) {
          minDistToNode = d;
          nearestIdx = idx;
        }
      });

      _currentNearestIdx = nearestIdx;

      // 2. Calculate final destination position in AR space
      const finalDest = _routeNodes[_routeNodes.length - 1];
      const fdx = finalDest.x - _originOffset[0];
      const fdz = finalDest.z - _originOffset[2];
      const destWorld = [
        fdx * cosA - fdz * sinA,
        (finalDest.y - _originOffset[1]) - 1.2,
        fdx * sinA + fdz * cosA
      ];

      // 3. Calculate leg distance to next upcoming waypoint (Google Maps style)
      const targetNext = _routeNodes[nearestIdx + 1] || finalDest;
      let currentLegDist = 0;
      if (targetNext) {
        const ndx_leg = targetNext.x - _originOffset[0];
        const ndz_leg = targetNext.z - _originOffset[2];
        const nLegWorld = [
          ndx_leg * cosA - ndz_leg * sinA,
          (targetNext.y - _originOffset[1]) - 1.2,
          ndx_leg * sinA + ndz_leg * cosA
        ];
        const legD = Math.sqrt(
          (_cameraPos[0] - nLegWorld[0]) ** 2 +
          (_cameraPos[1] - nLegWorld[1]) ** 2 +
          (_cameraPos[2] - nLegWorld[2]) ** 2
        );
        currentLegDist = legD;
        setLegMeters(legD < 0.4 ? '0.0' : legD.toFixed(1));
        setNextNodeName(targetNext.name);
      }

      // 4. Calculate total real-time remaining walking distance along actual route path
      let remainingDist = currentLegDist;
      for (let i = nearestIdx + 1; i < _routeNodes.length - 1; i++) {
        const a = _routeNodes[i], b = _routeNodes[i + 1];
        remainingDist += Math.sqrt(
          (b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2
        );
      }
      
      setDistMeters(remainingDist < 0.4 ? '0.0' : remainingDist.toFixed(1));

      if (!warmupDone) return;

      // 5. Arrival check: ONLY when user reaches the FINAL destination node on the CORRECT FLOOR (fdistY < 1.0m)
      const isFinalNode = nearestIdx === _routeNodes.length - 1;
      const fdx_cam = _cameraPos[0] - destWorld[0];
      const fdy_cam = _cameraPos[1] - destWorld[1];
      const fdz_cam = _cameraPos[2] - destWorld[2];
      const fdistXZ = Math.sqrt(fdx_cam * fdx_cam + fdz_cam * fdz_cam);
      const fdistY = Math.abs(fdy_cam);

      if (!arrivedRef.current && isFinalNode && fdistXZ < 1.6 && fdistY < 1.0) {
        arrivedRef.current = true;
        setDistMeters('0.0');
        setLegMeters('0.0');
        Speech.speak(`You have reached ${finalDest?.name || 'your destination'}.`, { language: 'en-US', rate: 0.92, pitch: 1.1 });
        setShowModal(true);
      }

      // 4. Intermediate node proximity voice announcements
      _routeNodes.forEach((node, i) => {
        if (i === 0) return;
        const ndx = node.x - _originOffset[0];
        const ndz = node.z - _originOffset[2];
        const nWorld = [
          ndx * cosA - ndz * sinA,
          (node.y - _originOffset[1]) - 1.2,
          ndx * sinA + ndz * cosA
        ];
        const ndx_cam = _cameraPos[0] - nWorld[0];
        const ndy_cam = _cameraPos[1] - nWorld[1];
        const ndz_cam = _cameraPos[2] - nWorld[2];
        const ndistXZ = Math.sqrt(ndx_cam * ndx_cam + ndz_cam * ndz_cam);
        const ndistY = Math.abs(ndy_cam);

        if (ndistXZ < 2.0 && ndistY < 2.0 && !announcedNodes.current.has(node.id)) {
          announcedNodes.current.add(node.id);
          const prevNode = _routeNodes[i - 1];
          if (node.type === 'stairs' && prevNode && Math.abs(node.y - prevNode.y) > 0.5) {
            Speech.speak(`Approaching stairs. Prepare to transition to the next floor.`, { language: 'en-US', rate: 0.95 });
          } else {
            Speech.speak(`Approaching ${node.name}`, { language: 'en-US', rate: 0.95 });
          }
        }
      });

      // 5. High-precision Wrong-Turn Engine (Triggers if user strays >1.8m off course or overshoots turn)
      const now = Date.now();
      if (now - lastRerouteTs.current > 1500) {
        let minSegmentDist = Infinity;
        for (let i = 0; i < _routeNodes.length - 1; i++) {
          const nA = _routeNodes[i], nB = _routeNodes[i + 1];
          const ax = (nA.x - _originOffset[0]) * cosA - (nA.z - _originOffset[2]) * sinA;
          const az = (nA.x - _originOffset[0]) * sinA + (nA.z - _originOffset[2]) * cosA;
          const bx = (nB.x - _originOffset[0]) * cosA - (nB.z - _originOffset[2]) * sinA;
          const bz = (nB.x - _originOffset[0]) * sinA + (nB.z - _originOffset[2]) * cosA;

          const vx = bx - ax, vz = bz - az;
          const lenSq = vx * vx + vz * vz;
          if (lenSq < 0.01) continue;

          const wx = _cameraPos[0] - ax, wz = _cameraPos[2] - az;
          // Correct 2D dot product: (W . V) = wx * vx + wz * vz
          const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / lenSq));
          const projX = ax + t * vx, projZ = az + t * vz;
          const segD = Math.sqrt((_cameraPos[0] - projX) ** 2 + (_cameraPos[2] - projZ) ** 2);
          if (segD < minSegmentDist) minSegmentDist = segD;
        }

        // Alert user if they walk >2.0m off route (AR chevrons remain anchored on the floor)
        if (minSegmentDist > 2.0) {
          lastRerouteTs.current = now;
          Speech.stop();
          Speech.speak(`Wrong turn detected. Please turn back towards ${finalDest?.name || 'your path'}.`, { language: 'en-US', rate: 0.92 });
          setRelocStatus(`⚠️ Wrong Turn! Turn back towards ${finalDest?.name || 'your path'}`);
          Animated.sequence([
            Animated.timing(relocOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(3500),
            Animated.timing(relocOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start(() => setRelocStatus(''));
        }
      }
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

  // Silent snap re-localization
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

            // Recalculate A* path dynamically from new scanned position to destination
            if (dest) {
              const edges = getAllEdges();
              const newPath = calculateAStarPath(det.id, dest.id, allNodes, edges);
              if (newPath && newPath.length >= 2) {
                _routeNodes = newPath;
              }
            }

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
  }, [dest]);


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

  // Re-align path to camera forward view from current physical position
  const handleRealign = () => {
    if (_routeNodes && _routeNodes.length >= 2) {
      const cosA = Math.cos(_rotationAngle);
      const sinA = Math.sin(_rotationAngle);
      let nextIdx = 1;
      for (let i = 0; i < _routeNodes.length; i++) {
        const n = _routeNodes[i];
        const ndx = n.x - _originOffset[0];
        const ndz = n.z - _originOffset[2];
        const nw = [ndx * cosA - ndz * sinA, (n.y - _originOffset[1]) - 1.2, ndx * sinA + ndz * cosA];
        const distToCam = Math.sqrt((_cameraPos[0] - nw[0]) ** 2 + (_cameraPos[2] - nw[2]) ** 2);
        if (distToCam > 1.5) {
          nextIdx = i;
          break;
        }
      }
      const tgt = _routeNodes[nextIdx] || _routeNodes[1];
      const dx = tgt.x - _originOffset[0];
      const dz = tgt.z - _originOffset[2];
      const pathAngle = Math.atan2(dx, dz);
      _rotationAngle = pathAngle - Math.PI;
      setRelocStatus('🧭 Path aligned to camera view');
      Animated.sequence([
        Animated.timing(relocOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(relocOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setRelocStatus(''));
      if (rerenderScene.current) rerenderScene.current();
    }
  };

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
              <Text style={styles.distLabel}>NAVIGATING TO {dest.name.toUpperCase()}</Text>
            </View>

            {/* Google Maps Style Turn-by-Turn Leg Instruction */}
            <View style={styles.distRow}>
              <Text style={styles.distValue}>{legMeters !== null ? legMeters : distMeters}</Text>
              <Text style={styles.distUnit}>m straight</Text>
            </View>
            <Text style={styles.destName} numberOfLines={1}>
              {nextNodeName ? `then head towards ${nextNodeName}` : `towards ${dest.name}`}
            </Text>

            {/* Total remaining route distance indicator */}
            <View style={styles.totalRow}>
              <Ionicons name="location-sharp" size={12} color="#00e5ff" style={{ marginRight: 4 }} />
              <Text style={styles.totalTxt}>{distMeters} m total remaining</Text>
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

      {/* ── Stop & Re-align Pill Buttons ── */}
      <View style={styles.stopWrap}>
        <TouchableOpacity style={styles.alignBtn} onPress={handleRealign} activeOpacity={0.8}>
          <Ionicons name="compass-outline" size={18} color="#00e5ff" />
          <Text style={styles.alignTxt}>Re-align Path</Text>
        </TouchableOpacity>
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
  distRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  distValue: { color: '#fff', fontSize: 46, fontWeight: '900', letterSpacing: -1, lineHeight: 50 },
  distUnit:  { color: '#4db8ff', fontSize: 16, fontWeight: '700', marginLeft: 8, marginBottom: 6 },
  totalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  totalTxt: { color: '#00e5ff', fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: 4, borderRadius: 2 },
  crumbTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },

  relocBanner: {
    marginTop: 10, backgroundColor: 'rgba(155,89,182,0.88)', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 10, alignSelf: 'center',
    borderWidth: 1, borderColor: 'rgba(155,89,182,0.5)',
  },
  relocTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  stopWrap: { position: 'absolute', bottom: 44, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  alignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(7, 20, 40, 0.85)',
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.5)',
  },
  alignTxt: { color: '#00e5ff', fontWeight: '700', fontSize: 13 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.78)',
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,77,77,0.45)',
  },
  stopTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },

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
