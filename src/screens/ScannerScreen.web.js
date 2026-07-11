import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getAllNodes } from '../database/database';

export default function ScannerScreen({ onAnchorFound, onCancel, preselectedDestination }) {
  const handleSimulate = () => {
    const all = getAllNodes();
    const mockAnchor = all.find(n => n.id === 'it_gate') || all[0];
    const mockDest = preselectedDestination || all.find(n => n.id === 'it_lab_1') || all[1];
    
    if (onAnchorFound) {
      onAnchorFound(mockAnchor, mockDest);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📸 Scanner Simulator (Web Preview)</Text>
      
      {preselectedDestination && (
        <Text style={styles.destText}>Preselected Destination: {preselectedDestination.name}</Text>
      )}

      <TouchableOpacity style={styles.simBtn} onPress={handleSimulate}>
        <Text style={styles.simBtnTxt}>✓ Confirm Scan (Simulate Calibration)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel} style={{ marginTop: 24 }}>
        <Text style={styles.cancelTxt}>Cancel & Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020818', justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  destText: { color: '#00e5ff', fontSize: 15, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  simBtn: {
    backgroundColor: '#00e5ff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
  },
  simBtnTxt: { color: '#020818', fontSize: 15, fontWeight: '800' },
  cancelTxt: { color: '#ff4d4d', fontSize: 15, textDecorationLine: 'underline', fontWeight: '600' }
});
