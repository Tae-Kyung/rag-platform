import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL } from '@/config/constants';

export interface DocumentClassification {
  language: string;
  docType: 'general' | 'table_heavy' | 'qa' | 'legal' | 'academic';
}

/**
 * Classify document language and type using LLM
 */
export async function classifyDocument(
  textSample: string
): Promise<DocumentClassification> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a document classifier. Analyze the given text sample and return a JSON object with:
- "language": ISO 639-1 code (ko, en, zh, vi, mn, km, etc.)
- "docType": one of "general", "table_heavy", "qa", "legal", "academic"

Rules:
- "table_heavy": document contains many tables, spreadsheet-like data, or structured numerical data
- "qa": document is structured as question-answer pairs
- "legal": document contains legal/regulatory text (visa rules, laws, policies)
- "academic": academic papers, course catalogs, syllabi
- "general": everything else

Return ONLY the JSON object, no explanation.`,
        },
        { role: 'user', content: textSample.substring(0, 3000) },
      ],
      temperature: 0,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      return { language: 'en', docType: 'general' };
    }

    const parsed = JSON.parse(content);
    return {
      language: parsed.language || 'en',
      docType: parsed.docType || 'general',
    };
  } catch (error) {
    console.error('[Language] Classification failed:', error);
    return { language: 'en', docType: 'general' };
  }
}

/**
 * Get appropriate chunk overlap based on language and chunk size.
 * Rare languages (km, mn) get 20%+ overlap for better context preservation.
 */
export function getChunkOverlap(language: string, chunkSize: number): number {
  const rareLanguages = ['km', 'mn'];
  if (rareLanguages.includes(language)) {
    return Math.max(Math.ceil(chunkSize * 0.2), 100);
  }
  return Math.max(Math.ceil(chunkSize * 0.1), 50);
}

/**
 * Preprocess Khmer text by inserting spaces at syllable boundaries.
 */
export function preprocessKhmer(text: string): string {
  return text
    .replace(/([\u17B6-\u17D3\u17D4-\u17DD])([\u1780-\u17A2])/g, '$1 $2')
    .replace(/ {2,}/g, ' ');
}

/**
 * Preprocess Mongolian text by normalizing encoding issues.
 */
export function preprocessMongolian(text: string): string {
  return text
    .replace(/\u202F/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\u180E/g, '')
    .replace(/ {2,}/g, ' ');
}

/**
 * Apply language-specific preprocessing to text
 */
export function preprocessByLanguage(text: string, language: string): string {
  switch (language) {
    case 'km':
      return preprocessKhmer(text);
    case 'mn':
      return preprocessMongolian(text);
    default:
      return text;
  }
}
