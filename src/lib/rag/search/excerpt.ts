import { EXCERPT_THRESHOLD, EXCERPT_CONTEXT_CHARS } from '@/config/constants';

interface HasContent {
  content: string;
}

/**
 * Extract relevant excerpts from large chunks.
 * For chunks > EXCERPT_THRESHOLD chars, finds segments containing query keywords
 * and returns ~150 chars of context around each match.
 */
export function extractRelevantContent<T extends HasContent>(
  results: T[],
  query: string
): T[] {
  const keywords = query
    .replace(/[?.,!~\s]+/g, ' ')
    .split(' ')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2);

  if (keywords.length === 0) return results;

  return results.map((result) => {
    if (result.content.length <= EXCERPT_THRESHOLD) return result;

    const contentLower = result.content.toLowerCase();

    // Find all keyword match positions
    const matchPositions: number[] = [];
    for (const kw of keywords) {
      let idx = contentLower.indexOf(kw);
      while (idx !== -1) {
        matchPositions.push(idx);
        idx = contentLower.indexOf(kw, idx + 1);
      }
    }

    if (matchPositions.length === 0) return result;
    matchPositions.sort((a, b) => a - b);

    // Merge overlapping ranges
    const ranges: [number, number][] = [];
    for (const pos of matchPositions) {
      const start = Math.max(0, pos - EXCERPT_CONTEXT_CHARS);
      const end = Math.min(result.content.length, pos + EXCERPT_CONTEXT_CHARS + 20);
      if (ranges.length > 0 && start <= ranges[ranges.length - 1][1]) {
        ranges[ranges.length - 1][1] = Math.max(ranges[ranges.length - 1][1], end);
      } else {
        ranges.push([start, end]);
      }
    }

    // Build excerpt from ranges
    const parts: string[] = [];
    for (const [start, end] of ranges) {
      let segment = result.content.substring(start, end).trim();
      if (start > 0) segment = '...' + segment;
      if (end < result.content.length) segment = segment + '...';
      parts.push(segment);
    }

    const excerpt = parts.join('\n');
    // Only use excerpt if it's meaningfully shorter than original
    if (excerpt.length < result.content.length * 0.7) {
      console.log(`[Search] Excerpt: ${result.content.length} -> ${excerpt.length} chars`);
      return { ...result, content: excerpt };
    }
    return result;
  });
}
