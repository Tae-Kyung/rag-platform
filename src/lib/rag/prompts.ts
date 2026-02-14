import type { SearchResult } from './search/index';

const AUTO_DETECT_INSTRUCTION = `
IMPORTANT: Detect the language of the user's message and ALWAYS respond in that same language.

CRITICAL: Always answer the user's LATEST message only. Do NOT repeat or reuse answers from previous messages in the conversation.

ACCURACY: You MUST only state facts that are in the provided reference materials. NEVER fabricate or guess specific numbers, statistics, dates, or percentages. If you do not have verified data, clearly say so.`;

export function buildSystemPrompt(
  botName: string,
  botSystemPrompt: string | null,
  language: string,
  searchResults: SearchResult[]
): string {
  // Use bot's custom system prompt, or fallback to generic
  let prompt: string;
  if (botSystemPrompt && botSystemPrompt.trim()) {
    prompt = botSystemPrompt;
  } else {
    prompt = language === 'ko'
      ? `\uB2F9\uC2E0\uC740 ${botName} AI \uC5B4\uC2DC\uC2A4\uD134\uD2B8\uC785\uB2C8\uB2E4.\n\n\uADDC\uCE59:\n- \uCE5C\uC808\uD558\uACE0 \uC815\uD655\uD558\uAC8C \uB2F5\uBCC0\uD558\uC138\uC694.\n- \uC81C\uACF5\uB41C \uCC38\uACE0 \uC790\uB8CC\uB97C \uAE30\uBC18\uC73C\uB85C \uB2F5\uBCC0\uD558\uC138\uC694.\n- \uCC38\uACE0 \uC790\uB8CC\uC5D0 \uC5C6\uB294 \uB0B4\uC6A9\uC740 "\uD574\uB2F9 \uC815\uBCF4\uB294 \uD655\uC778\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."\uB77C\uACE0 \uC548\uB0B4\uD558\uC138\uC694.\n- \uB2F5\uBCC0\uC740 \uAC04\uACB0\uD558\uACE0 \uAD6C\uC870\uC801\uC73C\uB85C \uC791\uC131\uD558\uC138\uC694.`
      : `You are ${botName} AI assistant.\n\nRules:\n- Be friendly and accurate.\n- Base your answers on the provided reference materials.\n- If the information is not in the references, say "This information could not be confirmed."\n- Keep answers concise and well-structured.`;
  }

  prompt += AUTO_DETECT_INSTRUCTION;

  if (searchResults.length > 0) {
    const contextParts = searchResults.map(
      (r, i) => `[Reference ${i + 1}] (similarity: ${(r.similarity * 100).toFixed(0)}%)\n${r.content}`
    );

    const contextHeader = language === 'ko' ? '\uCC38\uACE0 \uC790\uB8CC:' : 'Reference Materials:';
    prompt += `\n\n${contextHeader}\n${contextParts.join('\n\n')}`;
  } else {
    const noContext = language === 'ko'
      ? '\uCC38\uACE0 \uC790\uB8CC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.\n\n\uC911\uC694: \uC808\uB300\uB85C \uC790\uCCB4 \uC9C0\uC2DD\uC774\uB098 \uC77C\uBC18\uC801\uC778 \uC815\uBCF4\uB85C \uB2F5\uBCC0\uD558\uC9C0 \uB9C8\uC138\uC694. "\uD604\uC7AC \uD574\uB2F9 \uC9C8\uBB38\uC5D0 \uB300\uD55C \uCC38\uACE0 \uC790\uB8CC\uAC00 \uB4F1\uB85D\uB418\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."\uB77C\uACE0\uB9CC \uB2F5\uBCC0\uD558\uC138\uC694.'
      : 'No reference materials available.\n\nIMPORTANT: Do NOT answer from your own knowledge. Respond with: "There are currently no reference materials registered for this question."';
    prompt += `\n\n${noContext}`;
  }

  return prompt;
}

export function assessConfidence(searchResults: SearchResult[]): {
  level: 'high' | 'medium' | 'low';
  score: number;
} {
  if (searchResults.length === 0) {
    return { level: 'low', score: 0 };
  }

  const avgSimilarity =
    searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length;
  const topSimilarity = searchResults[0].similarity;

  const score = topSimilarity * 0.6 + avgSimilarity * 0.4;

  if (score >= 0.7) return { level: 'high', score };
  if (score >= 0.4) return { level: 'medium', score };
  return { level: 'low', score };
}
