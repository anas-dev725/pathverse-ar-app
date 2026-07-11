import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Alert, Dimensions, Animated, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getRecentTracks, clearRecentTracks, getLifetimeMetrics, getWeeklyMetrics, getUserProfile } from '../database/database';

const { width: W, height: H } = Dimensions.get('window');
const FONT_TITLE = Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium';

const MILESTONES = [
  { id: 'bronze', name: 'First Steps', goal: 20, desc: 'Cover 20 meters of campus navigation.', icon: 'footsteps-outline', color: '#cd7f32' },
  { id: 'silver', name: 'Campus Wanderer', goal: 100, desc: 'Cover 100 meters of campus navigation.', icon: 'map-outline', color: '#c0c0c0' },
  { id: 'gold', name: 'Department Master', goal: 500, desc: 'Cover 500 meters of campus navigation.', icon: 'ribbon-outline', color: '#ffd700' },
  { id: 'platinum', name: 'Navigator Elite', goal: 1000, desc: 'Cover 1,000 meters of campus navigation.', icon: 'trophy-outline', color: '#e5e4e2' }
];

const fmtTime = (iso) => {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return iso; }
};

const GlowBackground = () => {
  return (
    <View style={styles.glowOverlay} pointerEvents="none">
      <LinearGradient
        colors={['rgba(0, 229, 255, 0.05)', 'transparent']}
        style={styles.glowOrbLeft}
      />
      <LinearGradient
        colors={['rgba(41, 121, 255, 0.05)', 'transparent']}
        style={styles.glowOrbRight}
      />
    </View>
  );
};

export default function DashboardScreen({ onBack }) {
  const [tracks, setTracks] = useState([]);
  const [lifetime, setLifetime] = useState({ totalDistance: 0, totalRuns: 0, todayDistance: 0 });
  const [weekly, setWeekly] = useState([]);
  const [profileName, setProfileName] = useState('Explorer');

  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = useCallback(() => {
    try {
      setTracks(getRecentTracks());
      setLifetime(getLifetimeMetrics());
      setWeekly(getWeeklyMetrics());
      const prof = getUserProfile();
      if (prof && prof.name) {
        setProfileName(prof.name);
      }
    } catch (e) {
      console.error("Error loading dashboard metrics:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [loadData]);

  const handleClearTracks = () => {
    Alert.alert(
      'Clear Tracking History?',
      'This will delete your recent tracks from the list. (Milestones/badges progress will be kept.)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: () => { clearRecentTracks(); loadData(); }
        },
      ]
    );
  };

  // Gamification: level calculation
  const totalXP = Math.round(lifetime.totalDistance * 10);
  const xpPerLevel = 200; // 20 meters walked per level
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const progressXP = totalXP % xpPerLevel;
  const levelProgressPct = (progressXP / xpPerLevel) * 100;
  const xpNeeded = xpPerLevel - progressXP;

  const maxWeeklyDist = Math.max(...weekly.map(w => w.distance), 40);

  return (
    <View style={styles.root}>
      {/* Background Gradient */}
      <LinearGradient colors={['#010610', '#030f24', '#010610']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      {/* Soft Ambient Glow Background */}
      <GlowBackground />

      <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Welcome Back, {profileName}!</Text>
            <Text style={styles.pageSubtitle}>Here is your tracking metrics history</Text>
          </View>

          {/* Gamified Level Widget */}
          <View style={styles.levelCard}>
            <LinearGradient colors={['rgba(0, 229, 255, 0.08)', 'rgba(41, 121, 255, 0.02)']} style={StyleSheet.absoluteFill} />
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>LVL {level}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.levelName}>Campus Explorer</Text>
                <Text style={styles.levelXP}>{totalXP} Total XP Earned</Text>
              </View>
            </View>

            {/* Level progress bar */}
            <View style={styles.xpBarTrack}>
              <View style={[styles.xpBarFill, { width: `${levelProgressPct}%` }]}>
                <LinearGradient
                  colors={['#00e5ff', '#2979ff']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </View>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>{progressXP} / {xpPerLevel} XP</Text>
              <Text style={styles.xpNextLabel}>{xpNeeded} XP to Level {level + 1}</Text>
            </View>
          </View>

          {/* 1. Lifetime Stats grid cards (Aligned) */}
          <View style={styles.statsCardGrid}>
            <View style={styles.statsCard}>
              <LinearGradient colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.005)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="footsteps" size={18} color="#00e5ff" style={{ marginBottom: 4 }} />
              <Text style={styles.statNum}>{lifetime.todayDistance}m</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Today's Walk</Text>
            </View>

            <View style={styles.statsCard}>
              <LinearGradient colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.005)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="navigate-circle" size={18} color="#00e5ff" style={{ marginBottom: 4 }} />
              <Text style={styles.statNum}>{lifetime.totalDistance}m</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Total Distance</Text>
            </View>

            <View style={styles.statsCard}>
              <LinearGradient colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.005)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="trail-sign-outline" size={18} color="#00e5ff" style={{ marginBottom: 4 }} />
              <Text style={styles.statNum}>{lifetime.totalRuns}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Paths Guided</Text>
            </View>
          </View>

          {/* 2. Interactive Weekly Progress bar chart */}
          <View style={styles.sectionCard}>
            <LinearGradient colors={['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionHeading}>Weekly Walking Logs</Text>
            
            <View style={styles.chartContainer}>
              {weekly.map((w, idx) => {
                const barHeightPct = (w.distance / maxWeeklyDist) * 100;
                const barHeight = Math.max((barHeightPct / 100) * 110, 3);
                
                return (
                  <View key={`w-${idx}`} style={styles.chartCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barValueFill, { height: barHeight }]}>
                        <LinearGradient colors={['#2979ff', '#00e5ff']} style={StyleSheet.absoluteFill} />
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{w.day}</Text>
                    <Text style={styles.barSubLabel}>{w.distance}m</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 3. Milestone achievements gamification */}
          <Text style={styles.sectionTitleLabel}>Weekly Milestone Achievements</Text>
          <View style={styles.badgesGrid}>
            {MILESTONES.map((m) => {
              const isUnlocked = lifetime.totalDistance >= m.goal;
              return (
                <View key={m.id} style={[styles.badgeCard, isUnlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
                  <LinearGradient
                    colors={isUnlocked ? ['rgba(0, 229, 255, 0.06)', 'rgba(41, 121, 255, 0.01)'] : ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.005)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.badgeIconOuter, { borderColor: isUnlocked ? '#00e5ff' : 'rgba(255, 255, 255, 0.08)' }]}>
                    <Ionicons name={m.icon} size={24} color={isUnlocked ? m.color : 'rgba(255,255,255,0.18)'} />
                  </View>
                  <Text style={[styles.badgeName, isUnlocked ? { color: '#fff' } : { color: 'rgba(255,255,255,0.3)' }]}>{m.name}</Text>
                  <Text style={styles.badgeGoal}>Goal: {m.goal}m</Text>
                  <Text style={styles.badgeDesc}>{m.desc}</Text>
                </View>
              );
            })}
          </View>

          {/* 4. Recent Tracks History section */}
          <View style={styles.accordionHeaderRow}>
            <Text style={styles.sectionTitleLabel}>Recent Tracks Covered</Text>
            {tracks.length > 0 && (
              <TouchableOpacity onPress={handleClearTracks} style={styles.clearBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {tracks.length === 0 ? (
            <View style={styles.emptyLogsCard}>
              <LinearGradient colors={['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.005)']} style={StyleSheet.absoluteFill} />
              <Ionicons name="map-outline" size={24} color="rgba(255,255,255,0.15)" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyLogsText}>No completed tracks recorded yet.</Text>
            </View>
          ) : (
            <View style={styles.logsListCard}>
              {tracks.map((item, idx) => {
                const hasRouteInfo = item.start_name && item.end_name;
                const pathString = hasRouteInfo ? `${item.start_name} ➔ ${item.end_name}` : "Indoor Navigation Run";
                
                return (
                  <View
                    key={item.id}
                    style={[styles.logRow, idx === tracks.length - 1 ? { borderBottomWidth: 0 } : null]}
                  >
                    <View style={styles.logLeftCol}>
                      <View style={styles.routeIconBox}>
                        <Ionicons name="map" size={16} color="#00e5ff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logMatchedName} numberOfLines={1}>
                          {pathString}
                        </Text>
                        <Text style={styles.logTimestamp}>
                          Covered {parseFloat(item.distance).toFixed(1)}m · {fmtTime(item.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#010610' },
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
  mainWrapper: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 115 },
  
  titleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    fontFamily: FONT_TITLE,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#00e5ff',
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 4,
    fontFamily: FONT_BODY,
  },

  // Level Card styles
  levelCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#00e5ff',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  levelBadgeText: {
    color: '#010610',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: FONT_BODY,
  },
  levelName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FONT_BODY,
  },
  levelXP: {
    color: '#5C7685',
    fontSize: 11,
    fontWeight: '600',
  },
  xpBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpLabel: {
    color: '#00e5ff',
    fontSize: 10,
    fontWeight: '800',
  },
  xpNextLabel: {
    color: '#5C7685',
    fontSize: 10,
    fontWeight: '700',
  },

  // Aligned Stats cards
  statsCardGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statsCard: {
    flex: 1,
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statNum: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: FONT_BODY,
    textAlign: 'center',
    marginBottom: 3,
  },
  statLabel: {
    color: '#5C7685',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Weekly bar chart styles
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sectionHeading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FONT_BODY,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 110,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  barValueFill: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    color: '#5C7685',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  barSubLabel: {
    color: '#00e5ff',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },

  // Achievements milestones
  sectionTitleLabel: {
    color: '#5C7685',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: FONT_BODY,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  badgeCard: {
    width: (W - 60) / 2,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeLocked: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  badgeUnlocked: {
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  badgeIconOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_BODY,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeGoal: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeDesc: {
    color: '#5C7685',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '500',
  },

  // Recent Tracks
  accordionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  clearBtnText: {
    color: 'rgba(255,77,77,0.7)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyLogsCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyLogsText: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_BODY,
  },
  logsListCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  logLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logMatchedName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_BODY,
    marginBottom: 2,
  },
  logTimestamp: {
    color: '#5C7685',
    fontSize: 11,
    fontWeight: '600',
  },
});
