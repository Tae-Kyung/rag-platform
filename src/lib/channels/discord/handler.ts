import { searchDocuments } from '@/lib/rag/search';
import { buildSystemPrompt, assessConfidence } from '@/lib/rag/prompts';
import { getOpenAI } from '@/lib/openai/client';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { deduplicateSources } from '@/lib/chat/sources';
import { buildChatMessages } from '@/lib/chat/history';
import { v4 as uuidv4 } from 'uuid';
import { sendFollowupMessage } from './api';

interface BotInfo {
  botId: string;
  applicationId: string;
  interactionToken: string;
  name: string;
  systemPrompt: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  conversationHistoryLimit: number;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  ko: '죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다.',
  en: 'Sorry, I could not find accurate information for your question.',
};

interface UserMapping {
  conversationId: string;
  language: string;
}

async function getOrCreateUserMapping(
  discordUserId: string,
  botInfo: BotInfo
): Promise<UserMapping> {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('discord_user_mappings')
    .select('conversation_id, language')
    .eq('discord_user_id', discordUserId)
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
    .insert({ bot_id: botInfo.botId, channel: 'discord', language: 'en' })
    .select('id')
    .single();

  if (convError || !conv) {
    throw new Error(`Failed to create conversation: ${convError?.message || 'no data'}`);
  }

  await supabase.from('discord_user_mappings').insert({
    discord_user_id: discordUserId,
    bot_id: botInfo.botId,
    conversation_id: conv.id,
    language: 'en',
  });

  return { conversationId: conv.id, language: 'en' };
}

/**
 * Handle an incoming Discord slash command for a specific bot.
 * Processes RAG pipeline and sends follow-up message via Discord REST API.
 */
export async function handleDiscordMessage(
  text: string,
  discordUserId: string,
  botInfo: BotInfo
): Promise<void> {
  try {
    // Get or create user mapping
    const mapping = await getOrCreateUserMapping(discordUserId, botInfo);
    const { conversationId, language } = mapping;

    const supabase = createServiceRoleClient();

    // Save user message
    const userMsgId = uuidv4();
    await supabase.from('messages').insert({
      id: userMsgId,
      conversation_id: conversationId,
      role: 'user',
      content: text,
    });

    // RAG: Search for relevant documents
    const searchResults = await searchDocuments(text, botInfo.botId, { language });

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
    const chatMessages = await buildChatMessages(supabase, conversationId, systemPrompt, botInfo.conversationHistoryLimit);

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
      responseText += '\n\n---\n\n' + (FALLBACK_MESSAGES[language] || FALLBACK_MESSAGES['en']);
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

    // Send follow-up message via Discord REST API
    await sendFollowupMessage(botInfo.applicationId, botInfo.interactionToken, responseText);
  } catch (error) {
    console.error('Discord handler error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    await sendFollowupMessage(
      botInfo.applicationId,
      botInfo.interactionToken,
      `[Error] ${errMsg}`
    ).catch(() => {});
  }
}
