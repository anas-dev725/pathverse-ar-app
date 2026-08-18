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
      timestamp  TEXT,
      user_email TEXT
    );
    CREATE TABLE IF NOT EXISTS UserProfile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      role TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS Favorites (
      node_id TEXT,
      user_email TEXT,
      PRIMARY KEY (node_id, user_email),
      FOREIGN KEY(node_id) REFERENCES LocationNodes(id)
    );
    CREATE TABLE IF NOT EXISTS NavigationMetrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distance REAL,
      timestamp TEXT,
      start_name TEXT,
      end_name TEXT,
      user_email TEXT
    );
  `);

  try {
    db.execSync(`ALTER TABLE LocationNodes ADD COLUMN image_uri TEXT`);
  } catch (e) {
    // Column already exists or database is clean
  }

  try {
    db.execSync(`ALTER TABLE UserProfile ADD COLUMN role TEXT`);
  } catch (e) {
    // Column already exists or database is clean
  }

  try {
    db.execSync(`ALTER TABLE UserProfile ADD COLUMN is_active INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists or database is clean
  }

  // Schema Migrations for existing user databases
  try {
    const cols = db.getAllSync("PRAGMA table_info(Favorites)");
    const hasEmail = cols.some(c => c.name === 'user_email');
    if (!hasEmail) {
      db.execSync(`ALTER TABLE Favorites RENAME TO Favorites_old`);
      db.execSync(`
        CREATE TABLE Favorites (
          node_id TEXT,
          user_email TEXT,
          PRIMARY KEY (node_id, user_email),
          FOREIGN KEY(node_id) REFERENCES LocationNodes(id)
        )
      `);
      db.execSync(`INSERT INTO Favorites (node_id, user_email) SELECT node_id, 'guest' FROM Favorites_old`);
      db.execSync(`DROP TABLE Favorites_old`);
    }
  } catch (e) {
    console.error("Migration error for Favorites table:", e);
  }

  try {
    const cols = db.getAllSync("PRAGMA table_info(OCRLog)");
    const hasEmail = cols.some(c => c.name === 'user_email');
    if (!hasEmail) {
      db.execSync(`ALTER TABLE OCRLog ADD COLUMN user_email TEXT`);
    }
  } catch (e) {}

  try {
    const cols = db.getAllSync("PRAGMA table_info(NavigationMetrics)");
    const hasEmail = cols.some(c => c.name === 'user_email');
    if (!hasEmail) {
      db.execSync(`ALTER TABLE NavigationMetrics ADD COLUMN user_email TEXT`);
    }
  } catch (e) {}

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
    // Delete any old custom nodes that match our new seeded ones to prevent duplicates
    db.runSync("DELETE FROM LocationNodes WHERE name IN ('IT Main gate 1', 'Stairs 1 base', 'Stairs 1 midway', '1st floor', 'Room 204', 'Lab 4', 'Stairs 2 base', 'Lab 8', 'Lab 9', 'Lab 10')");
    db.runSync("DELETE FROM Edges WHERE node1_id NOT LIKE 'loc_%' AND node2_id NOT LIKE 'loc_%'");
    db.runSync("DELETE FROM LocationNodes WHERE id NOT LIKE 'loc_%'");
    // Clean up any orphaned edges referencing deleted node IDs
    db.runSync("DELETE FROM Edges WHERE node1_id NOT IN (SELECT id FROM LocationNodes) OR node2_id NOT IN (SELECT id FROM LocationNodes)");
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
    { id: 'it_gate', name: 'IT Main Gate', x: 0.0, y: 0.0, z: 0.0, type: 'room' },
    { id: 'lift_1', name: 'The Lift', x: 0.0, y: 0.0, z: -12.5, type: 'corridor' },
    { id: 'it_lab_1', name: 'IT Lab 1', x: 3.0, y: 0.0, z: -12.5, type: 'room' },

    // ── REAL UNIVERSITY DEMO PATH (PHYSICAL CORRIDOR & LEFT RED-HANDRAIL STAIRCASE) ──
    { id: 'it_main_gate_1', name: 'IT Main gate 1', x: 0.0, y: 0.0, z: 0.0, type: 'room' },
    { id: 'stairs_1_base', name: 'Stairs 1 base', x: -2.5, y: 0.0, z: -12.5, type: 'stairs' },
    { id: 'stairs_1_midway', name: 'Stairs 1 midway', x: -3.8, y: 2.0, z: -15.5, type: 'stairs' },
    { id: 'first_floor', name: '1st floor', x: -2.5, y: 3.8, z: -12.5, type: 'corridor' },
    { id: 'room_204', name: 'Room 204', x: 0.0, y: 3.8, z: -9.0, type: 'room' },
    { id: 'lab_4', name: 'Lab 4', x: -4.5, y: 3.8, z: -10.0, type: 'room' },
    { id: 'stairs_2_base', name: 'Stairs 2 base', x: -2.5, y: 3.8, z: -12.5, type: 'stairs' },
    { id: 'lab_8', name: 'Lab 8', x: -4.5, y: 6.0, z: -17.0, type: 'room' },
    { id: 'lab_9', name: 'Lab 9', x: -1.5, y: 6.0, z: -21.0, type: 'room' },
    { id: 'lab_10', name: 'Lab 10', x: 3.5, y: 6.0, z: -18.0, type: 'room' },
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

    // Evaluator Demo path & Interconnected Ground Floor Network
    { a: 'it_gate', b: 'lift_1', d: 12.5 },
    { a: 'lift_1', b: 'it_lab_1', d: 6.5 },
    { a: 'it_gate', b: 'it_main_gate_1', d: 0.1 },
    { a: 'it_main_gate_1', b: 'lift_1', d: 12.5 },
    { a: 'stairs_1_base', b: 'lift_1', d: 0.5 },
    { a: 'stairs_1_base', b: 'it_lab_1', d: 6.5 },

    // pre-seeded connected path for User Screenshot
    { a: 'it_main_gate_1', b: 'stairs_1_base', d: 12.32 },
    { a: 'stairs_1_base', b: 'stairs_1_midway', d: 5.67 },
    { a: 'stairs_1_midway', b: 'first_floor', d: 4.83 },
    { a: 'first_floor', b: 'room_204', d: 3.50 },
    { a: 'first_floor', b: 'lab_4', d: 2.73 },
    { a: 'first_floor', b: 'stairs_2_base', d: 0.75 },
    { a: 'stairs_2_base', b: 'lab_8', d: 7.72 },
    { a: 'lab_8', b: 'lab_9', d: 5.78 },
    { a: 'lab_8', b: 'lab_10', d: 11.69 },
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

export const addNode = (id, name, x, y, z, type, image_uri = null) => {
  db.runSync(
    `INSERT INTO LocationNodes (id, name, x, y, z, type, image_uri) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name, x, y, z, type, image_uri]
  );
};

export const deleteNode = (id) => {
  try {
    db.runSync(`DELETE FROM Edges WHERE node1_id = ? OR node2_id = ?`, [id, id]);
    db.runSync(`DELETE FROM Favorites WHERE node_id = ?`, [id]);
    db.runSync(`DELETE FROM LocationNodes WHERE id = ?`, [id]);
  } catch (e) {
    console.error("Error deleting node:", e);
  }
};

export const addEdge = (node1_id, node2_id, distance) => {
  db.runSync(
    `INSERT INTO Edges (node1_id, node2_id, distance) VALUES (?, ?, ?)`,
    [node1_id, node2_id, distance]
  );
};

export const deleteEdge = (id) => {
  try {
    db.runSync(`DELETE FROM Edges WHERE id = ?`, [id]);
  } catch (e) {
    console.error("Error deleting edge:", e);
  }
};

export const addOCRLog = (imagePath, rawText, matchedName) => {
  const email = getActiveUserEmail();
  const ts = new Date().toISOString();
  db.runSync(
    `INSERT INTO OCRLog (image_path, raw_text, matched_name, timestamp, user_email) VALUES (?, ?, ?, ?, ?)`,
    [imagePath, rawText || '', matchedName || '', ts, email]
  );
};

export const getOCRLogs = () => {
  try {
    return db.getAllSync('SELECT * FROM OCRLog ORDER BY id DESC');
  } catch (e) {
    return [];
  }
};

export const clearOCRLogs = () => {
  try {
    db.runSync('DELETE FROM OCRLog');
  } catch (e) {
    console.error("Error clearing OCR logs:", e);
  }
};

export const saveUserProfile = (name, email, role) => {
  const ts = new Date().toISOString();
  try {
    // Set all profiles to inactive
    db.runSync(`UPDATE UserProfile SET is_active = 0`);
    
    // Check if profile already exists
    const existing = db.getAllSync(`SELECT * FROM UserProfile WHERE email = ?`, [email]);
    if (existing.length > 0) {
      db.runSync(
        `UPDATE UserProfile SET name = ?, role = ?, is_active = 1 WHERE email = ?`,
        [name, role || 'student', email]
      );
    } else {
      db.runSync(
        `INSERT INTO UserProfile (name, email, role, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
        [name, email, role || 'student', ts]
      );
    }
  } catch (e) {
    console.error("Error saving user profile:", e);
  }
};

export const getUniqueUserCount = () => {
  try {
    const row = db.getAllSync('SELECT COUNT(DISTINCT email) as count FROM UserProfile');
    return row.length > 0 ? row[0].count : 0;
  } catch (e) {
    return 0;
  }
};

export const getUserProfile = () => {
  try {
    const profiles = db.getAllSync('SELECT * FROM UserProfile WHERE is_active = 1 ORDER BY id DESC LIMIT 1');
    return profiles.length > 0 ? profiles[0] : null;
  } catch (e) {
    return null;
  }
};

export const findProfileByEmail = (email) => {
  try {
    const profiles = db.getAllSync('SELECT * FROM UserProfile WHERE email = ? ORDER BY id DESC LIMIT 1', [email]);
    return profiles.length > 0 ? profiles[0] : null;
  } catch (e) {
    return null;
  }
};

export const getActiveUserEmail = () => {
  const profile = getUserProfile();
  return profile ? profile.email : 'guest';
};

// ── Favorites / Bookmarks ──────────────────────────────────────────────────
export const getFavorites = () => {
  try {
    const email = getActiveUserEmail();
    return db.getAllSync(`
      SELECT n.* FROM LocationNodes n
      INNER JOIN Favorites f ON n.id = f.node_id
      WHERE f.user_email = ?
      ORDER BY n.name ASC
    `, [email]);
  } catch (e) {
    console.error("Error fetching favorites:", e);
    return [];
  }
};

export const addFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    db.runSync(`INSERT OR IGNORE INTO Favorites (node_id, user_email) VALUES (?, ?)`, [nodeId, email]);
  } catch (e) {
    console.error("Error adding favorite:", e);
  }
};

export const removeFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    db.runSync(`DELETE FROM Favorites WHERE node_id = ? AND user_email = ?`, [nodeId, email]);
  } catch (e) {
    console.error("Error removing favorite:", e);
  }
};

export const isFavorite = (nodeId) => {
  try {
    const email = getActiveUserEmail();
    const row = db.getAllSync(`SELECT 1 FROM Favorites WHERE node_id = ? AND user_email = ? LIMIT 1`, [nodeId, email]);
    return row.length > 0;
  } catch (e) {
    return false;
  }
};

// ── Navigation Metrics ──────────────────────────────────────────────────────
export const addNavigationMetric = (distance, startName, endName) => {
  try {
    const email = getActiveUserEmail();
    const ts = new Date().toISOString();
    db.runSync(
      'INSERT INTO NavigationMetrics (distance, timestamp, start_name, end_name, user_email) VALUES (?, ?, ?, ?, ?)',
      [distance, ts, startName || null, endName || null, email]
    );
  } catch (e) {
    console.error("Error adding navigation metric:", e);
  }
};

export const getRecentTracks = () => {
  try {
    const email = getActiveUserEmail();
    return db.getAllSync('SELECT * FROM NavigationMetrics WHERE user_email = ? ORDER BY id DESC LIMIT 10', [email]);
  } catch (e) {
    console.error("Error fetching recent tracks:", e);
    return [];
  }
};

export const clearRecentTracks = () => {
  try {
    const email = getActiveUserEmail();
    db.runSync('DELETE FROM NavigationMetrics WHERE user_email = ?', [email]);
  } catch (e) {
    console.error("Error clearing recent tracks:", e);
  }
};

export const getLifetimeMetrics = () => {
  try {
    const email = getActiveUserEmail();
    const distRows = db.getAllSync('SELECT SUM(distance) as total FROM NavigationMetrics WHERE user_email = ?', [email]);
    const totalDist = (distRows.length > 0 && distRows[0].total) ? parseFloat(distRows[0].total) : 0;

    const countRows = db.getAllSync('SELECT COUNT(*) as cnt FROM NavigationMetrics WHERE user_email = ?', [email]);
    const totalRuns = (countRows.length > 0 && countRows[0].cnt) ? parseInt(countRows[0].cnt) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRows = db.getAllSync(
      'SELECT SUM(distance) as total FROM NavigationMetrics WHERE user_email = ? AND timestamp LIKE ?',
      [email, `${todayStr}%`]
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
    const email = getActiveUserEmail();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const rows = db.getAllSync(
        `SELECT SUM(distance) as total FROM NavigationMetrics WHERE user_email = ? AND timestamp LIKE ?`,
        [email, `${dateStr}%`]
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

export const deleteUserProfile = () => {
  try {
    db.runSync('UPDATE UserProfile SET is_active = 0');
  } catch (e) {
    console.error("Error setting user profile to inactive:", e);
  }
};

export const clearAllFavorites = () => {
  try {
    db.runSync('DELETE FROM Favorites');
  } catch (e) {
    console.error("Error clearing favorites:", e);
  }
};


