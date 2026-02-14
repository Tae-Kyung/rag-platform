import { getOpenAI } from '@/lib/openai/client';
import { AI_RESTRUCTURE_MAX_SEGMENT, LLM_MODEL } from '@/config/constants';

/**
 * Restructure raw text into markdown tables using LLM.
 * Used when classifyDocument detects table_heavy but text was extracted without Vision.
 * Processes in segments to handle long documents.
 */
export async function restructureWithAI(text: string): Promise<string> {
  const MAX_SEGMENT = AI_RESTRUCTURE_MAX_SEGMENT;
  if (text.length <= MAX_SEGMENT) {
    return await restructureSegment(text);
  }

  // Split into segments at paragraph boundaries
  const segments: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_SEGMENT) {
      segments.push(remaining);
      break;
    }
    // Find a paragraph break near the limit
    let splitAt = remaining.lastIndexOf('\n\n', MAX_SEGMENT);
    if (splitAt < MAX_SEGMENT * 0.5) {
      splitAt = remaining.lastIndexOf('\n', MAX_SEGMENT);
    }
    if (splitAt < MAX_SEGMENT * 0.5) {
      splitAt = MAX_SEGMENT;
    }
    segments.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trimStart();
  }

  console.log(`[Pipeline] Restructuring ${segments.length} segments with AI`);
  const results: string[] = [];
  for (const segment of segments) {
    results.push(await restructureSegment(segment));
  }
  return results.join('\n\n');
}

async function restructureSegment(text: string): Promise<string> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert at cleaning up text extracted from PDFs.
Follow these rules:
1. If there is table data, convert it to markdown table format.
2. Identify the row-column relationships and structure them accurately.
3. Never omit unique information like phone numbers, emails, names, departments.
4. Keep the original content intact, just make it more readable.
5. Output only the cleaned content without additional explanation or comments.`,
        },
        {
          role: 'user',
          content: `Please clean up the following PDF text. If there are tables, convert them to markdown tables:\n\n${text}`,
        },
      ],
      max_tokens: 8000,
      temperature: 0,
    });
    return response.choices[0].message.content || text;
  } catch (error) {
    console.error('[Pipeline] AI restructure failed, using raw text:', error);
    return text;
  }
}
