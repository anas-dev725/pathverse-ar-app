import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getAllNodes, getAllEdges, addEdge, getOCRLogs } from '../database/database';

// Helper — compute Euclidean distance for a default edge weight
const distBetween = (a, b) => {
  const dx = a.x - b.x; const dy = a.y - b.y; const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed(2);
};

export default function DBViewerScreen({ onBack, onOpenMapper, onOpenOCRLog }) {
  const [nodes, setNodes]  = useState([]);
  const [edges, setEdges]  = useState([]);
  const [ocrCount, setOcrCount] = useState(0);
  const [name1, setName1]  = useState('');
  const [name2, setName2]  = useState('');
  const [dist, setDist]    = useState('');
  const [error, setError]  = useState('');
  const [success, setSucc] = useState('');

  const refresh = () => {
    setNodes(getAllNodes());
    setEdges(getAllEdges());
    setOcrCount(getOCRLogs().length);
  };
  useEffect(() => { refresh(); }, []);

  const handleCreateEdge = () => {
    setError(''); setSucc('');
    const n1 = nodes.find(n => n.name.toLowerCase() === name1.trim().toLowerCase());
    const n2 = nodes.find(n => n.name.toLowerCase() === name2.trim().toLowerCase());
    if (!n1) { setError(`Node not found: "${name1}"\nCheck spelling or tap a name chip below.`); return; }
    if (!n2) { setError(`Node not found: "${name2}"\nCheck spelling or tap a name chip below.`); return; }
    const weight = dist.trim() ? parseFloat(dist) : parseFloat(distBetween(n1, n2));
    addEdge(n1.id, n2.id, weight);
    Alert.alert('Edge Saved', `"${n1.name}" ↔ "${n2.name}" connected (${weight.toFixed(1)} m)`, [{ text: 'OK' }]);
    setName1(''); setName2(''); setDist('');
    setSucc(`✅ Connected "${n1.name}" ↔ "${n2.name}" (${weight.toFixed(1)} m)`);
    refresh();
  };

  // Render edge with human names
  const edgeName = (edge) => {
    const a = nodes.find(n => n.id === edge.node1_id);
    const b = nodes.find(n => n.id === edge.node2_id);
    return `${a?.name ?? edge.node1_id}  ↔  ${b?.name ?? edge.node2_id}  (${parseFloat(edge.distance).toFixed(1)} m)`;
  };

  return (
    <LinearGradient colors={['#020818', '#071428', '#0a1e3a']} style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.titleSmall}>DEVELOPER TOOLS</Text>
              <Text style={styles.title}>Data Core</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onBack}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* AR Mapper button */}
          <TouchableOpacity style={styles.mapperBtn} onPress={onOpenMapper}>
            <Ionicons name="navigate-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.mapperBtnTxt}>Boot Live AR Root Mapper</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ocrLogBtn} onPress={onOpenOCRLog}>
            <Ionicons name="camera-outline" size={18} color="#4db8ff" style={{ marginRight: 8 }} />
            <Text style={styles.ocrLogBtnTxt}>View OCR Scan Log</Text>
            {ocrCount > 0 && (
              <View style={styles.ocrBadge}>
                <Text style={styles.ocrBadgeTxt}>{ocrCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── LocationNodes ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location Nodes</Text>
              <View style={styles.countBadge}><Text style={styles.countTxt}>{nodes.length}</Text></View>
            </View>
            {nodes.map(n => (
              <View key={n.id} style={styles.dataRow}>
                <View style={[styles.typeBar, { backgroundColor: n.type === 'room' ? '#4db8ff' : n.type === 'stairs' ? '#f39c12' : '#2ecc71' }]} />
                <View style={styles.dataBody}>
                  {/* Instruction 4: show name prominently, not raw ID */}
                  <Text style={styles.nodeName}>{n.name}</Text>
                  <Text style={styles.nodeSub}>
                    {n.type}  ·  X {n.x.toFixed(2)}  Y {n.y.toFixed(2)}  Z {n.z.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {nodes.length === 0 && <Text style={styles.emptyTxt}>No nodes saved yet. Use the AR Mapper.</Text>}
          </View>

          {/* ── Edges ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Graph Edges</Text>
              <View style={styles.countBadge}><Text style={styles.countTxt}>{edges.length}</Text></View>
            </View>
            {edges.map(e => (
              <View key={e.id.toString()} style={styles.edgeRow}>
                <Ionicons name="git-commit-outline" size={14} color="#4db8ff" style={{ marginRight: 8 }} />
                <Text style={styles.edgeTxt}>{edgeName(e)}</Text>
              </View>
            ))}
            {edges.length === 0 && <Text style={styles.emptyTxt}>No edges yet. Connect nodes below.</Text>}
          </View>

          {/* ── Connect Nodes (by name, Instruction 4) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect Nodes</Text>
            <Text style={styles.helpTxt}>Type the landmark names exactly as saved. Distance auto-calculates if left blank.</Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                placeholder="From (e.g. Main Gate)"
                placeholderTextColor="#455A64"
                value={name1}
                onChangeText={setName1}
                returnKeyType="next"
              />
              <View style={{ height: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="To (e.g. IT-301 Lab)"
                placeholderTextColor="#455A64"
                value={name2}
                onChangeText={setName2}
                returnKeyType="next"
              />
              <View style={{ height: 8 }} />
              <TextInput
                style={[styles.input, { width: 130 }]}
                placeholder="Distance (auto)"
                placeholderTextColor="#455A64"
                value={dist}
                onChangeText={setDist}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleCreateEdge}
              />
            </View>

            {!!error && <Text style={styles.errorTxt}>{error}</Text>}
            {!!success && <Text style={styles.successTxt}>{success}</Text>}

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateEdge}>
              <Ionicons name="link-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnTxt}>Save Edge to SQLite</Text>
            </TouchableOpacity>

            {/* Quick-pick for name reference */}
            {nodes.length > 0 && (
              <View style={styles.quickPick}>
                <Text style={styles.quickLabel}>SAVED NAMES (tap to copy to "From")</Text>
                <View style={styles.quickRow}>
                  {nodes.map(n => (
                    <TouchableOpacity key={n.id} style={styles.quickChip} onPress={() => { if (!name1) setName1(n.name); else setName2(n.name); }}>
                      <Text style={styles.quickChipTxt}>{n.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleSmall: { color: '#4db8ff', fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 4 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900' },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  mapperBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4db8ff', padding: 16, borderRadius: 16, marginBottom: 24, elevation: 4, shadowColor: '#4db8ff', shadowOpacity: 0.4, shadowRadius: 10 },
  mapperBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  section: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', flex: 1 },
  countBadge: { backgroundColor: 'rgba(77,184,255,0.15)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(77,184,255,0.3)' },
  countTxt: { color: '#4db8ff', fontSize: 12, fontWeight: '800' },

  dataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  typeBar: { width: 4, height: '100%', minHeight: 36, borderRadius: 2, marginRight: 12 },
  dataBody: { flex: 1 },
  nodeName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  nodeSub: { color: '#455A64', fontSize: 11, fontFamily: 'monospace', marginTop: 2 },

  edgeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  edgeTxt: { color: '#A0B0B9', fontSize: 13, fontWeight: '600' },

  emptyTxt: { color: '#455A64', fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  helpTxt: { color: '#455A64', fontSize: 12, marginBottom: 12 },
  inputGroup: { flexDirection: 'column', marginBottom: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 8 },
  errorTxt:   { color: '#ff4d4d', fontSize: 12, marginBottom: 10 },
  successTxt: { color: '#2ecc71', fontSize: 12, marginBottom: 10, fontWeight: '700' },
  ocrLogBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(77,184,255,0.08)', padding: 14, borderRadius: 14,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(77,184,255,0.3)',
  },
  ocrLogBtnTxt: { color: '#4db8ff', fontWeight: '700', fontSize: 14, flex: 1, textAlign: 'center' },
  ocrBadge: { backgroundColor: '#4db8ff', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8 },
  ocrBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '900' },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  quickPick: { marginTop: 16 },
  quickLabel: { color: '#455A64', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  quickChip: { margin: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  quickChipTxt: { color: '#A0B0B9', fontSize: 12, fontWeight: '600' },
});
