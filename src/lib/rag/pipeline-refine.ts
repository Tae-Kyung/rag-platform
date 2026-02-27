import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL } from '@/config/constants';

/**
 * Refine crawled web content by removing navigation noise and adding markdown headings.
 *
 * Instead of asking the LLM to rewrite the entire content (which causes timeouts for
 * large documents due to output token generation time), this uses a lightweight approach:
 * the LLM returns only a small JSON with line numbers to remove and headings to insert,
 * then we apply those changes programmatically.
 *
 * Output is typically < 500 tokens regardless of input size → completes in 5-15 seconds.
 */
export async function refineWebContent(text: string): Promise<string> {
  try {
    const lines = text.split('\n');
    const numbered = lines.map((l, i) => `[${i + 1}] ${l}`).join('\n');

    const openai = getOpenAI();
    const response = await openai.chat.completions.create(
      {
        model: LLM_MODEL,
        messages: [
          {
            role: 'system',
            content: `You analyze web page content to clean it for a knowledge base.
Given line-numbered content, return a JSON object with exactly two keys:
- "remove": array of line numbers (integers) that are web noise (navigation menus, cookie banners, ads, footers, sidebar widgets, breadcrumbs, social media links, "skip to content" links, etc.)
- "headings": object mapping line number (string key) to a markdown heading (e.g. "## Section Title") to INSERT BEFORE that line for semantic organization.

Rules:
- Only remove lines that are clearly non-content web noise.
- Preserve ALL factual content. When in doubt, do NOT remove.
- If there is no noise, return {"remove": [], "headings": {}}.
- Return ONLY valid JSON, no explanation or markdown fences.`,
          },
          {
            role: 'user',
            content: numbered,
          },
        ],
        max_tokens: 2000,
        temperature: 0,
        response_format: { type: 'json_object' },
      },
      { timeout: 50_000 },
    );

    const raw = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(raw) as {
      remove?: number[];
      headings?: Record<string, string>;
    };

    const removeSet = new Set(parsed.remove ?? []);
    const headings = parsed.headings ?? {};

    const output: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const heading = headings[String(lineNum)];
      if (heading) {
        output.push(heading);
      }
      if (!removeSet.has(lineNum)) {
        output.push(lines[i]);
      }
    }

    return output.join('\n');
  } catch (error) {
    console.error('[Pipeline] AI refine failed, using raw text:', error);
    return text;
  }
}
