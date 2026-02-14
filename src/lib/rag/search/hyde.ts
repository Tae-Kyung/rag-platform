import { getOpenAI } from '@/lib/openai/client';
import { LLM_MODEL } from '@/config/constants';

/**
 * Generate a hypothetical answer for HyDE (Hypothetical Document Embeddings).
 * The idea: embed a "fake answer" to better match against stored document chunks.
 */
export async function generateHypotheticalAnswer(
  query: string,
  language: string
): Promise<string> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable assistant. Write a concise answer (under 300 characters) to the question below, as if you had access to relevant documentation. Write in the same language as the question.',
        },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const answer = response.choices[0].message.content?.trim();
    if (answer) {
      console.log(`[Search] HyDE generated (${language}): "${answer.substring(0, 80)}..."`);
      return answer;
    }
    return query;
  } catch (error) {
    console.error('[Search] HyDE generation failed, using original query:', error);
    return query;
  }
}

export async function translateToKorean(query: string, language: string): Promise<string> {
  if (language === 'ko') return query;

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Translate the following text to Korean accurately. Keep proper nouns (university names, organization names) in their original form. Output only the translated Korean text.',
        },
        { role: 'user', content: query },
      ],
      temperature: 0,
      max_tokens: 500,
    });
    return response.choices[0].message.content?.trim() || query;
  } catch (error) {
    console.error('[Search] Translation failed, using original query:', error);
    return query;
  }
}
