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

// Helper: Extract meaningful words (>2 chars, excluding stop words)
const tokenize = (str) => {
  const stopWords = new Set(['of', 'the', 'and', 'for', 'to', 'in', 'at', 'on']);
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w));
};

/**
 * Used by OCR — searches ALL node types (room, corridor, stairs, exit)
 * using tokenized word matching, stemming, and number sequence matching.
 */
export const ocrSearchNodes = (rawText, nodes) => {
  if (!rawText || !nodes?.length) return [];

  const qNorm = normalize(rawText);
  if (qNorm.length < 2) return [];

  const qTokens = tokenize(rawText);

  return nodes
    .map(node => {
      const nameNorm = normalize(node.name);
      const nodeTokens = tokenize(node.name);
      let score = 0;

      // 1. Direct full string inclusion (strongest signal)
      if (nameNorm.includes(qNorm) || qNorm.includes(nameNorm)) {
        score += 25;
      }

      // 2. Word Token & Stemming overlap matching (e.g. "scholarships" ↔ "scholarship", "registrar" ↔ "registrar")
      let matchedTokens = 0;
      qTokens.forEach(qt => {
        nodeTokens.forEach(nt => {
          // Exact token match or stem match (>=4 chars)
          if (qt === nt || (qt.length >= 4 && (qt.startsWith(nt) || nt.startsWith(qt)))) {
            matchedTokens++;
            score += 15;
          } else if (qt.length >= 4 && nt.length >= 4 && (qt.includes(nt) || nt.includes(qt))) {
            score += 8;
          }
        });
      });

      if (matchedTokens > 0) {
        score += matchedTokens * 5;
      }

      // 3. Room Number matching (e.g. "204" in "Room 204")
      const nameNums = (node.name.match(/\d+/g) || []).join('');
      const qNums    = (rawText.match(/\d+/g) || []).join('');
      if (qNums.length >= 2 && nameNums.includes(qNums)) {
        score += 25;
      }

      return { ...node, score };
    })
    .filter(n => n.score >= 12)
    .sort((a, b) => b.score - a.score);
};
