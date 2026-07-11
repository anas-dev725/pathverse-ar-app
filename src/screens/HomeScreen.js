import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Modal, Animated, Dimensions, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fuzzySearchRooms } from '../services/SearchService';
import { getAllNodes, getFavorites, addFavorite, removeFavorite, getUserProfile } from '../database/database';

const { width: W } = Dimensions.get('window');
const TYPE_ICONS = { room: 'school-outline', corridor: 'git-merge-outline', stairs: 'trending-up-outline', exit: 'exit-outline' };
const TYPE_COLOR = { room: '#4db8ff', corridor: '#f39c12', stairs: '#9b59b6', exit: '#2ecc71' };

export default function HomeScreen({ onStartNavigation, onManualStart, onDevMode }) {
  const [nodes, setNodes] = useState([]);
  const [profileName, setProfileName] = useState('Explorer');
  
  // Navigation State
  const [startNode, setStartNode] = useState(null);
  const [destNode, setDestNode]   = useState(null);
  
  // Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType]       = useState('START'); // 'START' | 'DEST'
  const [query, setQuery]                 = useState('');
  const [results, setResults]             = useState([]);

  // Animations
  const headerY = useRef(new Animated.Value(-30)).current;
  const headerOp = useRef(new Animated.Value(0)).current;

  const [favIds, setFavIds] = useState([]);

  const loadFavs = () => {
    try {
      const list = getFavorites();
      setFavIds(list.map(f => f.id));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = (itemId) => {
    try {
      const list = getFavorites();
      const isFav = list.some(f => f.id === itemId);
      if (isFav) {
        removeFavorite(itemId);
      } else {
        addFavorite(itemId);
      }
      loadFavs();
    } catch (e) {
      console.error(e);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const all = getAllNodes().filter(n => n.name && n.name.trim() !== ''); 
    setNodes(all);
    setResults(all);
    loadFavs();

    try {
      const prof = getUserProfile();
      if (prof && prof.name) {
        setProfileName(prof.name);
      }
    } catch (e) {
      console.error(e);
    }

    Animated.parallel([
      Animated.timing(headerY,  { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const openPicker = (type) => {
    setPickerType(type);
    setQuery('');
    setResults(nodes);
    setPickerVisible(true);
  };

  const handleSearch = (text) => {
    setQuery(text);
    if (!text) setResults(nodes);
    else setResults(fuzzySearchRooms(text, nodes));
  };

  const selectNode = (node) => {
    if (pickerType === 'START') {
      setStartNode(node);
      // Auto-advance to destination if empty
      if (!destNode) {
        setPickerType('DEST');
        setQuery('');
        setResults(nodes);
        return;
      }
    } else {
      setDestNode(node);
    }
    setPickerVisible(false);
  };

  const handleStart = () => {
    if (startNode && destNode) {
      onManualStart(startNode, destNode);
    } else if (!startNode) {
      openPicker('START');
    } else {
      openPicker('DEST');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#020818', '#071428', '#0a1e3a']} style={StyleSheet.absoluteFill} />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -60, left: -60, backgroundColor: 'rgba(77,184,255,0.06)' }]} />
      <View style={[styles.orb, { bottom: 100, right: -100, backgroundColor: 'rgba(255,255,255,0.03)' }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <Animated.View style={{ opacity: headerOp, transform: [{ translateY: headerY }] }}>
          {/* Brand Header & Dynamic Greeting */}
          <View style={styles.greetingHeaderWrap}>
            <Text style={styles.navGreetingText}>{getGreeting()}, {profileName}</Text>
            <Text style={styles.navSubGreetingText}>Welcome to Pathverse AR</Text>
          </View>

          <View style={{height: 10}}/>

          {/* Navigation Card */}
          <View style={styles.navCard}>
            
            {/* Start Field */}
            <TouchableOpacity style={styles.inputField} onPress={() => openPicker('START')} activeOpacity={0.7}>
              <View style={styles.iconWrap}><Ionicons name="radio-button-on" size={18} color="#9b59b6" /></View>
              <View style={styles.textWrap}>
                <Text style={styles.fieldLabel}>Current Location</Text>
                <Text style={[styles.fieldValue, !startNode && { color: '#607D8B' }]}>
                  {startNode ? startNode.name : "Set starting point"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Destination Field */}
            <TouchableOpacity style={styles.inputField} onPress={() => openPicker('DEST')} activeOpacity={0.7}>
               <View style={styles.iconWrap}><Ionicons name="location" size={20} color="#ff3b30" /></View>
               <View style={styles.textWrap}>
                 <Text style={styles.fieldLabel}>Destination</Text>
                 <Text style={[styles.fieldValue, !destNode && { color: '#607D8B' }]}>
                   {destNode ? destNode.name : "Choose destination"}
                 </Text>
               </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.startBtn, (startNode && destNode) ? null : styles.startBtnDisabled]} 
              activeOpacity={0.8}
              onPress={handleStart}
            >
              <Text style={styles.startBtnTxt}>Start Navigation</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.orTxt}>OR</Text>

          <TouchableOpacity style={styles.camBtn} onPress={onStartNavigation} activeOpacity={0.7}>
             <Ionicons name="scan-outline" size={24} color="#4db8ff" />
             <Text style={styles.camBtnTxt}>Scan room sign</Text>
          </TouchableOpacity>
          
          <View style={{height: 35}} />

          {/* ── AVAILABLE LOCATIONS SECTION ── */}
          <View style={styles.searchBarHome}>
            <Ionicons name="search-outline" size={20} color="#607D8B" style={{marginRight: 12}} />
            <TextInput
              style={styles.searchInputHome}
              placeholder="Search room, lab, office…"
              placeholderTextColor="#607D8B"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <Text style={styles.sectionLabel}>AVAILABLE LOCATIONS</Text>

          {/* Filter rooms/exits for the list */}
          {(query ? results : nodes).filter(n => n.type === 'room' || n.type === 'exit').map((item, index) => {
            const color = TYPE_COLOR[item.type] || '#4db8ff';
            const icon  = TYPE_ICONS[item.type] || 'location-outline';
            const isFav = favIds.includes(item.id);
            return (
              <View key={item.id} style={styles.roomCardRow}>
                <TouchableOpacity 
                  style={styles.roomCardBody} 
                  activeOpacity={0.75}
                  onPress={() => {
                    setDestNode(item);
                    if (!startNode) openPicker('START');
                  }}
                >
                  <View style={[styles.cardIcon, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>IoBM · {item.type}</Text>
                  </View>
                </TouchableOpacity>

                {/* Star bookmark toggle */}
                <TouchableOpacity
                  style={styles.starCardBtn}
                  onPress={() => toggleFavorite(item.id)}
                  hitSlop={{top:10, bottom:10, left:10, right:10}}
                >
                  <Ionicons 
                    name={isFav ? 'star' : 'star-outline'} 
                    size={22} 
                    color={isFav ? '#00e5ff' : 'rgba(255,255,255,0.25)'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.arrowCircle}
                  onPress={() => {
                    setDestNode(item);
                    if (!startNode) openPicker('START');
                  }}
                >
                  <Ionicons name="arrow-forward" size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          })}


        </Animated.View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <View style={styles.modalDrag} />
              
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {pickerType === 'START' ? 'Select Current Location' : 'Select Destination'}
                </Text>
                <TouchableOpacity onPress={() => setPickerVisible(false)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#607D8B" style={{marginRight: 10}}/>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search labs, offices, entrances..."
                  placeholderTextColor="#607D8B"
                  value={query}
                  onChangeText={handleSearch}
                  autoFocus
                />
              </View>

              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {results.map((item) => {
                  const color = TYPE_COLOR[item.type] || '#4db8ff';
                  const icon  = TYPE_ICONS[item.type] || 'location-outline';
                  const isFav = favIds.includes(item.id);
                  return (
                    <View key={item.id} style={styles.listItemRow}>
                      <TouchableOpacity style={styles.listItemBody} onPress={() => selectNode(item)}>
                        <View style={[styles.listIcon, { backgroundColor: `${color}22` }]}>
                          <Ionicons name={icon} size={20} color={color} />
                        </View>
                        <View style={{flex:1}}>
                          <Text style={styles.listName}>{item.name}</Text>
                          <Text style={styles.listType}>{item.type}</Text>
                        </View>
                      </TouchableOpacity>
                      
                      {/* Star Bookmark Icon Toggle */}
                      <TouchableOpacity 
                        style={styles.starToggleBtn} 
                        onPress={() => toggleFavorite(item.id)}
                        hitSlop={{top:10, bottom:10, left:10, right:10}}
                      >
                        <Ionicons 
                          name={isFav ? 'star' : 'star-outline'} 
                          size={20} 
                          color={isFav ? '#00e5ff' : 'rgba(255,255,255,0.3)'} 
                        />
                      </TouchableOpacity>

                      <Ionicons name="chevron-forward" size={18} color="#37474F" style={{marginLeft: 10}} />
                    </View>
                  );
                })}
                <View style={{height:40}}/>
              </ScrollView>
           </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 110 },
  
  greetingHeaderWrap: {
    marginTop: 20,
    marginBottom: 6,
  },
  navGreetingText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00e5ff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
  },
  navSubGreetingText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },

  navCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 8,
  },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  devBtn: { padding: 4 },
  heroTitle: { fontSize: 44, fontWeight: '900', color: '#4db8ff', letterSpacing: 0.5 },
  heroSub: { fontSize: 16, color: '#A0B0B9', fontWeight: '500', marginTop: 8 },
  inputField: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  iconWrap: { width: 36, alignItems: 'center' },
  textWrap: { flex: 1 },
  fieldLabel: { color: '#607D8B', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  fieldValue: { color: '#fff', fontSize: 18, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 52, marginVertical: 4 },

  startBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18, marginTop: 12, paddingVertical: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700', marginRight: 10 },

  orTxt: { 
    textAlign: 'center', color: '#607D8B', fontWeight: '800', 
    letterSpacing: 4, marginVertical: 24, fontSize: 13 
  },
  camBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 22,
    backgroundColor: 'rgba(77,184,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(77,184,255,0.25)',
    marginBottom: 10,
  },
  camBtnTxt: { color: '#4db8ff', fontSize: 17, fontWeight: '700', marginLeft: 12 },

  // ── Main Actions ────────────────────────────────────────────────────────
  startBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18, marginTop: 12, paddingVertical: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '700', marginRight: 10 },

  orTxt: { 
    textAlign: 'center', color: '#607D8B', fontWeight: '800', 
    letterSpacing: 4, marginVertical: 24, fontSize: 13 
  },
  camBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 22,
    backgroundColor: 'rgba(77,184,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(77,184,255,0.25)',
    marginBottom: 10,
  },
  camBtnTxt: { color: '#4db8ff', fontSize: 17, fontWeight: '700', marginLeft: 12 },

  // List Styles
  searchBarHome: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 14, marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInputHome: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
  sectionLabel: { color: '#455A64', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase' },
  roomCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20,
    padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardIcon: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 2 },
  cardSub: { color: '#607D8B', fontSize: 12, fontWeight: '500' },
  arrowCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(77,184,255,0.15)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(77,184,255,0.3)',
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: {
    backgroundColor: '#0c192d', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '80%', paddingHorizontal: 20, paddingTop: 12,
  },
  modalDrag: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },

  list: { flex: 1 },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  listName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  listType: { color: '#607D8B', fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },

  // Favorites layout addition
  roomCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    paddingRight: 14,
    overflow: 'hidden',
  },
  roomCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  starCardBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingRight: 10,
  },
  listItemBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  starToggleBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
