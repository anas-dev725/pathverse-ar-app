import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, BackHandler, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Database & Algorithms
import { initDB, seedDummyData, getAllNodes, getAllEdges } from './src/database/database';
import { calculateAStarPath } from './src/services/AStarAlgorithm';

// Screens
import SplashScreen        from './src/screens/SplashScreen';
import HomeScreen          from './src/screens/HomeScreen';
import ScannerScreen       from './src/screens/ScannerScreen';
import ARNavigationScreen  from './src/screens/ARNavigationScreen';
import DBViewerScreen      from './src/screens/DBViewerScreen';
import ARMapperScreen      from './src/screens/ARMapperScreen';
import OCRLogScreen        from './src/screens/OCRLogScreen';

// Defines the back-navigation hierarchy for each screen
const BACK_MAP = {
  SCANNER:   'HOME',
  DB_VIEWER: 'HOME',
  AR_MAPPER: 'DB_VIEWER',
  OCR_LOG:   'DB_VIEWER',
  AR:        null,
};

export default function App() {
  const [screen, setScreen]           = useState('SPLASH');
  const [destination, setDestination] = useState(null);
  const [anchor, setAnchor]           = useState(null);
  const [route, setRoute]             = useState([]);

  useEffect(() => {
    try { initDB(); seedDummyData(); } catch (e) { console.error(e); }
  }, []);

  // ── Android hardware back button handler ─────────────────────────────────
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      const back = BACK_MAP[screen];

      if (screen === 'HOME' || screen === 'SPLASH') {
        // At home — ask before exiting the app
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
        setScreen(back);
        return true; // consumed
      }

      return false;
    });

    return () => handler.remove();
  }, [screen]);

  // ── Screen transition handlers ───────────────────────────────────────────
  const handleSplashDone = () => setScreen('HOME');

  const handleStartNavigation = () => setScreen('SCANNER');

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

  const handleStop = useCallback(() => {
    setScreen('HOME');
    setDestination(null);
    setAnchor(null);
    setRoute([]);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {screen === 'SPLASH' && (
        <SplashScreen onFinish={handleSplashDone} />
      )}

      {screen === 'HOME' && (
        <HomeScreen
          onStartNavigation={handleStartNavigation} // to scanner
          onManualStart={(anchor, dest) => handleAnchorFound(anchor, dest)} // bypass scanner directly
          onDevMode={() => setScreen('DB_VIEWER')}
        />
      )}

      {screen === 'SCANNER' && (
        <ScannerScreen
          onAnchorFound={handleAnchorFound}
          onCancel={() => setScreen('HOME')}
        />
      )}

      {screen === 'DB_VIEWER' && (
        <DBViewerScreen
          onBack={() => setScreen('HOME')}
          onOpenMapper={() => setScreen('AR_MAPPER')}
          onOpenOCRLog={() => setScreen('OCR_LOG')}
        />
      )}

      {screen === 'AR_MAPPER' && (
        <ARMapperScreen onCancel={() => setScreen('DB_VIEWER')} />
      )}

      {screen === 'OCR_LOG' && (
        <OCRLogScreen onBack={() => setScreen('DB_VIEWER')} />
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#020818' },
});
