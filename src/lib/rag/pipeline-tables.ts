import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL, MAX_TABLES_TO_PROCESS } from '@/config/constants';

type TableSummaryChunk = { content: string; metadata: { chunkIndex: number; startChar: number; endChar: number } };

/**
 * Extract markdown tables and generate natural language summary chunks.
 * Each summary is embedded separately for better semantic search retrieval.
 * Processes tables in parallel batches of 3 for speed.
 */
export async function summarizeTables(
  text: string,
  fileName: string
): Promise<TableSummaryChunk[]> {
  // Match markdown-style tables
  const tableRegex = /(\|[^\n]+\|\n\|[-: |]+\|\n(?:\|[^\n]+\|\n?)+)/g;
  const tables: string[] = [];
  let match;
  while ((match = tableRegex.exec(text)) !== null) {
    tables.push(match[1]);
  }

  if (tables.length === 0) return [];

  // Limit to MAX_TABLES_TO_PROCESS tables
  const tablesToProcess = tables.slice(0, MAX_TABLES_TO_PROCESS);
  const openai = getOpenAI();

  async function summarizeOne(tableContent: string, index: number): Promise<TableSummaryChunk | null> {
    try {
      const response = await openai.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Convert all rows of the given table into natural language sentences. Include all column data (names, phone numbers, departments, titles, etc.) without omission. Write within 1000 tokens.',
          },
          { role: 'user', content: tableContent },
        ],
        temperature: 0,
        max_tokens: 1000,
      });

      const summary = response.choices[0].message.content?.trim();
      if (summary) {
        return {
          content: `[Table Summary - ${fileName}] ${summary}`,
          metadata: {
            chunkIndex: 9000 + index, // High index to avoid collision
            startChar: 0,
            endChar: 0,
          },
        };
      }
      return null;
    } catch (error) {
      console.error(`[Pipeline] Table summary ${index} failed:`, error);
      return null;
    }
  }

  // Process in parallel batches of 3
  const BATCH_SIZE = 3;
  const summaryChunks: TableSummaryChunk[] = [];

  for (let i = 0; i < tablesToProcess.length; i += BATCH_SIZE) {
    const batch = tablesToProcess.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((table, j) => summarizeOne(table, i + j))
    );
    for (const result of results) {
      if (result) summaryChunks.push(result);
    }
  }

  return summaryChunks;
}
