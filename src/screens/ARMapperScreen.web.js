import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ARMapperScreen({ onCancel }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🕶️ AR Spatial Mapping requires Native hardware.</Text>
      <Text style={styles.subtext} onPress={onCancel}>Close Map Mode</Text>
    </View>
  );
}
const styles = StyleSheet.create({ 
  container: { flex: 1, backgroundColor: '#0F2027', justifyContent: 'center', alignItems: 'center' }, 
  text: { color: '#4db8ff', fontSize: 18, fontWeight: 'bold' }, 
  subtext: { color: '#ff4d4d', fontSize: 16, marginTop: 20, textDecorationLine: 'underline' } 
});
