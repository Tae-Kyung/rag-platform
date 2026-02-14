import { searchDocuments } from '@/lib/rag/search';
import { buildSystemPrompt, assessConfidence } from '@/lib/rag/prompts';
import { getOpenAI } from '@/lib/openai/client';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { deduplicateSources } from '@/lib/chat/sources';
import { buildChatMessages } from '@/lib/chat/history';
import { v4 as uuidv4 } from 'uuid';

const KAKAO_MAX_TEXT_LENGTH = 1000;
const KAKAO_TIMEOUT_MS = 4500;

interface BotInfo {
  botId: string;
  name: string;
  systemPrompt: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface UserMapping {
  conversationId: string;
  language: string;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  ko: '죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다.',
  en: 'Sorry, I could not find accurate information for your question.',
};

const TIMEOUT_MESSAGE = '죄송합니다. 응답 생성에 시간이 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요.';

async function getOrCreateUserMapping(
  kakaoUserId: string,
  botInfo: BotInfo
): Promise<UserMapping> {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('kakao_user_mappings')
    .select('conversation_id, language')
    .eq('kakao_user_id', kakaoUserId)
    .eq('bot_id', botInfo.botId)
    .single();

  if (existing) {
    return {
      conversationId: existing.conversation_id,
      language: existing.language,
    };
  }

  // Create new conversation
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({ bot_id: botInfo.botId, channel: 'kakao', language: 'ko' })
    .select('id')
    .single();

  if (convError || !conv) {
    throw new Error(`Failed to create conversation: ${convError?.message || 'no data'}`);
  }

  await supabase.from('kakao_user_mappings').insert({
    kakao_user_id: kakaoUserId,
    bot_id: botInfo.botId,
    conversation_id: conv.id,
    language: 'ko',
  });

  return { conversationId: conv.id, language: 'ko' };
}

/**
 * Truncate text for KakaoTalk simpleText (max 1000 chars).
 * Cuts at sentence boundary (., !, ?, 。) when possible.
 */
export function truncateForKakao(text: string, maxLength: number = KAKAO_MAX_TEXT_LENGTH): string {
  if (text.length <= maxLength) return text;

  const ellipsis = '...';
  const limit = maxLength - ellipsis.length;
  const truncated = text.slice(0, limit);

  // Try to find a sentence boundary to cut at
  const sentenceEndRegex = /[.!?。]\s*/g;
  let lastSentenceEnd = -1;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndRegex.exec(truncated)) !== null) {
    lastSentenceEnd = match.index + match[0].length;
  }

  // Use sentence boundary if it's in the latter half of the text
  if (lastSentenceEnd > limit * 0.5) {
    return truncated.slice(0, lastSentenceEnd).trimEnd() + ellipsis;
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > limit * 0.5) {
    return truncated.slice(0, lastSpace).trimEnd() + ellipsis;
  }

  return truncated + ellipsis;
}

/**
 * Handle a KakaoTalk message and return the response text.
 */
export async function handleKakaoMessage(
  utterance: string,
  kakaoUserId: string,
  botInfo: BotInfo
): Promise<string> {
  const mapping = await getOrCreateUserMapping(kakaoUserId, botInfo);
  const { conversationId, language } = mapping;

  const supabase = createServiceRoleClient();

  // Save user message
  const userMsgId = uuidv4();
  await supabase.from('messages').insert({
    id: userMsgId,
    conversation_id: conversationId,
    role: 'user',
    content: utterance,
  });

  // RAG: Search for relevant documents
  const searchResults = await searchDocuments(utterance, botInfo.botId, { language });

  // Assess confidence
  const confidence = assessConfidence(searchResults);

  // Build system prompt with context
  const systemPrompt = buildSystemPrompt(
    botInfo.name,
    botInfo.systemPrompt,
    language,
    searchResults
  );

  // Get conversation history
  const chatMessages = await buildChatMessages(supabase, conversationId, systemPrompt);

  // Non-streaming OpenAI call
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: botInfo.model,
    messages: chatMessages,
    stream: false,
    max_tokens: botInfo.maxTokens,
    temperature: botInfo.temperature,
  });

  let responseText = completion.choices[0]?.message?.content || '';

  // Strip any followups marker or LLM-generated sources block
  responseText = responseText.replace(/\s*<!--followups:\[[\s\S]*?\]-->\s*$/, '').trimEnd();
  responseText = responseText.replace(/\s*📚\s*Sources?:[\s\S]*$/, '').trimEnd();

  // If confidence is low and no results, append fallback
  if (confidence.level === 'low' && searchResults.length === 0) {
    responseText += '\n\n' + (FALLBACK_MESSAGES[language] || FALLBACK_MESSAGES['ko']);
  }

  // Append sources inline
  const dbSources = deduplicateSources(searchResults);
  if (dbSources.length > 0) {
    const sourcesList = dbSources
      .slice(0, 3)
      .map((s, i) => `${i + 1}. ${s.title} (${Math.round(s.similarity * 100)}%)`)
      .join('\n');
    responseText += `\n\n📚 Sources:\n${sourcesList}`;
  }

  // Save assistant message
  const assistantMsgId = uuidv4();
  await supabase.from('messages').insert({
    id: assistantMsgId,
    conversation_id: conversationId,
    role: 'assistant',
    content: responseText,
    sources: dbSources.length > 0 ? dbSources : null,
  });

  // Truncate for KakaoTalk's 1000-char limit
  return truncateForKakao(responseText);
}

/**
 * Handle a KakaoTalk message with a timeout guard.
 * Kakao Open Builder has a 5-second timeout — we use 4.5s to leave margin.
 */
export async function handleKakaoMessageWithTimeout(
  utterance: string,
  kakaoUserId: string,
  botInfo: BotInfo
): Promise<string> {
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => resolve(TIMEOUT_MESSAGE), KAKAO_TIMEOUT_MS);
  });

  return Promise.race([
    handleKakaoMessage(utterance, kakaoUserId, botInfo),
    timeoutPromise,
  ]);
}
