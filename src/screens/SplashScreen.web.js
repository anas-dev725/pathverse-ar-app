import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ onFinish }) {
  // Immediately call onFinish for web previews
  onFinish?.();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>PathverseAR</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: '#020818', justifyContent:'center', alignItems:'center' },
  text: { color: '#4db8ff', fontSize: 24, fontWeight: '900' }
});
