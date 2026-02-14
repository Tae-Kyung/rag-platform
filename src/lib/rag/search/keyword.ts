import { createServiceRoleClient } from '@/lib/supabase/service';
import type { ChunkMetadata } from '@/types';
import type { SearchResult } from './index';

const stopWords = new Set([
  // Korean particles
  '\uC740', '\uB294', '\uC774', '\uAC00', '\uC744', '\uB97C', '\uC5D0', '\uC5D0\uC11C',
  '\uC758', '\uC640', '\uACFC', '\uB85C', '\uC73C\uB85C',
  '\uB3C4', '\uB9CC', '\uAE4C\uC9C0', '\uBD80\uD130', '\uC5D0\uAC8C', '\uD55C\uD14C',
  '\uAED8', '\uBCF4\uB2E4', '\uCC98\uB7FC', '\uAC19\uC774',
  // Korean verbs/adjectives
  '\uD558\uB294', '\uB418\uB294', '\uC788\uB294', '\uC5C6\uB294',
  '\uD558\uB2E4', '\uB418\uB2E4', '\uC788\uB2E4', '\uC5C6\uB2E4', '\uC778\uAC00\uC694',
  // Question words
  '\uBB34\uC5C7', '\uC5B4\uB5A4', '\uC5B4\uB5BB\uAC8C', '\uC5B8\uC81C',
  '\uC5B4\uB514', '\uB204\uAD6C', '\uC65C', '\uC5BC\uB9C8',
  '\uB300\uD574', '\uAD00\uD574', '\uB300\uD55C', '\uAD00\uD55C',
  '\uACBD\uC6B0', '\uB54C', '\uAC83', '\uC218',
  // English stop words
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'have',
  'was', 'were', 'will', 'would', 'do', 'does', 'did', 'has', 'been',
  'what', 'how', 'when', 'where', 'who', 'why', 'this', 'that',
  'are', 'from', 'by', 'it', 'its', 'my', 'your', 'our', 'their',
]);

const genericWords = new Set([
  // Question-intent words (SaaS-generic)
  '\uC804\uD654\uBC88\uD638', '\uBC88\uD638', '\uC774\uBA54\uC77C', '\uBA54\uC77C',
  '\uC8FC\uC18C', '\uC5F0\uB77D\uCC98',
  '\uC54C\uB824\uC918', '\uC54C\uB824\uC8FC\uC138\uC694', '\uC54C\uB824', '\uC54C\uACE0',
  '\uC2F6\uC5B4\uC694',
  '\uBC29\uBC95', '\uC808\uCC28', '\uC77C\uC815', '\uBE44\uC6A9', '\uAC00\uACA9', '\uC704\uCE58',
  '\uB0A0\uC9DC', '\uB0A0\uC9DC\uB294', '\uC2DC\uAE30', '\uAE30\uAC04', '\uC2DC\uAC04', '\uB0B4\uC6A9',
  // English generic
  'please', 'help', 'need', 'want', 'tell', 'about', 'information',
  'question', 'answer', 'details', 'contact', 'email', 'phone',
]);

const PARTICLES = /[\uC740\uB294\uC774\uAC00\uC744\uB97C\uC758\uB85C\uB3C4\uB9CC]+$/;

export async function keywordSearch(
  query: string,
  botId: string,
  limit: number
): Promise<SearchResult[]> {
  const allKeywords = query
    .replace(/[?.,!~\s]+/g, ' ')
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  const specificKeywords = allKeywords.filter((w) => {
    if (genericWords.has(w)) return false;
    const stripped = w.replace(PARTICLES, '');
    if (stripped.length >= 2 && genericWords.has(stripped)) return false;
    return true;
  });
  const searchKeywords = specificKeywords.length > 0 ? specificKeywords : allKeywords;

  if (searchKeywords.length === 0) return [];

  console.log(`[Search] Keyword search with: ${searchKeywords.join(', ')}`);

  const supabase = createServiceRoleClient();

  const allData: { id: string; content: string; metadata: unknown }[] = [];
  const seenIds = new Set<string>();

  // AND search: chunks matching ALL specific keywords
  if (searchKeywords.length >= 2) {
    let andQuery = supabase
      .from('document_chunks')
      .select('id, content, metadata')
      .eq('bot_id', botId);
    for (const kw of searchKeywords) {
      andQuery = andQuery.ilike('content', `%${kw}%`);
    }
    const { data: andData } = await andQuery.limit(limit);
    if (andData) {
      for (const row of andData) {
        if (!seenIds.has(row.id)) {
          allData.push(row);
          seenIds.add(row.id);
        }
      }
    }
  }

  // OR search: fill remaining slots
  if (allData.length < limit) {
    const conditions = searchKeywords.map((kw) => `content.ilike.%${kw}%`);
    const { data: orData } = await supabase
      .from('document_chunks')
      .select('id, content, metadata')
      .eq('bot_id', botId)
      .or(conditions.join(','))
      .limit(limit * 4);
    if (orData) {
      for (const row of orData) {
        if (!seenIds.has(row.id)) {
          allData.push(row);
          seenIds.add(row.id);
        }
      }
    }
  }

  // Score by keyword match count
  const scored = allData.map((row) => {
    const contentLower = row.content.toLowerCase();
    const specificMatchCount = searchKeywords.filter((kw) =>
      contentLower.includes(kw.toLowerCase())
    ).length;
    const totalMatchCount = allKeywords.filter((kw) =>
      contentLower.includes(kw.toLowerCase())
    ).length;
    return {
      id: row.id,
      content: row.content,
      metadata: (row.metadata ?? {}) as ChunkMetadata,
      similarity: 0.3 + (specificMatchCount / searchKeywords.length) * 0.25
        + (totalMatchCount / allKeywords.length) * 0.05,
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}
