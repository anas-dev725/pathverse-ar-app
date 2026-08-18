// Web mock for SQLite Database. Allows Web Preview in IDE without Native module crashing.
export const initDB = () => {
    console.log("Mock SQLite Init on Web");
};
export const seedDummyData = () => {};

export const getAllNodes = () => {
  return [
    { id: 'lobby_f1', name: 'Lobby Floor 1', x: 0, y: 0.0, z: 0, type: 'corridor' },
    { id: 'room_101', name: 'Room 101 (F1)', x: 3, y: 0.0, z: 2, type: 'room' },
    { id: 'stairs_f1', name: 'Stairs Floor 1', x: 0, y: 0.0, z: 10, type: 'stairs' },
    { id: 'stairs_f2', name: 'Stairs Floor 2', x: 0, y: 4.0, z: 10, type: 'stairs' },
    { id: 'lobby_f2', name: 'Lobby Floor 2', x: 0, y: 4.0, z: 0, type: 'corridor' },
    { id: 'room_201', name: 'Room 201 (F2)', x: -3, y: 4.0, z: -2, type: 'room' },
    { id: 'stairs_f3', name: 'Stairs Floor 3', x: 0, y: 8.0, z: 10, type: 'stairs' },
    { id: 'room_301', name: 'Room 301 (F3)', x: 4, y: 8.0, z: 5, type: 'room' },
    { id: 'it301', name: 'IT-301 Lab', x: 0, y: 0.0, z: 0, type: 'room' },
    { id: 'it_corr', name: 'IT Corridor Start', x: 0, y: 0.0, z: 5, type: 'corridor' },
    { id: 'it302', name: 'IT-302 Lab', x: 4, y: 0.0, z: 5, type: 'room' },
    { id: 'stairs3', name: 'Stairs 3rd Floor', x: -5, y: 0.0, z: 15, type: 'stairs' },
    { id: 'cs_fac', name: 'CS Department Faculty', x: 2, y: 0.0, z: 15, type: 'room' },
    { id: 'entrance', name: 'Entrance', x: 0.03, y: 0.0, z: 0.01, type: 'room' },
    { id: 'exit', name: 'Exit', x: 2.76, y: 0.0, z: 0.90, type: 'room' },
    { id: 'bkt', name: 'Barkat', x: 0, y: 0.0, z: 0, type: 'room' },
    { id: 'rlx', name: 'ROLEX', x: 0, y: 0.0, z: -4, type: 'room' },
    { id: 'it_gate', name: 'IT Main Gate', x: 0.0, y: 0.0, z: 0.0, type: 'room' },
    { id: 'lift_1', name: 'The Lift', x: 0.0, y: 0.0, z: -12.5, type: 'corridor' },
    { id: 'it_lab_1', name: 'IT Lab 1', x: -2.0, y: 0.0, z: -12.5, type: 'room' },
    { id: 'it_main_gate_1', name: 'IT Main gate 1', x: 0.0, y: 0.0, z: 0.0, type: 'room' },
    { id: 'stairs_1_base', name: 'Stairs 1 base', x: -2.5, y: 0.0, z: -12.5, type: 'stairs' },
    { id: 'stairs_1_midway', name: 'Stairs 1 midway', x: -3.8, y: 2.0, z: -15.5, type: 'stairs' },
    { id: 'first_floor', name: '1st floor', x: 1.2, y: 3.8, z: -12.5, type: 'corridor' },
    { id: 'room_204', name: 'Room 204', x: 2.5, y: 3.8, z: -9.0, type: 'room' },
    { id: 'lab_4', name: 'Lab 4', x: -1.5, y: 3.8, z: -10.0, type: 'room' },
    { id: 'stairs_2_base', name: 'Stairs 2 base', x: 1.2, y: 3.8, z: -12.5, type: 'stairs' },
    { id: 'lab_8', name: 'Lab 8', x: -3.5, y: 6.0, z: -17.0, type: 'room' },
    { id: 'lab_9', name: 'Lab 9', x: -1.5, y: 6.0, z: -21.0, type: 'room' },
    { id: 'lab_10', name: 'Lab 10', x: 3.5, y: 6.0, z: -18.0, type: 'room' },
  ];
};

export const getAllEdges = () => {
  return [
    { id: 1, node1_id: 'room_101', node2_id: 'lobby_f1', distance: 3.6 },
    { id: 2, node1_id: 'lobby_f1', node2_id: 'stairs_f1', distance: 10.0 },
    { id: 3, node1_id: 'stairs_f1', node2_id: 'stairs_f2', distance: 5.6 },
    { id: 4, node1_id: 'stairs_f2', node2_id: 'lobby_f2', distance: 10.0 },
    { id: 5, node1_id: 'lobby_f2', node2_id: 'room_201', distance: 3.6 },
    { id: 6, node1_id: 'stairs_f2', node2_id: 'stairs_f3', distance: 5.6 },
    { id: 7, node1_id: 'stairs_f3', node2_id: 'room_301', distance: 6.4 },
    { id: 8, node1_id: 'it301', node2_id: 'it_corr', distance: 5.0 },
    { id: 9, node1_id: 'it_corr', node2_id: 'it302', distance: 4.0 },
    { id: 10, node1_id: 'it_corr', node2_id: 'stairs3', distance: 11.2 },
    { id: 11, node1_id: 'stairs3', node2_id: 'cs_fac', distance: 7.0 },
    { id: 12, node1_id: 'entrance', node2_id: 'exit', distance: 2.9 },
    { id: 13, node1_id: 'bkt', node2_id: 'rlx', distance: 3.0 },
    { id: 14, node1_id: 'it_gate', node2_id: 'lift_1', distance: 12.5 },
    { id: 15, node1_id: 'lift_1', node2_id: 'it_lab_1', distance: 6.5 },
    { id: 25, node1_id: 'it_gate', node2_id: 'it_main_gate_1', distance: 0.1 },
    { id: 26, node1_id: 'it_main_gate_1', node2_id: 'lift_1', distance: 12.5 },
    { id: 27, node1_id: 'stairs_1_base', node2_id: 'lift_1', distance: 0.5 },
    { id: 28, node1_id: 'stairs_1_base', node2_id: 'it_lab_1', distance: 6.5 },
    { id: 16, node1_id: 'it_main_gate_1', node2_id: 'stairs_1_base', distance: 12.32 },
    { id: 17, node1_id: 'stairs_1_base', node2_id: 'stairs_1_midway', distance: 5.67 },
    { id: 18, node1_id: 'stairs_1_midway', node2_id: 'first_floor', distance: 4.83 },
    { id: 19, node1_id: 'first_floor', node2_id: 'room_204', distance: 3.50 },
    { id: 20, node1_id: 'first_floor', node2_id: 'lab_4', distance: 2.73 },
    { id: 21, node1_id: 'first_floor', node2_id: 'stairs_2_base', distance: 0.75 },
    { id: 22, node1_id: 'stairs_2_base', node2_id: 'lab_8', distance: 7.72 },
    { id: 23, node1_id: 'lab_8', node2_id: 'lab_9', distance: 5.78 },
    { id: 24, node1_id: 'lab_8', node2_id: 'lab_10', distance: 11.69 },
  ];
};

// Web Mock
export const addNode = () => {};
export const addEdge = () => {};

export const saveUserProfile = (name, email, role) => {
  console.log("Mock Save User Profile on Web:", name, email, role);
  try {
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    
    const idx = users.findIndex(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (idx >= 0) {
      users[idx] = { name, email, role };
    } else {
      users.push({ name, email, role });
    }
    
    localStorage.setItem('web_users', JSON.stringify(users));
    localStorage.setItem('active_user_email', email);
  } catch (e) {}
};

export const getUniqueUserCount = () => {
  try {
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    return users.length;
  } catch (e) {
    return 0;
  }
};

export const getUserProfile = () => {
  try {
    const activeEmail = localStorage.getItem('active_user_email');
    if (!activeEmail) return null;
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    return users.find(u => u.email.trim().toLowerCase() === activeEmail.trim().toLowerCase()) || null;
  } catch (e) {
    return null;
  }
};

export const findProfileByEmail = (email) => {
  try {
    const usersData = localStorage.getItem('web_users');
    const users = usersData ? JSON.parse(usersData) : [];
    return users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase()) || null;
  } catch (e) {
    return null;
  }
};

export const addOCRLog = (imagePath, rawText, matchedName) => {
  try {
    const logs = JSON.parse(localStorage.getItem('ocr_logs') || '[]');
    logs.push({
      id: Date.now(),
      image_path: imagePath,
      raw_text: rawText || '',
      matched_name: matchedName || '',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('ocr_logs', JSON.stringify(logs));
  } catch (e) {}
};

export const getOCRLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('ocr_logs') || '[]').reverse();
  } catch (e) {
    return [];
  }
};

export const clearOCRLogs = () => {
  try {
    localStorage.removeItem('ocr_logs');
  } catch (e) {}
};

export const getActiveUserEmail = () => {
  const profile = getUserProfile();
  return profile ? profile.email : 'guest';
};

// ── Favorites / Bookmarks Mock ─────────────────────────────────────────────
export const getFavorites = () => {
  try {
    const email = getActiveUserEmail();
    const favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    const all = getAllNodes();
    return all.filter(n => favs.includes(n.id));
  } catch (e) {
    return [];
  }
};

export const addFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    const favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    if (!favs.includes(nodeId)) {
      favs.push(nodeId);
      localStorage.setItem('user_favorites_' + email, JSON.stringify(favs));
    }
  } catch (e) {}
};

export const removeFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    let favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    favs = favs.filter(id => id !== nodeId);
    localStorage.setItem('user_favorites_' + email, JSON.stringify(favs));
  } catch (e) {}
};

export const isFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    const favs = JSON.parse(localStorage.getItem('user_favorites_' + email) || '[]');
    return favs.includes(nodeId);
  } catch (e) {
    return false;
  }
};

// ── Navigation Metrics Mock ────────────────────────────────────────────────
export const addNavigationMetric = (distance, startName, endName) => {
  try {
    const email = getActiveUserEmail();
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]');
    metrics.push({
      distance,
      timestamp: new Date().toISOString(),
      start_name: startName || null,
      end_name: endName || null
    });
    localStorage.setItem('navigation_metrics_' + email, JSON.stringify(metrics));
  } catch (e) {}
};

export const getRecentTracks = () => {
  try {
    const email = getActiveUserEmail();
    return JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]').reverse().slice(0, 10);
  } catch (e) {
    return [];
  }
};

export const clearRecentTracks = () => {
  try {
    const email = getActiveUserEmail();
    localStorage.removeItem('navigation_metrics_' + email);
  } catch (e) {}
};

export const getLifetimeMetrics = () => {
  try {
    const email = getActiveUserEmail();
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]');
    const totalDist = metrics.reduce((sum, m) => sum + m.distance, 0);
    const totalRuns = metrics.length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDist = metrics
      .filter(m => m.timestamp.startsWith(todayStr))
      .reduce((sum, m) => sum + m.distance, 0);

    return {
      totalDistance: parseFloat(totalDist.toFixed(1)),
      totalRuns,
      todayDistance: parseFloat(todayDist.toFixed(1))
    };
  } catch (e) {
    return { totalDistance: 0, totalRuns: 0, todayDistance: 0 };
  }
};

export const getWeeklyMetrics = () => {
  const list = [];
  try {
    const email = getActiveUserEmail();
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics_' + email) || '[]');
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const total = metrics
        .filter(m => m.timestamp.startsWith(dateStr))
        .reduce((sum, m) => sum + m.distance, 0);
        
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      list.push({
        day: dayName,
        date: dateStr,
        distance: parseFloat(total.toFixed(1))
      });
    }
  } catch (e) {}
  return list;
};

export const deleteUserProfile = () => {
  try {
    localStorage.removeItem('active_user_email');
  } catch (e) {}
};

export const clearAllFavorites = () => {
  try {
    const email = getActiveUserEmail();
    localStorage.removeItem('user_favorites_' + email);
  } catch (e) {}
};

