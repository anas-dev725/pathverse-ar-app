import * as SQLite from 'expo-sqlite';

// Next.js SQLite sync API from expo-sqlite v14+
export const db = SQLite.openDatabaseSync('pathverse_ar.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS LocationNodes (
      id TEXT PRIMARY KEY,
      name TEXT,
      x REAL,
      y REAL,
      z REAL,
      type TEXT
    );
    CREATE TABLE IF NOT EXISTS Edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node1_id TEXT,
      node2_id TEXT,
      distance REAL,
      FOREIGN KEY(node1_id) REFERENCES LocationNodes(id),
      FOREIGN KEY(node2_id) REFERENCES LocationNodes(id)
    );
    CREATE TABLE IF NOT EXISTS OCRLog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT,
      raw_text   TEXT,
      matched_name TEXT,
      timestamp  TEXT
    );
    CREATE TABLE IF NOT EXISTS UserProfile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      role TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS Favorites (
      node_id TEXT PRIMARY KEY,
      FOREIGN KEY(node_id) REFERENCES LocationNodes(id)
    );
    CREATE TABLE IF NOT EXISTS NavigationMetrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distance REAL,
      timestamp TEXT,
      start_name TEXT,
      end_name TEXT
    );
  `);

  try {
    db.execSync(`ALTER TABLE UserProfile ADD COLUMN role TEXT`);
  } catch (e) {
    // Column already exists or database is clean
  }

  try {
    const cols = db.getAllSync("PRAGMA table_info(NavigationMetrics)");
    const hasStart = cols.some(c => c.name === 'start_name');
    if (!hasStart) {
      db.execSync(`
        ALTER TABLE NavigationMetrics ADD COLUMN start_name TEXT;
        ALTER TABLE NavigationMetrics ADD COLUMN end_name TEXT;
      `);
    }
  } catch (e) {
    console.error("Migration error for NavigationMetrics:", e);
  }
};

export const seedDummyData = () => {
  // Clear old seed nodes first so we overwrite with standardized 3D coordinates,
  // but protect user custom mapped landmarks (IDs starting with 'loc_')
  try {
    db.runSync("DELETE FROM LocationNodes WHERE id NOT LIKE 'loc_%'");
    db.runSync("DELETE FROM Edges WHERE node1_id NOT LIKE 'loc_%' AND node2_id NOT LIKE 'loc_%'");
  } catch (e) {
    console.error("Error clearing old seed nodes:", e);
  }

  const nodes = [
    // ── Floor 1 Nodes (y = 0.0) ────────────────────────────
    { id: 'lobby_f1', name: 'Lobby Floor 1', x: 0, y: 0.0, z: 0, type: 'corridor' },
    { id: 'room_101', name: 'Room 101 (F1)', x: 3, y: 0.0, z: 2, type: 'room' },
    { id: 'stairs_f1', name: 'Stairs Floor 1', x: 0, y: 0.0, z: 10, type: 'stairs' },

    // ── Floor 2 Nodes (y = 4.0) ────────────────────────────
    { id: 'stairs_f2', name: 'Stairs Floor 2', x: 0, y: 4.0, z: 10, type: 'stairs' },
    { id: 'lobby_f2', name: 'Lobby Floor 2', x: 0, y: 4.0, z: 0, type: 'corridor' },
    { id: 'room_201', name: 'Room 201 (F2)', x: -3, y: 4.0, z: -2, type: 'room' },

    // ── Floor 3 Nodes (y = 8.0) ────────────────────────────
    { id: 'stairs_f3', name: 'Stairs Floor 3', x: 0, y: 8.0, z: 10, type: 'stairs' },
    { id: 'room_301', name: 'Room 301 (F3)', x: 4, y: 8.0, z: 5, type: 'room' },

    // ── Original IT Floor Nodes (Converted to standardized 3D coordinates, y = 0.0) ──
    { id: 'it301', name: 'IT-301 Lab', x: 0, y: 0.0, z: 0, type: 'room' },
    { id: 'it_corr', name: 'IT Corridor Start', x: 0, y: 0.0, z: 5, type: 'corridor' },
    { id: 'it302', name: 'IT-302 Lab', x: 4, y: 0.0, z: 5, type: 'room' },
    { id: 'stairs3', name: 'Stairs 3rd Floor', x: -5, y: 0.0, z: 15, type: 'stairs' },
    { id: 'cs_fac', name: 'CS Department Faculty', x: 2, y: 0.0, z: 15, type: 'room' },

    // ── Entrance / Exit Nodes (home test) ──
    { id: 'entrance', name: 'Entrance', x: 0.03, y: 0.0, z: 0.01, type: 'room' },
    { id: 'exit', name: 'Exit', x: 2.76, y: 0.0, z: 0.90, type: 'room' },

    // ── Additional Test Nodes ──
    { id: 'bkt', name: 'Barkat', x: 0, y: 0.0, z: 0, type: 'room' },
    { id: 'rlx', name: 'ROLEX', x: 0, y: 0.0, z: -4, type: 'room' },

    // ── EVALUATOR DEMO PATH ──
    { id: 'it_gate', name: 'IT Main Gate', x: 0, y: 0.0, z: 0, type: 'room' },
    { id: 'lift_1', name: 'The Lift', x: 0, y: 0.0, z: -12.5, type: 'corridor' },
    { id: 'it_lab_1', name: 'IT Lab 1', x: -6.5, y: 0.0, z: -12.5, type: 'room' },
  ];

  for (const node of nodes) {
    db.runSync(
      `INSERT OR IGNORE INTO LocationNodes (id, name, x, y, z, type) VALUES (?, ?, ?, ?, ?, ?)`,
      [node.id, node.name, node.x, node.y, node.z, node.type]
    );
  }

  // ── Edges ──
  const edges = [
    // Multi-floor paths
    { a: 'room_101', b: 'lobby_f1', d: 3.6 },
    { a: 'lobby_f1', b: 'stairs_f1', d: 10.0 },
    { a: 'stairs_f1', b: 'stairs_f2', d: 5.6 }, // includes 4m height change
    { a: 'stairs_f2', b: 'lobby_f2', d: 10.0 },
    { a: 'lobby_f2', b: 'room_201', d: 3.6 },
    { a: 'stairs_f2', b: 'stairs_f3', d: 5.6 }, // includes 4m height change
    { a: 'stairs_f3', b: 'room_301', d: 6.4 },

    // IT Floor path
    { a: 'it301', b: 'it_corr', d: 5.0 },
    { a: 'it_corr', b: 'it302', d: 4.0 },
    { a: 'it_corr', b: 'stairs3', d: 11.2 },
    { a: 'stairs3', b: 'cs_fac', d: 7.0 },

    // Home test
    { a: 'entrance', b: 'exit', d: 2.9 },

    // Additional test
    { a: 'bkt', b: 'rlx', d: 3.0 },

    // Evaluator Demo path
    { a: 'it_gate', b: 'lift_1', d: 12.5 },
    { a: 'lift_1', b: 'it_lab_1', d: 6.5 },
  ];

  for (const edge of edges) {
    db.runSync(
      `INSERT OR IGNORE INTO Edges (node1_id, node2_id, distance) VALUES (?, ?, ?)`,
      [edge.a, edge.b, edge.d]
    );
  }
};

export const getAllNodes = () => {
  return db.getAllSync('SELECT * FROM LocationNodes');
};

export const getAllEdges = () => {
  return db.getAllSync('SELECT * FROM Edges');
};

export const addNode = (id, name, x, y, z, type) => {
  db.runSync(
    `INSERT INTO LocationNodes (id, name, x, y, z, type) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, x, y, z, type]
  );
};

export const addEdge = (node1_id, node2_id, distance) => {
  db.runSync(
    `INSERT INTO Edges (node1_id, node2_id, distance) VALUES (?, ?, ?)`,
    [node1_id, node2_id, distance]
  );
};

// ── OCR Audit Log ──────────────────────────────────────────────────────────
export const addOCRLog = (imagePath, rawText, matchedName) => {
  const ts = new Date().toISOString();
  db.runSync(
    `INSERT INTO OCRLog (image_path, raw_text, matched_name, timestamp) VALUES (?, ?, ?, ?)`,
    [imagePath, rawText || '', matchedName || '', ts]
  );
};

export const getOCRLogs = () =>
  db.getAllSync('SELECT * FROM OCRLog ORDER BY id DESC');

export const clearOCRLogs = () =>
  db.execSync('DELETE FROM OCRLog');

export const saveUserProfile = (name, email, role) => {
  const ts = new Date().toISOString();
  db.runSync(
    `INSERT INTO UserProfile (name, email, role, created_at) VALUES (?, ?, ?, ?)`,
    [name, email, role || 'student', ts]
  );
};

export const getUserProfile = () => {
  try {
    const profiles = db.getAllSync('SELECT * FROM UserProfile ORDER BY id DESC LIMIT 1');
    return profiles.length > 0 ? profiles[0] : null;
  } catch (e) {
    return null;
  }
};

// ── Favorites / Bookmarks ──────────────────────────────────────────────────
export const getFavorites = () => {
  try {
    return db.getAllSync(`
      SELECT n.* FROM LocationNodes n
      INNER JOIN Favorites f ON n.id = f.node_id
      ORDER BY n.name ASC
    `);
  } catch (e) {
    console.error("Error fetching favorites:", e);
    return [];
  }
};

export const addFavorite = (nodeId) => {
  try {
    db.runSync(`INSERT OR IGNORE INTO Favorites (node_id) VALUES (?)`, [nodeId]);
  } catch (e) {
    console.error("Error adding favorite:", e);
  }
};

export const removeFavorite = (nodeId) => {
  try {
    db.runSync(`DELETE FROM Favorites WHERE node_id = ?`, [nodeId]);
  } catch (e) {
    console.error("Error removing favorite:", e);
  }
};

export const isFavorite = (nodeId) => {
  try {
    const row = db.getAllSync(`SELECT 1 FROM Favorites WHERE node_id = ? LIMIT 1`, [nodeId]);
    return row.length > 0;
  } catch (e) {
    return false;
  }
};

// ── Navigation Metrics ──────────────────────────────────────────────────────
export const addNavigationMetric = (distance, startName, endName) => {
  try {
    const ts = new Date().toISOString();
    db.runSync(
      'INSERT INTO NavigationMetrics (distance, timestamp, start_name, end_name) VALUES (?, ?, ?, ?)',
      [distance, ts, startName || null, endName || null]
    );
  } catch (e) {
    console.error("Error adding navigation metric:", e);
  }
};

export const getRecentTracks = () => {
  try {
    return db.getAllSync('SELECT * FROM NavigationMetrics ORDER BY id DESC LIMIT 10');
  } catch (e) {
    console.error("Error fetching recent tracks:", e);
    return [];
  }
};

export const clearRecentTracks = () => {
  try {
    db.runSync('DELETE FROM NavigationMetrics');
  } catch (e) {
    console.error("Error clearing recent tracks:", e);
  }
};

export const getLifetimeMetrics = () => {
  try {
    const distRows = db.getAllSync('SELECT SUM(distance) as total FROM NavigationMetrics');
    const totalDist = (distRows.length > 0 && distRows[0].total) ? parseFloat(distRows[0].total) : 0;

    const countRows = db.getAllSync('SELECT COUNT(*) as cnt FROM NavigationMetrics');
    const totalRuns = (countRows.length > 0 && countRows[0].cnt) ? parseInt(countRows[0].cnt) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRows = db.getAllSync(
      'SELECT SUM(distance) as total FROM NavigationMetrics WHERE timestamp LIKE ?',
      [`${todayStr}%`]
    );
    const todayDist = (todayRows.length > 0 && todayRows[0].total) ? parseFloat(todayRows[0].total) : 0;

    return {
      totalDistance: parseFloat(totalDist.toFixed(1)),
      totalRuns,
      todayDistance: parseFloat(todayDist.toFixed(1))
    };
  } catch (e) {
    console.error("Error fetching lifetime metrics:", e);
    return { totalDistance: 0, totalRuns: 0, todayDistance: 0 };
  }
};

export const getWeeklyMetrics = () => {
  const list = [];
  try {
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const rows = db.getAllSync(
        `SELECT SUM(distance) as total FROM NavigationMetrics WHERE timestamp LIKE ?`,
        [`${dateStr}%`]
      );
      const total = (rows.length > 0 && rows[0].total) ? parseFloat(rows[0].total) : 0;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

      list.push({
        day: dayName,
        date: dateStr,
        distance: parseFloat(total.toFixed(1))
      });
    }
  } catch (e) {
    console.error("Error fetching weekly metrics:", e);
  }
  return list;
};

