import { searchDocuments } from '@/lib/rag/search';
import { buildSystemPrompt, assessConfidence } from '@/lib/rag/prompts';
import { getOpenAI } from '@/lib/openai/client';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { deduplicateSources } from '@/lib/chat/sources';
import { buildChatMessages } from '@/lib/chat/history';
import { v4 as uuidv4 } from 'uuid';
import type { TelegramMessage } from './types';
import { sendMessage, sendChatAction, sendMessageWithKeyboard, answerCallbackQuery } from './api';

interface BotInfo {
  botId: string;
  token: string;
  name: string;
  systemPrompt: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  conversationHistoryLimit: number;
  suggestedQuestions: string[];
}

const FALLBACK_MESSAGES: Record<string, string> = {
  ko: '죄송합니다. 해당 질문에 대한 정확한 정보를 찾지 못했습니다.',
  en: 'Sorry, I could not find accurate information for your question.',
};

interface ChatMapping {
  conversationId: string;
  language: string;
}

async function getOrCreateChatMapping(
  chatId: number,
  botInfo: BotInfo
): Promise<ChatMapping> {
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from('telegram_chat_mappings')
    .select('conversation_id, language')
    .eq('telegram_chat_id', chatId)
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
    .insert({ bot_id: botInfo.botId, channel: 'telegram', language: 'en' })
    .select('id')
    .single();

  if (convError || !conv) {
    throw new Error(`Failed to create conversation: ${convError?.message || 'no data'}`);
  }

  await supabase.from('telegram_chat_mappings').insert({
    telegram_chat_id: chatId,
    bot_id: botInfo.botId,
    conversation_id: conv.id,
    language: 'en',
  });

  return { conversationId: conv.id, language: 'en' };
}

async function resetConversation(
  chatId: number,
  botInfo: BotInfo
): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({ bot_id: botInfo.botId, channel: 'telegram', language: 'en' })
    .select('id')
    .single();

  if (convError || !conv) {
    throw new Error(`Failed to create conversation: ${convError?.message || 'no data'}`);
  }

  await supabase
    .from('telegram_chat_mappings')
    .update({
      conversation_id: conv.id,
      updated_at: new Date().toISOString(),
    })
    .eq('telegram_chat_id', chatId)
    .eq('bot_id', botInfo.botId);

  return conv.id;
}

async function setLanguage(
  chatId: number,
  botInfo: BotInfo,
  language: string
): Promise<void> {
  const supabase = createServiceRoleClient();
  await getOrCreateChatMapping(chatId, botInfo);

  await supabase
    .from('telegram_chat_mappings')
    .update({
      language,
      updated_at: new Date().toISOString(),
    })
    .eq('telegram_chat_id', chatId)
    .eq('bot_id', botInfo.botId);
}

interface CommandResult {
  text: string;
  suggestedQuestions?: string[];
}

async function handleCommand(
  command: string,
  args: string,
  message: TelegramMessage,
  botInfo: BotInfo
): Promise<CommandResult> {
  switch (command) {
    case '/start': {
      await getOrCreateChatMapping(message.chat.id, botInfo);
      return {
        text: `Hello! I'm ${botInfo.name} AI assistant.\n\nPlease type your question and I'll help you.\n\nCommands:\n/help - Help\n/lang en - Change language (en, ko)\n/new - Start new conversation`,
        suggestedQuestions: botInfo.suggestedQuestions.length > 0 ? botInfo.suggestedQuestions : undefined,
      };
    }

    case '/help': {
      return {
        text: `${botInfo.name} AI Assistant\n\nCommands:\n/help - Show this help\n/lang [code] - Change language (en, ko)\n/new - Start new conversation`,
      };
    }

    case '/lang': {
      const lang = args.trim().toLowerCase();
      if (!lang) {
        return { text: 'Usage: /lang [en|ko]\n\nen=English, ko=한국어' };
      }
      if (!['en', 'ko'].includes(lang)) {
        return { text: `Unsupported language: ${lang}\nSupported: en, ko` };
      }
      await setLanguage(message.chat.id, botInfo, lang);
      return {
        text: lang === 'ko' ? '언어가 한국어로 설정되었습니다.' : 'Language set to English.',
      };
    }

    case '/new': {
      await resetConversation(message.chat.id, botInfo);
      const mapping = await getOrCreateChatMapping(message.chat.id, botInfo);
      return {
        text: mapping.language === 'ko'
          ? '새 대화가 시작되었습니다. 질문을 입력해 주세요.'
          : 'New conversation started. Please type your question.',
        suggestedQuestions: botInfo.suggestedQuestions.length > 0 ? botInfo.suggestedQuestions : undefined,
      };
    }

    default:
      return { text: 'Unknown command. Type /help for available commands.' };
  }
}

/**
 * Handle an incoming Telegram message for a specific bot.
 */
export async function handleTelegramMessage(
  message: TelegramMessage,
  botInfo: BotInfo
): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (!text) return;

  // Send typing indicator
  await sendChatAction(botInfo.token, chatId);

  // Check for bot commands
  if (text.startsWith('/')) {
    const spaceIdx = text.indexOf(' ');
    const command = spaceIdx === -1 ? text : text.slice(0, spaceIdx);
    const args = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1);
    const result = await handleCommand(command, args, message, botInfo);
    if (result.suggestedQuestions && result.suggestedQuestions.length > 0) {
      await sendMessageWithKeyboard(botInfo.token, chatId, result.text, result.suggestedQuestions);
    } else {
      await sendMessage(botInfo.token, chatId, result.text);
    }
    return;
  }

  // Get or create chat mapping
  const mapping = await getOrCreateChatMapping(chatId, botInfo);
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

  // Send response via Telegram
  await sendMessage(botInfo.token, chatId, responseText);
}

/**
 * Handle a Telegram callback query (inline keyboard button press).
 * Used for suggested question buttons (callback_data: "sq:N").
 */
export async function handleCallbackQuery(
  callbackQueryId: string,
  chatId: number,
  data: string,
  botInfo: BotInfo
): Promise<void> {
  // Acknowledge the callback immediately
  await answerCallbackQuery(botInfo.token, callbackQueryId);

  // Parse suggested question index
  if (!data.startsWith('sq:')) return;
  const idx = parseInt(data.slice(3), 10);
  if (isNaN(idx) || idx < 0 || idx >= botInfo.suggestedQuestions.length) return;

  const questionText = botInfo.suggestedQuestions[idx];

  // Send typing indicator
  await sendChatAction(botInfo.token, chatId);

  // Get or create chat mapping
  const mapping = await getOrCreateChatMapping(chatId, botInfo);
  const { conversationId, language } = mapping;

  const supabase = createServiceRoleClient();

  // Save user message
  const userMsgId = uuidv4();
  await supabase.from('messages').insert({
    id: userMsgId,
    conversation_id: conversationId,
    role: 'user',
    content: questionText,
  });

  // RAG: Search for relevant documents
  const searchResults = await searchDocuments(questionText, botInfo.botId, { language });

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

  // Send response via Telegram
  await sendMessage(botInfo.token, chatId, responseText);
}
