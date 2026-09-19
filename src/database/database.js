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
  try {
    // Clear old seed nodes and edges to load complete 102-node university graph
    db.runSync("DELETE FROM Edges");
    db.runSync("DELETE FROM LocationNodes");
  } catch (e) {
    console.error("Error clearing old seed nodes:", e);
  }

  const nodes = [
    { id: 'loc_1776498824903', name: "Lab 6", x: 0.02, y: 0, z: -0.01, type: 'room' },
    { id: 'loc_1783705338091', name: "2nd floor main gate", x: 0.23, y: 0.08, z: -0.23, type: 'corridor' },
    { id: 'loc_1783705414239', name: "2nd floor", x: 0.04, y: 0.03, z: 0.02, type: 'room' },
    { id: 'loc_1783705445555', name: "3rd floor stairs base", x: -0.68, y: 0.02, z: -4.44, type: 'corridor' },
    { id: 'loc_1783705474966', name: "3rd floor stairs one midway", x: -4.02, y: 1.09, z: -4.57, type: 'stairs' },
    { id: 'loc_1783705505137', name: "3rd floor second midway", x: -3.8, y: 1.97, z: -1.19, type: 'stairs' },
    { id: 'loc_1783705529988', name: "3rd floor stairs landing", x: -0.95, y: 2.98, z: -1.02, type: 'corridor' },
    { id: 'loc_1783705554117', name: "314", x: -0.3, y: 2.98, z: 6.01, type: 'room' },
    { id: 'loc_1783772308590', name: "California basement", x: 0.03, y: 0.01, z: 0, type: 'room' },
    { id: 'loc_1783772346535', name: "Stairs basement", x: 0.27, y: 0.16, z: -9.48, type: 'room' },
    { id: 'loc_1783772367978', name: "Stairs mid", x: -0.32, y: 1.11, z: -12.39, type: 'room' },
    { id: 'loc_1783772390844', name: "California 1st floor", x: 2.93, y: 3.27, z: -15.06, type: 'room' },
    { id: 'loc_1785552490566', name: "Uni main gate", x: 0.03, y: 0.01, z: 0, type: 'corridor' },
    { id: 'loc_1785552600163', name: "It building", x: 30.35, y: -0.19, z: -135.73, type: 'corridor' },
    { id: 'loc_1785552662392', name: "Ssk building", x: 87.38, y: 0.13, z: -144.43, type: 'corridor' },
    { id: 'loc_1786042634820', name: "216", x: 0.01, y: 0.03, z: 0.05, type: 'room' },
    { id: 'loc_1786042684611', name: "2nd floor stairs base", x: 1.47, y: 0.05, z: -16.93, type: 'corridor' },
    { id: 'loc_1786042711629', name: "2nd floor stairs mid", x: -2.77, y: 1.22, z: -16.66, type: 'stairs' },
    { id: 'loc_1786042746410', name: "2nd mid", x: -2.88, y: 2.12, z: -13.39, type: 'stairs' },
    { id: 'loc_1786042772082', name: "3rd floor base", x: 0.57, y: 3.16, z: -13.18, type: 'corridor' },
    { id: 'loc_1786042792588', name: "312", x: 1.92, y: 3.11, z: -21.5, type: 'room' },
    { id: 'loc_1786093131841', name: "IT LAB 8", x: 2.92, y: 2.46, z: -4.91, type: 'room' },
    { id: 'loc_1786093163510', name: "IT 2nd floor stairs base", x: 3.98, y: 2.44, z: -3.89, type: 'room' },
    { id: 'loc_1786093197762', name: "IT 2nd floor", x: 0.59, y: 3.62, z: 0.05, type: 'corridor' },
    { id: 'loc_1786093216768', name: "IT 309", x: -2.24, y: 3.65, z: 0.25, type: 'room' },
    { id: 'loc_1786093240458', name: "IT LAB 6", x: -2.01, y: 3.65, z: -1.55, type: 'room' },
    { id: 'loc_1786097730344', name: "IT 1st Floor", x: 0.52, y: 2.96, z: -11.88, type: 'corridor' },
    { id: 'loc_1786097774060', name: "1st floor stairs base", x: -0.66, y: 2.99, z: -10.68, type: 'stairs' },
    { id: 'loc_1786097850965', name: "IT LAB 8", x: -1.14, y: 4.07, z: -5.65, type: 'room' },
    { id: 'loc_1786097877406', name: "2nd floor stairs base", x: -2.42, y: 4.03, z: -6.77, type: 'stairs' },
    { id: 'loc_1786097911927', name: "IT 3rd floor", x: -2.76, y: 5.19, z: -10.94, type: 'corridor' },
    { id: 'loc_1786097931983', name: "IT LAB 6", x: 0.56, y: 5.2, z: -11.78, type: 'room' },
    { id: 'loc_1786097960499', name: "IT 309", x: -0.77, y: 5.22, z: -13.02, type: 'room' },
    { id: 'loc_1786098000173', name: "4th floor base", x: -0.98, y: 5.19, z: -10.63, type: 'stairs' },
    { id: 'loc_1786098029386', name: "Ms Noor Ul Huda Office", x: -1.26, y: 7.5, z: -5.79, type: 'room' },
    { id: 'loc_1786098053217', name: "5th floor base", x: -2.5, y: 7.46, z: -6.94, type: 'stairs' },
    { id: 'loc_1786098074100', name: "5th floor", x: -2.49, y: 8.6, z: -11.48, type: 'corridor' },
    { id: 'loc_1786098096450', name: "6th floor base", x: -1.11, y: 8.63, z: -10.27, type: 'corridor' },
    { id: 'loc_1786098130968', name: "IT lab 11", x: -1.53, y: 10.15, z: -4.35, type: 'room' },
    { id: 'loc_1786098149277', name: "IT LAB 12", x: -7.29, y: 10.14, z: -4.07, type: 'room' },
    { id: 'loc_1786180770962', name: "IT Main gate", x: 0.01, y: 0.01, z: -0.03, type: 'corridor' },
    { id: 'loc_1786180792269', name: "Lift", x: 0.13, y: -0.05, z: -11.76, type: 'room' },
    { id: 'loc_1786180816980', name: "LAB 1", x: -5.02, y: -0.73, z: -15, type: 'room' },
    { id: 'loc_1786181034367', name: "Main gate 1", x: 0.01, y: 0.02, z: 0.06, type: 'corridor' },
    { id: 'loc_1786181053584', name: "Basement stairs", x: -0.31, y: -0.14, z: -10.42, type: 'stairs' },
    { id: 'loc_1786181085503', name: "Basement stairs mid", x: -4.92, y: 2.15, z: -14.39, type: 'stairs' },
    { id: 'loc_1786181116517', name: "IT 204", x: 0.72, y: 2.7, z: -8.88, type: 'room' },
    { id: 'loc_1786181858918', name: "Lab 01", x: 0.01, y: 0.07, z: 0.09, type: 'room' },
    { id: 'loc_1786181877174', name: "Lab 02", x: -0.95, y: -0.04, z: -5.49, type: 'room' },
    { id: 'loc_1786181894058', name: "Lab 3", x: 6.41, y: 0.1, z: -9.03, type: 'room' },
    { id: 'loc_1786439204728', name: "Admin", x: 0.03, y: 0, z: -0.01, type: 'corridor' },
    { id: 'loc_1786442403186', name: "Admin lobby hub", x: 0.02, y: 0.01, z: 0.07, type: 'corridor' },
    { id: 'loc_1786442420219', name: "Procurement department", x: -2.11, y: 0.06, z: 0.01, type: 'room' },
    { id: 'loc_1786442448601', name: "Admin stairs base", x: -2.98, y: 0.09, z: -9.76, type: 'stairs' },
    { id: 'loc_1786442469732', name: "admin stairs mid", x: -5.41, y: 1.84, z: -13.8, type: 'stairs' },
    { id: 'loc_1786442496579', name: "Admin first floor", x: -2.02, y: 3.57, z: -10.31, type: 'corridor' },
    { id: 'loc_1786442514178', name: "Finance department", x: -1.78, y: 3.54, z: -7.08, type: 'room' },
    { id: 'loc_1786442533496', name: "Registrar office", x: -1.74, y: 3.54, z: -2.16, type: 'room' },
    { id: 'loc_1786442585571', name: "Admin 1st mid", x: 0.14, y: 3.5, z: -3.63, type: 'corridor' },
    { id: 'loc_1786442599987', name: "Admin room", x: 4.41, y: 3.51, z: -1.76, type: 'room' },
    { id: 'loc_1786442616842', name: "Scholarship office", x: 4.98, y: 3.48, z: -6.37, type: 'room' },
    { id: 'loc_1786442679642', name: "Admissions office", x: 4.2, y: 0.05, z: -0.1, type: 'room' },
    { id: 'loc_1786442693890', name: "Rector office", x: 5.09, y: 0.12, z: -2.65, type: 'room' },
    { id: 'loc_1786442746502', name: "Admin gate", x: -0.52, y: 0.07, z: 5.66, type: 'exit' },
    { id: 'loc_1786530875903', name: "Route 2 stairs base", x: 0.29, y: 0.07, z: -5.89, type: 'stairs' },
    { id: 'loc_1786530903612', name: "Route 2 stairs mid", x: 3.11, y: 1.61, z: -10.38, type: 'stairs' },
    { id: 'loc_1786530931782', name: "Route 2 first floor", x: -0.72, y: 3.38, z: -7.35, type: 'corridor' },
    { id: 'loc_1787047494473', name: "Admin First Corner", x: 0.53, y: 0.04, z: -7.19, type: 'corridor' },
    { id: 'loc_1787136122867', name: "Admin u turn", x: -0.73, y: 0.12, z: -1.14, type: 'corridor' },
    { id: 'loc_1787136146371', name: "Placement office", x: -5.16, y: 0.54, z: 4.04, type: 'room' },
    { id: 'loc_1789544096033', name: "Ground floor", x: 0.12, y: -0.07, z: -0.12, type: 'corridor' },
    { id: 'loc_1789544122937', name: "Atm", x: 0.18, y: 0.21, z: -2.08, type: 'room' },
    { id: 'lobby_f1', name: "Lobby Floor 1", x: 0, y: 0, z: 0, type: 'corridor' },
    { id: 'room_101', name: "Room 101 (F1)", x: 3, y: 0, z: 2, type: 'room' },
    { id: 'stairs_f1', name: "Stairs Floor 1", x: 0, y: 0, z: 10, type: 'stairs' },
    { id: 'stairs_f2', name: "Stairs Floor 2", x: 0, y: 4, z: 10, type: 'stairs' },
    { id: 'lobby_f2', name: "Lobby Floor 2", x: 0, y: 4, z: 0, type: 'corridor' },
    { id: 'room_201', name: "Room 201 (F2)", x: -3, y: 4, z: -2, type: 'room' },
    { id: 'stairs_f3', name: "Stairs Floor 3", x: 0, y: 8, z: 10, type: 'stairs' },
    { id: 'room_301', name: "Room 301 (F3)", x: 4, y: 8, z: 5, type: 'room' },
    { id: 'it301', name: "IT-301 Lab", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'it_corr', name: "IT Corridor Start", x: 0, y: 0, z: 5, type: 'corridor' },
    { id: 'it302', name: "IT-302 Lab", x: 4, y: 0, z: 5, type: 'room' },
    { id: 'stairs3', name: "Stairs 3rd Floor", x: -5, y: 0, z: 15, type: 'stairs' },
    { id: 'cs_fac', name: "CS Department Faculty", x: 2, y: 0, z: 15, type: 'room' },
    { id: 'entrance', name: "Entrance", x: 0.03, y: 0, z: 0.01, type: 'room' },
    { id: 'exit', name: "Exit", x: 2.76, y: 0, z: 0.9, type: 'room' },
    { id: 'bkt', name: "Barkat", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'rlx', name: "ROLEX", x: 0, y: 0, z: -4, type: 'room' },
    { id: 'it_gate', name: "IT Main Gate", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'lift_1', name: "The Lift", x: 0, y: 0, z: -12.5, type: 'corridor' },
    { id: 'it_lab_1', name: "IT Lab 1", x: 3, y: 0, z: -12.5, type: 'room' },
    { id: 'it_main_gate_1', name: "IT Main gate 1", x: 0, y: 0, z: 0, type: 'room' },
    { id: 'stairs_1_base', name: "Stairs 1 base", x: -2.5, y: 0, z: -12.5, type: 'stairs' },
    { id: 'stairs_1_midway', name: "Stairs 1 midway", x: -3.8, y: 2, z: -15.5, type: 'stairs' },
    { id: 'first_floor', name: "1st floor", x: -2.5, y: 3.8, z: -12.5, type: 'corridor' },
    { id: 'room_204', name: "Room 204", x: 0, y: 3.8, z: -9, type: 'room' },
    { id: 'lab_4', name: "Lab 4", x: -4.5, y: 3.8, z: -10, type: 'room' },
    { id: 'stairs_2_base', name: "Stairs 2 base", x: -2.5, y: 3.8, z: -12.5, type: 'stairs' },
    { id: 'lab_8', name: "Lab 8", x: -4.5, y: 6, z: -17, type: 'room' },
    { id: 'lab_9', name: "Lab 9", x: -1.5, y: 6, z: -21, type: 'room' },
    { id: 'lab_10', name: "Lab 10", x: 3.5, y: 6, z: -18, type: 'room' },
  ];

  for (const node of nodes) {
    db.runSync(
      `INSERT OR IGNORE INTO LocationNodes (id, name, x, y, z, type) VALUES (?, ?, ?, ?, ?, ?)`,
      [node.id, node.name, node.x, node.y, node.z, node.type]
    );
  }

  const edges = [
    { a: 'loc_1783705414239', b: 'loc_1783705445555', d: 4.51 },
    { a: 'loc_1783705445555', b: 'loc_1783705474966', d: 3.5 },
    { a: 'loc_1783705474966', b: 'loc_1783705505137', d: 3.5 },
    { a: 'loc_1783705505137', b: 'loc_1783705529988', d: 3.03 },
    { a: 'loc_1783705529988', b: 'loc_1783705554117', d: 7.06 },
    { a: 'loc_1783772308590', b: 'loc_1783772346535', d: 9.49 },
    { a: 'loc_1783772346535', b: 'loc_1783772367978', d: 3.11 },
    { a: 'loc_1783772367978', b: 'loc_1783772390844', d: 4.73 },
    { a: 'loc_1785552600163', b: 'loc_1785552662392', d: 57.69 },
    { a: 'loc_1786042634820', b: 'loc_1786042684611', d: 17.04 },
    { a: 'loc_1786042684611', b: 'loc_1786042711629', d: 4.4 },
    { a: 'loc_1786042711629', b: 'loc_1786042746410', d: 3.39 },
    { a: 'loc_1786042746410', b: 'loc_1786042772082', d: 3.6 },
    { a: 'loc_1786042772082', b: 'loc_1786042792588', d: 8.43 },
    { a: 'loc_1786093131841', b: 'loc_1786093163510', d: 1.47 },
    { a: 'loc_1786093163510', b: 'loc_1786093197762', d: 5.32 },
    { a: 'loc_1786093197762', b: 'loc_1786093216768', d: 2.84 },
    { a: 'loc_1786093216768', b: 'loc_1786093240458', d: 1.82 },
    { a: 'loc_1786097730344', b: 'loc_1786097774060', d: 1.68 },
    { a: 'loc_1786097774060', b: 'loc_1786097850965', d: 5.17 },
    { a: 'loc_1786097850965', b: 'loc_1786097877406', d: 1.7 },
    { a: 'loc_1786097877406', b: 'loc_1786097911927', d: 4.34 },
    { a: 'loc_1786097911927', b: 'loc_1786097931983', d: 3.43 },
    { a: 'loc_1786097931983', b: 'loc_1786097960499', d: 1.82 },
    { a: 'loc_1786097960499', b: 'loc_1786098000173', d: 2.39 },
    { a: 'loc_1786098000173', b: 'loc_1786098029386', d: 5.38 },
    { a: 'loc_1786098029386', b: 'loc_1786098053217', d: 1.69 },
    { a: 'loc_1786098053217', b: 'loc_1786098074100', d: 4.68 },
    { a: 'loc_1786098074100', b: 'loc_1786098096450', d: 1.84 },
    { a: 'loc_1786098096450', b: 'loc_1786098130968', d: 6.12 },
    { a: 'loc_1786098130968', b: 'loc_1786098149277', d: 5.76 },
    { a: 'loc_1786180770962', b: 'loc_1786180792269', d: 11.73 },
    { a: 'loc_1786180792269', b: 'loc_1786180816980', d: 6.12 },
    { a: 'loc_1786181034367', b: 'loc_1786181053584', d: 10.49 },
    { a: 'loc_1786181053584', b: 'loc_1786181085503', d: 6.5 },
    { a: 'loc_1786181085503', b: 'loc_1786181116517', d: 7.91 },
    { a: 'loc_1786180792269', b: 'loc_1786181053584', d: 1.4 },
    { a: 'loc_1786181858918', b: 'loc_1786181877174', d: 5.67 },
    { a: 'loc_1786181877174', b: 'loc_1786181894058', d: 8.17 },
    { a: 'loc_1786442403186', b: 'loc_1786442420219', d: 2.13 },
    { a: 'loc_1786442420219', b: 'loc_1786442448601', d: 9.81 },
    { a: 'loc_1786442448601', b: 'loc_1786442469732', d: 5.03 },
    { a: 'loc_1786442496579', b: 'loc_1786442514178', d: 3.24 },
    { a: 'loc_1786442514178', b: 'loc_1786442533496', d: 4.92 },
    { a: 'loc_1786442585571', b: 'loc_1786442599987', d: 4.66 },
    { a: 'loc_1786442599987', b: 'loc_1786442616842', d: 4.65 },
    { a: 'loc_1786442403186', b: 'loc_1786442679642', d: 4.19 },
    { a: 'loc_1786442679642', b: 'loc_1786442693890', d: 2.71 },
    { a: 'loc_1786442403186', b: 'loc_1786442746502', d: 5.62 },
    { a: 'loc_1786442469732', b: 'loc_1786442496579', d: 5.17 },
    { a: 'loc_1786442693890', b: 'loc_1786530875903', d: 5.79 },
    { a: 'loc_1786530875903', b: 'loc_1786530903612', d: 5.52 },
    { a: 'loc_1786530903612', b: 'loc_1786530931782', d: 5.2 },
    { a: 'loc_1786442514178', b: 'loc_1786442585571', d: 3.95 },
    { a: 'loc_1786442533496', b: 'loc_1786442585571', d: 2.39 },
    { a: 'loc_1786442496579', b: 'loc_1787047494473', d: 5.36 },
    { a: 'loc_1787047494473', b: 'loc_1786442585571', d: 4.98 },
    { a: 'loc_1786442496579', b: 'loc_1787136122867', d: 9.89 },
    { a: 'loc_1787136122867', b: 'loc_1787136146371', d: 6.83 },
    { a: 'room_101', b: 'lobby_f1', d: 3.6 },
    { a: 'lobby_f1', b: 'stairs_f1', d: 10 },
    { a: 'stairs_f1', b: 'stairs_f2', d: 5.6 },
    { a: 'stairs_f2', b: 'lobby_f2', d: 10 },
    { a: 'lobby_f2', b: 'room_201', d: 3.6 },
    { a: 'stairs_f2', b: 'stairs_f3', d: 5.6 },
    { a: 'stairs_f3', b: 'room_301', d: 6.4 },
    { a: 'it301', b: 'it_corr', d: 5 },
    { a: 'it_corr', b: 'it302', d: 4 },
    { a: 'it_corr', b: 'stairs3', d: 11.2 },
    { a: 'stairs3', b: 'cs_fac', d: 7 },
    { a: 'entrance', b: 'exit', d: 2.9 },
    { a: 'bkt', b: 'rlx', d: 3 },
    { a: 'it_gate', b: 'lift_1', d: 12.5 },
    { a: 'lift_1', b: 'it_lab_1', d: 6.5 },
    { a: 'it_gate', b: 'it_main_gate_1', d: 0.1 },
    { a: 'it_main_gate_1', b: 'lift_1', d: 12.5 },
    { a: 'stairs_1_base', b: 'lift_1', d: 0.5 },
    { a: 'stairs_1_base', b: 'it_lab_1', d: 6.5 },
    { a: 'it_main_gate_1', b: 'stairs_1_base', d: 12.32 },
    { a: 'stairs_1_base', b: 'stairs_1_midway', d: 5.67 },
    { a: 'stairs_1_midway', b: 'first_floor', d: 4.83 },
    { a: 'first_floor', b: 'room_204', d: 3.5 },
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


