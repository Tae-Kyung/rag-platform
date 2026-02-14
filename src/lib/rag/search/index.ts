import { generateEmbedding } from '../embeddings';
import { createServiceRoleClient } from '@/lib/supabase/service';
import type { ChunkMetadata } from '@/types';
import { getRagSettings } from './settings';
import { generateHypotheticalAnswer, translateToKorean } from './hyde';
import { keywordSearch } from './keyword';
import { extractRelevantContent } from './excerpt';

export interface SearchResult {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  similarity: number;
}

export async function searchDocuments(
  query: string,
  botId: string,
  options: { topK?: number; threshold?: number; language?: string } = {}
): Promise<SearchResult[]> {
  const { language = 'en' } = options;

  const ragSettings = await getRagSettings(botId);

  const topK = options.topK ?? ragSettings.top_k;
  const threshold = options.threshold ?? ragSettings.match_threshold;
  const hydeEnabled = ragSettings.hyde_enabled;

  console.log(`[Search] Settings: topK=${topK}, threshold=${threshold}, hyde=${hydeEnabled}`);

  // Determine search query: HyDE or translation
  let searchQuery: string;
  if (hydeEnabled && language !== 'ko') {
    searchQuery = await generateHypotheticalAnswer(query, language);
  } else if (language !== 'ko') {
    searchQuery = await translateToKorean(query, language);
    console.log(`[Search] Translated: "${query}" -> "${searchQuery}"`);
  } else {
    searchQuery = query;
  }

  const queryEmbedding = await generateEmbedding(searchQuery);
  const supabase = createServiceRoleClient();

  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingStr,
    match_count: topK,
    filter_bot_id: botId,
    match_threshold: threshold,
  });

  if (error) {
    console.error('[Search] RPC error:', error);
    return [];
  }

  console.log(`[Search] RPC returned ${data?.length ?? 0} results`);

  const results = (data || [])
    .filter((result: { similarity: number }) => result.similarity >= threshold)
    .map((result: { id: string; content: string; metadata: unknown; similarity: number }) => ({
      id: result.id,
      content: result.content,
      metadata: (result.metadata ?? {}) as ChunkMetadata,
      similarity: result.similarity,
    }));

  console.log(`[Search] Results: ${results.length} after threshold(${threshold})`);

  // Hybrid search: keyword search + vector merge
  const keywordResults = await keywordSearch(searchQuery, botId, topK);
  const existingIds = new Set(results.map((r: SearchResult) => r.id));
  const newKeywordResults: SearchResult[] = [];
  for (const kr of keywordResults) {
    if (!existingIds.has(kr.id)) {
      newKeywordResults.push(kr);
      existingIds.add(kr.id);
    }
  }

  // Deduplicate keyword results by file_name
  const bestByFile = new Map<string, SearchResult>();
  for (const kr of newKeywordResults) {
    const fileName = kr.metadata?.file_name || kr.id;
    const existing = bestByFile.get(fileName);
    if (!existing || kr.similarity > existing.similarity) {
      bestByFile.set(fileName, kr);
    }
  }
  const dedupedKeywordResults = Array.from(bestByFile.values());
  dedupedKeywordResults.sort((a, b) => b.similarity - a.similarity);

  if (dedupedKeywordResults.length > 0) {
    console.log(`[Search] Hybrid: ${dedupedKeywordResults.length} unique-source keyword results`);
  }

  // Reserve at least 2 slots for keyword results
  const reservedKeyword = Math.min(dedupedKeywordResults.length, 2);
  const vectorSlots = topK - reservedKeyword;
  const merged = [
    ...results.slice(0, vectorSlots),
    ...dedupedKeywordResults.slice(0, reservedKeyword),
    ...results.slice(vectorSlots),
    ...dedupedKeywordResults.slice(reservedKeyword),
  ];

  const finalResults = merged.slice(0, topK);

  return extractRelevantContent(finalResults, searchQuery);
}
