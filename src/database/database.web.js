// Web mock for SQLite Database. Allows Web Preview in IDE without Native module crashing.
export const initDB = () => {
    console.log("Mock SQLite Init on Web");
};
export const seedDummyData = () => {};

export const getAllNodes = () => {
  return [
    { id: 'n1', name: 'IT-301 Lab', x: 0, y: 0, z: 0, type: 'room' },
    { id: 'n2', name: 'IT Corridor Start', x: 0, y: 5, z: 0, type: 'corridor' },
    { id: 'n3', name: 'IT-302 Lab', x: 4, y: 5, z: 0, type: 'room' },
    { id: 'n4', name: 'Stairs 3rd Floor', x: -5, y: 15, z: 0, type: 'stairs' },
    { id: 'n5', name: 'CS Department Faculty', x: 2, y: 15, z: 0, type: 'room' },
  ];
};

export const getAllEdges = () => {
  return [];
};

// Web Mock
export const addNode = () => {};
export const addEdge = () => {};
