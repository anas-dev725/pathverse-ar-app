/**
 * Calculates the shortest path between a starting node and an ending node
 * using the A* (A-Star) pathfinding algorithm over a spatial graph.
 */
export const calculateAStarPath = (startId, endId, nodes, edges) => {
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

  // Heuristic: Euclidean distance between nodes in 3D space
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
    
    // Find node in openSet with lowest fScore
    for (let nodeId of openSet) {
      if (fScore.get(nodeId) < lowestF) {
        lowestF = fScore.get(nodeId);
        current = nodeId;
      }
    }

    if (current === endId) {
      // Reconstruct path
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
      
      // If found a shorter path to neighbor
      if (tentativeG < gScore.get(neighbor.to)) {
        cameFrom.set(neighbor.to, current);
        gScore.set(neighbor.to, tentativeG);
        fScore.set(neighbor.to, tentativeG + heuristic(nodeMap.get(neighbor.to), nodeMap.get(endId)));
        
        if (!openSet.has(neighbor.to)) {
          openSet.add(neighbor.to);
        }
      }
    }
  }

  return []; // No path found
};
