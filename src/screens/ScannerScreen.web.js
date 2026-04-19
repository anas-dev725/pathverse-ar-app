import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web mock to prevent Metro from crashing when trying to compile ML Kit natively
export default function ScannerScreen({ onCancel }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📸 Scanner is not supported on Web Preview.</Text>
      <Text style={styles.subtext} onPress={onCancel}>Go Back</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2027', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#4db8ff', fontSize: 18, fontWeight: 'bold' },
  subtext: { color: '#ff4d4d', fontSize: 16, marginTop: 20, textDecorationLine: 'underline' }
});
