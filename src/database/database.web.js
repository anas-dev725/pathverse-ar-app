// Web mock for SQLite Database. Allows Web Preview in IDE without Native module crashing.
export const initDB = () => {
    console.log("Mock SQLite Init on Web");
};
export const seedDummyData = () => {};

export const getAllNodes = () => {
  return [
    { id: 'n1', name: 'IT-301 Lab', x: 0, y: 0, z: 0, type: 'room' },
    { id: 'n2', name: 'IT Corridor Start', x: 0, y: 0, z: 5, type: 'corridor' },
    { id: 'n3', name: 'IT-302 Lab', x: 4, y: 0, z: 5, type: 'room' },
    { id: 'n4', name: 'Stairs 3rd Floor', x: -5, y: 0, z: 15, type: 'stairs' },
    { id: 'n5', name: 'CS Department Faculty', x: 2, y: 0, z: 15, type: 'room' },
  ];
};

export const getAllEdges = () => {
  return [];
};

// Web Mock
export const addNode = () => {};
export const addEdge = () => {};

export const saveUserProfile = (name, email, role) => {
  console.log("Mock Save User Profile on Web:", name, email, role);
  try {
    localStorage.setItem('user_profile', JSON.stringify({ name, email, role }));
  } catch (e) {}
};

export const getUserProfile = () => {
  try {
    const data = localStorage.getItem('user_profile');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

// ── Favorites / Bookmarks Mock ─────────────────────────────────────────────
export const getFavorites = () => {
  try {
    const favs = JSON.parse(localStorage.getItem('user_favorites') || '[]');
    const all = getAllNodes();
    return all.filter(n => favs.includes(n.id));
  } catch (e) {
    return [];
  }
};

export const addFavorite = (nodeId) => {
  try {
    const favs = JSON.parse(localStorage.getItem('user_favorites') || '[]');
    if (!favs.includes(nodeId)) {
      favs.push(nodeId);
      localStorage.setItem('user_favorites', JSON.stringify(favs));
    }
  } catch (e) {}
};

export const removeFavorite = (nodeId) => {
  try {
    let favs = JSON.parse(localStorage.getItem('user_favorites') || '[]');
    favs = favs.filter(id => id !== nodeId);
    localStorage.setItem('user_favorites', JSON.stringify(favs));
  } catch (e) {}
};

export const isFavorite = (nodeId) => {
  try {
    const favs = JSON.parse(localStorage.getItem('user_favorites') || '[]');
    return favs.includes(nodeId);
  } catch (e) {
    return false;
  }
};

// ── Navigation Metrics Mock ────────────────────────────────────────────────
export const addNavigationMetric = (distance, startName, endName) => {
  try {
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics') || '[]');
    metrics.push({
      distance,
      timestamp: new Date().toISOString(),
      start_name: startName || null,
      end_name: endName || null
    });
    localStorage.setItem('navigation_metrics', JSON.stringify(metrics));
  } catch (e) {}
};

export const getRecentTracks = () => {
  try {
    return JSON.parse(localStorage.getItem('navigation_metrics') || '[]').reverse().slice(0, 10);
  } catch (e) {
    return [];
  }
};

export const clearRecentTracks = () => {
  try {
    localStorage.removeItem('navigation_metrics');
  } catch (e) {}
};

export const getLifetimeMetrics = () => {
  try {
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics') || '[]');
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
    const metrics = JSON.parse(localStorage.getItem('navigation_metrics') || '[]');
    
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
