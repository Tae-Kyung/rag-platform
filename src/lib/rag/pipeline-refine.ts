import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL } from '@/config/constants';

const MAX_SEGMENT = 40_000;

/**
 * Refine crawled web content by removing navigation noise and structuring with markdown headings.
 * Processes in segments to handle long documents.
 */
export async function refineWebContent(text: string): Promise<string> {
  if (text.length <= MAX_SEGMENT) {
    return await refineSegment(text);
  }

  // Split into segments at paragraph boundaries
  const segments: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= MAX_SEGMENT) {
      segments.push(remaining);
      break;
    }
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

  console.log(`[Pipeline] Refining ${segments.length} segments with AI (parallel)`);
  const results = await Promise.all(segments.map((segment) => refineSegment(segment)));
  return results.join('\n\n');
}

async function refineSegment(text: string): Promise<string> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create(
      {
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert at cleaning web page content for use in a knowledge base.
Follow these rules strictly:
1. Remove web noise: navigation menus, headers/footers, cookie banners, ads, sidebar widgets, social media links, breadcrumbs, and other non-content elements.
2. Structure the remaining content with markdown headings (##, ###) to organize it semantically.
3. Preserve ALL factual information exactly as-is. Never summarize, paraphrase, or omit any substantive content.
4. Keep lists, tables, code blocks, and other structured content intact.
5. Output only the cleaned content without additional explanation or comments.`,
          },
          {
            role: 'user',
            content: `Clean the following web page content for a knowledge base:\n\n${text}`,
          },
        ],
        max_tokens: 16000,
        temperature: 0,
      },
      { timeout: 45_000 },
    );
    return response.choices[0].message.content || text;
  } catch (error) {
    console.error('[Pipeline] AI refine failed, using raw text:', error);
    return text;
  }
}
