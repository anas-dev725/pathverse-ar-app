import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, BackHandler, Alert, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Database & Algorithms
import { initDB, seedDummyData, getAllNodes, getAllEdges, getUserProfile, addNavigationMetric } from './src/database/database';
import { calculateAStarPath } from './src/services/AStarAlgorithm';

// Screens
import SplashScreen        from './src/screens/SplashScreen';
import HomeScreen          from './src/screens/HomeScreen';
import ScannerScreen       from './src/screens/ScannerScreen';
import ARNavigationScreen  from './src/screens/ARNavigationScreen';
import DBViewerScreen      from './src/screens/DBViewerScreen';
import UserProfileScreen   from './src/screens/UserProfileScreen';
import ARMapperScreen      from './src/screens/ARMapperScreen';
import DashboardScreen      from './src/screens/DashboardScreen';
import FavoritesScreen     from './src/screens/FavoritesScreen';

// Defines the back-navigation hierarchy for each screen
const BACK_MAP = {
  SCANNER:   'HOME',
  AR_MAPPER: 'HOME', // returns to Settings tab
  AR:        null,
};

export default function App() {
  const [screen, setScreen]           = useState('SPLASH');
  const [activeTab, setActiveTab]     = useState('NAVIGATE'); // 'NAVIGATE' | 'FAVORITES' | 'DASHBOARD' | 'SETTINGS'
  const [destination, setDestination] = useState(null);
  const [anchor, setAnchor]           = useState(null);
  const [route, setRoute]             = useState([]);
  const [preselectedDest, setPreselectedDest] = useState(null);
  const [profile, setProfile]         = useState(null);

  const fetchProfile = () => {
    try {
      const prof = getUserProfile();
      setProfile(prof);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    try { 
      initDB(); 
      seedDummyData(); 
      fetchProfile();
    } catch (e) { 
      console.error(e); 
    }
  }, []);

  // ── Android hardware back button handler ─────────────────────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      const back = BACK_MAP[screen];

      if (screen === 'HOME' || screen === 'SPLASH') {
        if (screen === 'HOME' && activeTab !== 'NAVIGATE') {
          setActiveTab('NAVIGATE');
          return true; // consumed
        }
        // At home Navigate tab — ask before exiting the app
        Alert.alert(
          'Exit Pathverse AR?',
          'Are you sure you want to close the app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit',   style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // consumed
      }

      if (screen === 'AR') {
        // During active navigation — confirm before stopping
        Alert.alert(
          'End Navigation?',
          'This will stop the current AR session and return to Home.',
          [
            { text: 'Keep Navigating', style: 'cancel' },
            { text: 'End Session',     style: 'destructive', onPress: handleStop },
          ]
        );
        return true;
      }

      if (back) {
        if (back === 'HOME' && screen === 'AR_MAPPER') {
          setActiveTab('SETTINGS');
        }
        setScreen(back);
        return true; // consumed
      }

      return false;
    });

    return () => handler.remove();
  }, [screen, activeTab]);

  // ── Screen transition handlers ───────────────────────────────────────────
  const handleSplashDone = () => {
    fetchProfile();
    setScreen('HOME');
  };

  const handleStartNavigation = () => {
    setPreselectedDest(null);
    setScreen('SCANNER');
  };

  const handleStartNavigationWithFavorite = (destNode) => {
    setPreselectedDest(destNode);
    setScreen('SCANNER');
  };

  const handleAnchorFound = (anchorNode, dest) => {
    setAnchor(anchorNode);
    setDestination(dest);
    const nodes = getAllNodes();
    const edges = getAllEdges();
    let path  = calculateAStarPath(anchorNode.id, dest.id, nodes, edges);
    // Fallback: if no connected path found, draw a straight-line route
    // so arrows ALWAYS appear regardless of graph connectivity
    if (!path || path.length < 2) {
      path = [anchorNode, dest];
    }
    setRoute(path);
    setScreen('AR');
  };

  const getPathDistance = (path) => {
    if (!path || path.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const n1 = path[i];
      const n2 = path[i + 1];
      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dz = n1.z - n2.z;
      dist += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return dist;
  };

  const handleStop = useCallback(() => {
    try {
      if (route && route.length >= 2) {
        const dist = getPathDistance(route);
        if (dist > 0) {
          const startName = route[0].name || route[0].id;
          const endName = route[route.length - 1].name || route[route.length - 1].id;
          addNavigationMetric(dist, startName, endName);
        }
      }
    } catch (e) {
      console.error("Error logging path distance:", e);
    }
    setScreen('HOME');
    setDestination(null);
    setAnchor(null);
    setRoute([]);
  }, [route]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {screen === 'SPLASH' && (
        <SplashScreen onFinish={handleSplashDone} />
      )}

      {screen === 'HOME' && (
        <View style={{ flex: 1 }}>
          {/* Tab Screen Content */}
          {activeTab === 'NAVIGATE' && (
            <HomeScreen
              onStartNavigation={handleStartNavigation} // to scanner
              onManualStart={(anchor, dest) => handleAnchorFound(anchor, dest)} // bypass scanner directly
              onDevMode={() => setActiveTab('SETTINGS')}
            />
          )}

          {activeTab === 'FAVORITES' && (
            <FavoritesScreen
              onNavigateFavorite={handleStartNavigationWithFavorite}
              onBack={() => setActiveTab('NAVIGATE')}
            />
          )}

          {activeTab === 'DASHBOARD' && (
            <DashboardScreen onBack={() => setActiveTab('NAVIGATE')} />
          )}

          {activeTab === 'SETTINGS' && (
            profile?.email === 'anasmobin0@gmail.com' ? (
              <DBViewerScreen
                onBack={() => setActiveTab('NAVIGATE')}
                onOpenMapper={() => setScreen('AR_MAPPER')}
                onOpenOCRLog={() => setActiveTab('DASHBOARD')}
              />
            ) : (
              <UserProfileScreen
                onBack={() => setActiveTab('NAVIGATE')}
                onResetProfile={() => {
                  setProfile(null);
                  setScreen('SPLASH');
                }}
              />
            )
          )}

          {/* Modern Floating Bottom Navigation Bar */}
          <View style={styles.tabBarContainer}>
            {/* Tab 1: Navigate */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.65}
              onPress={() => setActiveTab('NAVIGATE')}
            >
              {activeTab === 'NAVIGATE' && <View style={styles.activeDot} />}
              <Ionicons
                name={activeTab === 'NAVIGATE' ? 'compass' : 'compass-outline'}
                size={22}
                color={activeTab === 'NAVIGATE' ? '#00e5ff' : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[
                styles.tabLabel,
                activeTab === 'NAVIGATE' && styles.tabLabelActive
              ]}>Navigate</Text>
            </TouchableOpacity>

            {/* Tab 2: Favorites */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.65}
              onPress={() => setActiveTab('FAVORITES')}
            >
              {activeTab === 'FAVORITES' && <View style={styles.activeDot} />}
              <Ionicons
                name={activeTab === 'FAVORITES' ? 'star' : 'star-outline'}
                size={22}
                color={activeTab === 'FAVORITES' ? '#00e5ff' : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[
                styles.tabLabel,
                activeTab === 'FAVORITES' && styles.tabLabelActive
              ]}>Favorites</Text>
            </TouchableOpacity>

            {/* Tab 3: Dashboard */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.65}
              onPress={() => setActiveTab('DASHBOARD')}
            >
              {activeTab === 'DASHBOARD' && <View style={styles.activeDot} />}
              <Ionicons
                name={activeTab === 'DASHBOARD' ? 'stats-chart' : 'stats-chart-outline'}
                size={22}
                color={activeTab === 'DASHBOARD' ? '#00e5ff' : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[
                styles.tabLabel,
                activeTab === 'DASHBOARD' && styles.tabLabelActive
              ]}>Dashboard</Text>
            </TouchableOpacity>

            {/* Tab 4: Settings */}
            <TouchableOpacity
              style={styles.tabItem}
              activeOpacity={0.65}
              onPress={() => setActiveTab('SETTINGS')}
            >
              {activeTab === 'SETTINGS' && <View style={styles.activeDot} />}
              <Ionicons
                name={activeTab === 'SETTINGS' ? 'settings' : 'settings-outline'}
                size={22}
                color={activeTab === 'SETTINGS' ? '#00e5ff' : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[
                styles.tabLabel,
                activeTab === 'SETTINGS' && styles.tabLabelActive
              ]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {screen === 'SCANNER' && (
        <ScannerScreen
          onAnchorFound={handleAnchorFound}
          onCancel={() => setScreen('HOME')}
          preselectedDestination={preselectedDest}
        />
      )}

      {screen === 'AR_MAPPER' && (
        <ARMapperScreen onCancel={() => { setScreen('HOME'); setActiveTab('SETTINGS'); }} />
      )}

      {screen === 'AR' && (
        <ARNavigationScreen
          routeNodes={route}
          anchorNode={anchor}
          onStop={() => {
            Alert.alert(
              'End Navigation?',
              'Return to Home screen?',
              [
                { text: 'Keep Navigating', style: 'cancel' },
                { text: 'End',             onPress: handleStop },
              ]
            );
          }}
          onReturnHome={handleStop}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020818' },
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(7, 20, 40, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#00e5ff',
  },
});
