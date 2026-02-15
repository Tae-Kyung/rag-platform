import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { searchDocuments } from '@/lib/rag/search';
import { buildSystemPrompt, assessConfidence } from '@/lib/rag/prompts';
import { getOpenAI } from '@/lib/openai/client';
import { deduplicateSources } from '@/lib/chat/sources';
import { buildChatMessages } from '@/lib/chat/history';
import { checkMessageQuota, incrementMessageCount } from '@/lib/billing/usage';
import { MAX_MESSAGE_LENGTH } from '@/config/constants';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function detectLanguage(text: string): string {
  const cleaned = text.replace(/[\s\d\p{P}]/gu, '');
  if (!cleaned) return 'ko';

  let hangul = 0, cjk = 0, khmer = 0, cyrillic = 0;

  for (const char of cleaned) {
    const code = char.codePointAt(0)!;
    if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF) || (code >= 0x3130 && code <= 0x318F)) {
      hangul++;
    } else if (code >= 0x4E00 && code <= 0x9FFF) {
      cjk++;
    } else if (code >= 0x1780 && code <= 0x17FF) {
      khmer++;
    } else if (code >= 0x0400 && code <= 0x04FF) {
      cyrillic++;
    }
  }

  const total = cleaned.length;
  if (hangul / total > 0.3) return 'ko';
  if (cjk / total > 0.3) return 'zh';
  if (khmer / total > 0.3) return 'km';
  if (cyrillic / total > 0.3) return 'mn';
  if (/[ăâđêôơưĂÂĐÊÔƠƯàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/.test(text)) return 'vi';

  return 'en';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bot_id, message, language = 'en', conversation_id } = body;

    if (!bot_id || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createServiceRoleClient();

    // Get bot info
    const { data: bot } = await supabase
      .from('bots')
      .select('*')
      .eq('id', bot_id)
      .single();

    if (!bot) {
      return new Response(
        JSON.stringify({ success: false, error: 'Bot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!bot.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'This bot is currently inactive.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check bot owner's message quota
    const quota = await checkMessageQuota(bot.user_id);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message limit reached. The bot owner needs to upgrade their plan.',
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Detect language from message
    const detectedLang = detectLanguage(message);

    // Create or get conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ bot_id, language: detectedLang })
        .select('id')
        .single();
      convId = conv?.id;
    } else {
      // Verify conversation belongs to this bot
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('bot_id', bot_id)
        .single();

      if (!existingConv) {
        // Conversation doesn't belong to this bot — create a new one
        const { data: conv } = await supabase
          .from('conversations')
          .insert({ bot_id, language: detectedLang })
          .select('id')
          .single();
        convId = conv?.id;
      } else {
        await supabase
          .from('conversations')
          .update({ language: detectedLang })
          .eq('id', convId);
      }
    }

    // Save user message
    const userMsgId = uuidv4();
    await supabase.from('messages').insert({
      id: userMsgId,
      conversation_id: convId,
      role: 'user',
      content: message,
    });

    // RAG: Search for relevant documents
    console.log(`[Chat] Query: "${message}" | Bot: ${bot_id} | Language: ${detectedLang}`);
    const searchResults = await searchDocuments(message, bot_id, {
      language: detectedLang,
    });
    console.log(`[Chat] Search results: ${searchResults.length} found`);

    const confidence = assessConfidence(searchResults);

    // Build system prompt with bot settings + RAG context
    const systemPrompt = buildSystemPrompt(
      bot.name,
      bot.system_prompt,
      detectedLang,
      searchResults
    );

    // Get conversation history
    const chatMessages = await buildChatMessages(supabase, convId, systemPrompt, bot.conversation_history_limit);

    // Stream response from OpenAI using bot's model settings
    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: bot.model || 'gpt-4o-mini',
      messages: chatMessages,
      stream: true,
      max_tokens: bot.max_tokens || 1000,
      temperature: bot.temperature || 0.3,
    });

    const encoder = new TextEncoder();
    let fullResponse = '';
    const assistantMsgId = uuidv4();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send metadata first
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'meta',
                conversationId: convId,
                messageId: assistantMsgId,
                confidence: confidence.level,
              })}\n\n`
            )
          );

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'content', content })}\n\n`
                )
              );
            }
          }

          // Send sources if available
          const dbSources = deduplicateSources(searchResults);
          if (dbSources.length > 0) {
            const sources = dbSources.map(s => ({
              title: s.title,
              similarity: Math.round(s.similarity * 100),
            }));
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'sources', sources })}\n\n`
              )
            );
          }

          // Save assistant message
          await supabase.from('messages').insert({
            id: assistantMsgId,
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse,
            sources: dbSources.length > 0 ? dbSources : null,
          });

          // Increment usage
          await incrementMessageCount(bot.user_id);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Stream error' })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
