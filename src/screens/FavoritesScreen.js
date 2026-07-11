import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getFavorites, removeFavorite } from '../database/database';

const { width: W, height: H } = Dimensions.get('window');
const FONT_TITLE = Platform.OS === 'ios' ? 'Georgia-Bold' : 'serif';
const FONT_BODY = Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif-medium';

const TYPE_ICONS = { room: 'school-outline', corridor: 'git-merge-outline', stairs: 'trending-up-outline', exit: 'exit-outline' };
const TYPE_COLOR = { room: '#00e5ff', corridor: '#f39c12', stairs: '#9b59b6', exit: '#2ecc71' };

// Decorative soft ambient glow background elements
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

export default function FavoritesScreen({ onNavigateFavorite, onBack }) {
  const [favorites, setFavorites] = useState([]);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadData = () => {
    try {
      const list = getFavorites();
      setFavorites(list);
    } catch (e) {
      console.error("Error loading favorites:", e);
    }
  };

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRemove = (nodeId) => {
    try {
      removeFavorite(nodeId);
      loadData();
    } catch (e) {
      console.error("Error removing favorite:", e);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background Gradient */}
      <LinearGradient colors={['#010610', '#030f24', '#010610']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />

      {/* Soft Ambient Glow Background */}
      <GlowBackground />

      <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <Text style={styles.headerSubtitle}>Quick-Go Landmarks</Text>
        </View>

        {favorites.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="star-outline" size={40} color="rgba(0, 229, 255, 0.4)" />
            </View>
            <Text style={styles.emptyTitle}>No Bookmarks Saved</Text>
            <Text style={styles.emptyDesc}>
              Tap the star icon on any classroom, lab, or office in the Navigate tab to pin it here for 1-tap AR navigation.
            </Text>
          </View>
        ) : (
          /* List of Bookmarks */
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {favorites.map((item) => {
              const color = TYPE_COLOR[item.type] || '#00e5ff';
              const icon = TYPE_ICONS[item.type] || 'location-outline';
              
              return (
                <View key={item.id} style={styles.favCard}>
                  {/* Glassmorphic overlay */}
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.cardHeader}>
                    <View style={[styles.typeIconBox, { backgroundColor: `${color}18`, borderColor: `${color}35` }]}>
                      <Ionicons name={icon} size={22} color={color} />
                    </View>
                    <View style={styles.cardTextCol}>
                      <Text style={styles.cardNodeName}>{item.name}</Text>
                      <Text style={styles.cardNodeSubtitle}>IoBM Campus · {item.type}</Text>
                    </View>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      activeOpacity={0.7}
                      onPress={() => handleRemove(item.id)}
                    >
                      <Ionicons name="trash-outline" size={15} color="rgba(255, 77, 77, 0.7)" />
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.navigateBtn}
                      activeOpacity={0.8}
                      onPress={() => onNavigateFavorite(item)}
                    >
                      <LinearGradient
                        colors={['#00e5ff', '#2979ff']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={styles.navigateBtnText}>Navigate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

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
  mainWrapper: { flex: 1, paddingTop: 60 },
  
  headerRow: {
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    fontFamily: FONT_TITLE,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#00e5ff',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
    fontFamily: FONT_BODY,
  },
  
  scrollList: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 125 },
  
  favCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTextCol: { flex: 1 },
  cardNodeName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONT_BODY,
  },
  cardNodeSubtitle: {
    color: '#607D8B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeBtnText: {
    color: 'rgba(255, 77, 77, 0.7)',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT_BODY,
  },
  navigateBtn: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  navigateBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT_BODY,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONT_TITLE,
    marginBottom: 10,
  },
  emptyDesc: {
    color: '#5C7685',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONT_BODY,
  },
});
