import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  Image, Alert, Dimensions, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getOCRLogs, clearOCRLogs } from '../database/database';

const { width: W } = Dimensions.get('window');
const THUMB_W = (W - 60) / 2;

// Format ISO timestamp to readable local time
const fmtTime = (iso) => {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  } catch { return iso; }
};

export default function OCRLogScreen({ onBack }) {
  const [logs, setLogs]         = useState([]);
  const [selected, setSelected] = useState(null);   // detail view
  const [refreshing, setRef]    = useState(false);

  const load = useCallback(() => {
    setLogs(getOCRLogs());
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRef(true); load(); setRef(false); };

  const handleClear = () => {
    Alert.alert(
      'Clear OCR Log?',
      'This will permanently delete all saved scan images and OCR text from the database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: () => { clearOCRLogs(); load(); setSelected(null); }
        },
      ]
    );
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selected) {
    const matched = selected.matched_name?.trim();
    return (
      <LinearGradient colors={['#020818', '#071428']} style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backCircle} onPress={() => setSelected(null)}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Detail</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {selected.image_path ? (
            <Image
              source={{ uri: selected.image_path }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageBox}>
              <Text style={styles.noImageTxt}>📷 Image not found</Text>
              <Text style={styles.noImageSub}>File may have been deleted by the OS temp cleaner</Text>
            </View>
          )}

          {/* Match result badge */}
          <View style={[styles.matchBadge, matched ? styles.matchBadgeGreen : styles.matchBadgeRed]}>
            <Ionicons
              name={matched ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={matched ? '#2ecc71' : '#ff4d4d'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.matchBadgeTxt, { color: matched ? '#2ecc71' : '#ff4d4d' }]}>
              {matched ? `Matched: ${matched}` : 'No match found'}
            </Text>
          </View>

          <Text style={styles.detailLabel}>TIME</Text>
          <Text style={styles.detailValue}>{fmtTime(selected.timestamp)}</Text>

          <Text style={styles.detailLabel}>RAW OCR TEXT</Text>
          <View style={styles.ocrBox}>
            <Text style={styles.ocrText}>
              {selected.raw_text?.trim() || '(no text recognized)'}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#020818', '#071428']} style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSmall}>ADMIN · OCR AUDIT</Text>
          <Text style={styles.headerTitle}>Scan Log</Text>
        </View>
        {logs.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Ionicons name="trash-outline" size={16} color="#ff4d4d" />
            <Text style={styles.clearBtnTxt}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{logs.length}</Text>
          <Text style={styles.statLabel}>Total Scans</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#2ecc71' }]}>
            {logs.filter(l => l.matched_name).length}
          </Text>
          <Text style={styles.statLabel}>Matches</Text>
        </View>
        <View style={styles.statDiv} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#ff4d4d' }]}>
            {logs.filter(l => !l.matched_name).length}
          </Text>
          <Text style={styles.statLabel}>Misses</Text>
        </View>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No scans recorded yet</Text>
          <Text style={styles.emptySub}>
            Every time the scanner attempts OCR, the captured image and extracted text
            will appear here automatically.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4db8ff" />}
        >
          {logs.map(log => {
            const matched = log.matched_name?.trim();
            return (
              <TouchableOpacity key={log.id} style={styles.card} onPress={() => setSelected(log)} activeOpacity={0.8}>
                {/* Thumbnail */}
                {log.image_path ? (
                  <Image source={{ uri: log.image_path }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <Ionicons name="image-outline" size={28} color="#455A64" />
                  </View>
                )}

                {/* Match badge */}
                <View style={[styles.cardBadge, matched ? styles.badgeGreen : styles.badgeRed]}>
                  <Text style={styles.cardBadgeTxt}>
                    {matched ? '✅' : '❌'}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                  <Text style={styles.cardMatch} numberOfLines={1}>
                    {matched || 'No match'}
                  </Text>
                  <Text style={styles.cardOCR} numberOfLines={2}>
                    {log.raw_text?.trim() || '(empty)'}
                  </Text>
                  <Text style={styles.cardTime}>{fmtTime(log.timestamp)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  headerSmall: { color: '#4db8ff', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,77,77,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,77,77,0.3)' },
  clearBtnTxt: { color: '#ff4d4d', fontSize: 13, fontWeight: '700', marginLeft: 4 },

  // Stats
  statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  statItem: { alignItems: 'center' },
  statNum:  { color: '#4db8ff', fontSize: 26, fontWeight: '900' },
  statLabel:{ color: '#455A64', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  statDiv:  { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Empty
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  emptySub:   { color: '#455A64', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Grid
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: THUMB_W, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  thumb: { width: '100%', height: THUMB_W * 0.7, backgroundColor: '#0a1428' },
  thumbFallback: { justifyContent: 'center', alignItems: 'center' },
  cardBadge: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  badgeGreen:   { backgroundColor: 'rgba(46,204,113,0.85)' },
  badgeRed:     { backgroundColor: 'rgba(255,77,77,0.85)' },
  cardBadgeTxt: { fontSize: 13 },
  cardBody: { padding: 10 },
  cardMatch:{ color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  cardOCR:  { color: '#607D8B', fontSize: 11, marginBottom: 6, lineHeight: 16 },
  cardTime: { color: '#37474F', fontSize: 10, fontWeight: '600' },

  // Detail
  detailImage: { width: '100%', height: 260, borderRadius: 18, marginBottom: 16 },
  noImageBox:  { width: '100%', height: 200, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  noImageTxt:  { color: '#607D8B', fontSize: 16, fontWeight: '700' },
  noImageSub:  { color: '#37474F', fontSize: 12, marginTop: 6 },
  matchBadge:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, marginBottom: 20, borderWidth: 1 },
  matchBadgeGreen: { backgroundColor: 'rgba(46,204,113,0.1)', borderColor: 'rgba(46,204,113,0.3)' },
  matchBadgeRed:   { backgroundColor: 'rgba(255,77,77,0.1)',  borderColor: 'rgba(255,77,77,0.3)' },
  matchBadgeTxt:   { fontSize: 15, fontWeight: '700' },
  detailLabel: { color: '#455A64', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 6, marginTop: 16 },
  detailValue: { color: '#A0B0B9', fontSize: 14, fontWeight: '600' },
  ocrBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 4 },
  ocrText:{ color: '#4db8ff', fontSize: 14, fontFamily: 'monospace', lineHeight: 22 },
});
