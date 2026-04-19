import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web mock to prevent Metro from crashing when trying to compile ViroReact natively
export default function ARNavigationScreen({ onStop }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🕶️ AR Navigation is not supported on Web Preview.</Text>
      <Text style={styles.subtext} onPress={onStop}>Go Back</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2027', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#4db8ff', fontSize: 18, fontWeight: 'bold' },
  subtext: { color: '#ff4d4d', fontSize: 16, marginTop: 20, textDecorationLine: 'underline' }
});
