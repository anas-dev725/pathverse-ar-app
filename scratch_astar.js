// ES module syntax, need to run with Babel or convert to CommonJS
const calculateAStarPath = (startId, endId, nodes, edges) => {
  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  if (!nodeMap.has(startId) || !nodeMap.has(endId)) {
    return [];
  }

  const adjacencyList = new Map();
  nodes.forEach(n => adjacencyList.set(n.id, []));

  edges.forEach(e => {
    adjacencyList.get(e.node1_id).push({ to: e.node2_id, cost: e.distance });
    adjacencyList.get(e.node2_id).push({ to: e.node1_id, cost: e.distance });
  });

  const heuristic = (nodeA, nodeB) => {
    const dx = nodeA.x - nodeB.x;
    const dy = nodeA.y - nodeB.y;
    const dz = nodeA.z - nodeB.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  };

  const openSet = new Set([startId]);
  const cameFrom = new Map();
  
  const gScore = new Map();
  nodes.forEach(n => gScore.set(n.id, Infinity));
  gScore.set(startId, 0);

  const fScore = new Map();
  nodes.forEach(n => fScore.set(n.id, Infinity));
  fScore.set(startId, heuristic(nodeMap.get(startId), nodeMap.get(endId)));

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    
    for (let nodeId of openSet) {
      if (fScore.get(nodeId) < lowestF) {
        lowestF = fScore.get(nodeId);
        current = nodeId;
      }
    }

    if (current === endId) {
      const path = [nodeMap.get(current)];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current);
        path.unshift(nodeMap.get(current));
      }
      return path;
    }

    openSet.delete(current);
    const neighbors = adjacencyList.get(current) || [];
    
    for (let neighbor of neighbors) {
      const tentativeG = gScore.get(current) + neighbor.cost;
      
      if (tentativeG < (gScore.get(neighbor.to) || Infinity)) {
        cameFrom.set(neighbor.to, current);
        gScore.set(neighbor.to, tentativeG);
        fScore.set(neighbor.to, tentativeG + heuristic(nodeMap.get(neighbor.to), nodeMap.get(endId)));
        
        if (!openSet.has(neighbor.to)) {
          openSet.add(neighbor.to);
        }
      }
    }
  }

  return [];
};

const nodes = [
  { id: 'it_gate', x: 0, y: 0, z: 0 },
  { id: 'lab_1', x: 10, y: 0, z: 0 }
];

const edges = [
  { node1_id: 'it_gate', node2_id: 'lab_1', distance: 10 }
];

console.log(calculateAStarPath('it_gate', 'lab_1', nodes, edges).map(n => n.id));
console.log(calculateAStarPath('lab_1', 'it_gate', nodes, edges).map(n => n.id));
