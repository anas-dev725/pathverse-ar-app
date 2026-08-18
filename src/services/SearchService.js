/**
 * Fuzzy matching for OCR outputs and user search.
 * Supports partial matches, ignores punctuation/spaces,
 * and works on ALL node types (not just 'room') for OCR anchoring.
 */

const normalize = (str) =>
  (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Used by the search bar — searches ALL saved node landmarks (room, corridor, stairs, exit).
 */
export const fuzzySearchRooms = (query, nodes) => {
  if (!nodes || !Array.isArray(nodes)) return [];
  const validNodes = nodes.filter(n => n && n.name && n.name.trim() !== '');

  if (!query || query.trim() === '') {
    return validNodes;
  }

  const q = normalize(query);
  if (!q) return validNodes;

  return validNodes.filter(node => {
    const nameNorm = normalize(node.name);
    return nameNorm.includes(q) || q.includes(nameNorm);
  });
};

/**
 * Used by OCR — searches ALL node types (room, corridor, stairs, exit)
 * because any labeled sign is a valid anchor.
 * Also handles split OCR lines like ["IT", "301"] → "IT301" matching "IT-301 Lab".
 */
export const ocrSearchNodes = (rawText, nodes) => {
  if (!rawText || !nodes?.length) return [];

  // Normalize OCR text — merge all lines into one normalized string
  const q = normalize(rawText);
  if (q.length < 2) return []; // ignore single-char detections

  return nodes
    .map(node => {
      const name = normalize(node.name);
      let score = 0;

      // Exact substring match (strongest signal)
      if (name.includes(q) || q.includes(name)) score += 10;

      // Partial prefix match (e.g., "IT3" matches "IT301Lab")
      if (name.startsWith(q.slice(0, 3)) && q.length >= 3) score += 5;

      // Number match — if both contain the same digit sequence
      const nameNums = (node.name.match(/\d+/g) || []).join('');
      const qNums    = (rawText.match(/\d+/g) || []).join('');
      if (qNums.length >= 2 && nameNums.includes(qNums)) score += 8;

      return { ...node, score };
    })
    .filter(n => n.score > 0)
    .sort((a, b) => b.score - a.score);
};
