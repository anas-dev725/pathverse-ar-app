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
  `);
};

export const seedDummyData = () => {
  // ── Using INSERT OR IGNORE so:
  //   1. Existing live-mapped nodes are NEVER overwritten.
  //   2. Any NEW entry added to these arrays is auto-inserted on next launch.
  // ─────────────────────────────────────────────────────────────────────────

  const nodes = [
    // ── IT Floor Nodes ─────────────────────────────────────
    { id: 'it301', name: 'IT-301 Lab', x: 0, y: 0, z: 0, type: 'room' },
    { id: 'it_corr', name: 'IT Corridor Start', x: 0, y: 5, z: 0, type: 'corridor' },
    { id: 'it302', name: 'IT-302 Lab', x: 4, y: 5, z: 0, type: 'room' },
    { id: 'stairs3', name: 'Stairs 3rd Floor', x: -5, y: 15, z: 0, type: 'stairs' },
    { id: 'cs_fac', name: 'CS Department Faculty', x: 2, y: 15, z: 0, type: 'room' },

    // ── Entrance / Exit Nodes (home test) ──────────────────
    { id: 'entrance', name: 'Entrance', x: 0.03, y: 0.01, z: 0.01, type: 'room' },
    { id: 'exit', name: 'Exit', x: 2.76, y: 0.01, z: 0.90, type: 'room' },

    // ── Additional Test Nodes ──────────────────────────────
    { id: 'bkt', name: 'Barkat', x: 0, y: 0, z: 0, type: 'room' },
    { id: 'rlx', name: 'ROLEX', x: 0, y: 0, z: -4, type: 'room' },

    // ── EVALUATOR DEMO PATH ─────────────────────────────────
    { id: 'it_gate', name: 'IT Main Gate', x: 0, y: 0, z: 0, type: 'room' },
    { id: 'lift_1', name: 'The Lift', x: 0, y: 0, z: -12.5, type: 'corridor' },
    { id: 'it_lab_1', name: 'IT Lab 1', x: -6.5, y: 0, z: -12.5, type: 'room' },

    // { id: 'lab_cs1',  name: 'CS Lab 1',               x: 6, y: 15, z: 0, type: 'room' },
  ];

  for (const node of nodes) {
    db.runSync(
      `INSERT OR IGNORE INTO LocationNodes (id, name, x, y, z, type) VALUES (?, ?, ?, ?, ?, ?)`,
      [node.id, node.name, node.x, node.y, node.z, node.type]
    );
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  const edges = [
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

    // ── ADD NEW EDGES HERE ─────────────────────────────────
    // { a: 'cs_fac', b: 'lab_cs1', d: 5.0 },
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

