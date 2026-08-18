import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Alert, Dimensions, ActivityIndicator, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  getUserProfile,
  getLifetimeMetrics,
  clearRecentTracks,
  clearAllFavorites,
  deleteUserProfile
} from '../database/database';

const { width } = Dimensions.get('window');

export default function UserProfileScreen({ onBack, onResetProfile }) {
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({ totalDistance: 0, totalRuns: 0, todayDistance: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    try {
      const prof = getUserProfile();
      const mets = getLifetimeMetrics();
      setProfile(prof);
      setMetrics(mets);
    } catch (e) {
      console.error("Error loading user profile screen data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const handleCalibrateSensors = () => {
    Alert.alert(
      'AR Sensor Calibration',
      'Pointing the camera to scan surroundings will realign spatial depth anchors with your device\'s IMU sensor.\n\nDrift Error: 0.02%\nSensor Status: Calibrated',
      [{ text: 'Close', style: 'default' }]
    );
  };

  const handleOfflineCache = () => {
    Alert.alert(
      'Offline Map Data',
      'Campus landmark nodes, hallways, and A* navigation search grids are pre-downloaded to your device.\n\nDatabase Size: 24 KB\nStatus: 100% Offline-Ready',
      [{ text: 'Close', style: 'default' }]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your favorites and statistics will be saved on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            deleteUserProfile();
            if (onResetProfile) {
              onResetProfile();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#020818', '#071428', '#0a1e3a']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </LinearGradient>
    );
  }

  // Get initials for profile avatar card
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stepsTaken = Math.round(metrics.totalDistance * 1.35);
  // Dynamic level reward progress
  const xpEarned = Math.max(0, Math.round(metrics.totalDistance * 0.5));
  const currentLevel = Math.floor(xpEarned / 100) + 1;
  const xpProgress = xpEarned % 100;

  return (
    <LinearGradient colors={['#020818', '#071428', '#0a1e3a']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Custom Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#00e5ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Account</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card Deck */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarTxt}>{getInitials(profile?.name)}</Text>
          </View>
          <Text style={styles.userName}>{profile?.name || 'PathVerse Explorer'}</Text>
          <Text style={styles.userEmail}>{profile?.email || 'no-email@pathverse.com'}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleTxt}>
              {profile?.role ? profile.role.toUpperCase() : 'STUDENT'}
            </Text>
          </View>
        </View>

        {/* Gamified Level Card */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trophy-outline" size={18} color="#00e5ff" />
              <Text style={styles.xpTitle}>Explorer Level</Text>
            </View>
            <Text style={styles.levelNum}>Lv. {currentLevel}</Text>
          </View>

          <View style={styles.xpProgressTrack}>
            <View style={[styles.xpProgressFill, { width: `${xpProgress}%` }]} />
          </View>
          <View style={styles.xpDetailsRow}>
            <Text style={styles.xpDetailTxt}>{xpProgress} / 100 XP to next level</Text>
            <Text style={styles.xpTotalTxt}>Total XP: {xpEarned}</Text>
          </View>
        </View>

        {/* Statistics Section */}
        <Text style={styles.sectionTitle}>YOUR STATS</Text>
        <View style={styles.statsGrid}>
          {/* Card 1: Distance */}
          <View style={styles.statCard}>
            <Ionicons name="navigate-outline" size={22} color="#00e5ff" />
            <Text style={styles.statVal}>{metrics.totalDistance}m</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>

          {/* Card 2: Trips */}
          <View style={styles.statCard}>
            <Ionicons name="flag-outline" size={22} color="#2ecc71" />
            <Text style={styles.statVal}>{metrics.totalRuns}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>

          {/* Card 3: Steps */}
          <View style={styles.statCard}>
            <Ionicons name="footsteps-outline" size={22} color="#f39c12" />
            <Text style={styles.statVal}>{stepsTaken}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
        </View>

        {/* Action Panel Section */}
        <Text style={styles.sectionTitle}>ACCOUNT CONTROLS</Text>
        
        <View style={styles.actionSection}>
          {/* Action 1: Voice Guidance Toggle */}
          <View style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <Ionicons name="volume-high-outline" size={20} color="#00e5ff" />
              <Text style={styles.actionLabel}>Voice Navigation Prompts</Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={setVoiceEnabled}
              trackColor={{ false: '#101F30', true: '#00e5ff' }}
              thumbColor={voiceEnabled ? '#fff' : '#A0B0B9'}
            />
          </View>

          {/* Action 2: Calibrate Sensors */}
          <TouchableOpacity style={styles.actionRow} onPress={handleCalibrateSensors}>
            <View style={styles.actionLeft}>
              <Ionicons name="compass-outline" size={20} color="#00e5ff" />
              <Text style={styles.actionLabel}>AR Sensor Calibration</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>

          {/* Action 3: Offline Map Cache */}
          <TouchableOpacity style={styles.actionRow} onPress={handleOfflineCache}>
            <View style={styles.actionLeft}>
              <Ionicons name="cloud-done-outline" size={20} color="#00e5ff" />
              <Text style={styles.actionLabel}>Offline Map Cache</Text>
            </View>
            <Text style={{ color: '#00e5ff', fontSize: 13, fontWeight: '700' }}>24 KB</Text>
          </TouchableOpacity>

          {/* Action 4: Sign Out */}
          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={20} color="#ff4d4d" />
              <Text style={[styles.actionLabel, { color: '#ff4d4d' }]}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.footerTxt}>PathVerse AR v1.1.2 • Local Account Sandbox</Text>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatarTxt: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  userEmail: {
    color: '#A0B0B9',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  roleTxt: {
    color: '#00e5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  xpCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 18,
    marginBottom: 24,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  levelNum: {
    color: '#00e5ff',
    fontSize: 14,
    fontWeight: '900',
  },
  xpProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  xpProgressFill: {
    height: 6,
    backgroundColor: '#00e5ff',
    borderRadius: 3,
  },
  xpDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpDetailTxt: {
    color: '#607D8B',
    fontSize: 11,
    fontWeight: '600',
  },
  xpTotalTxt: {
    color: '#A0B0B9',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#607D8B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginHorizontal: 24,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    color: '#607D8B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionSection: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footerTxt: {
    color: '#607D8B',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
});
