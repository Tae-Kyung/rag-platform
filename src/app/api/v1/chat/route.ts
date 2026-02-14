import { NextRequest } from 'next/server';
import { authenticateAPIKey, APIKeyError } from '@/lib/auth/api-key';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { checkMessageQuota, incrementMessageCount } from '@/lib/billing/usage';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { searchDocuments } from '@/lib/rag/search';
import { buildSystemPrompt, assessConfidence } from '@/lib/rag/prompts';
import { getOpenAI } from '@/lib/openai/client';
import { deduplicateSources } from '@/lib/chat/sources';
import { buildChatMessages } from '@/lib/chat/history';
import { MAX_MESSAGE_LENGTH } from '@/config/constants';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: false, error, ...extra }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * POST /api/v1/chat
 * Public API for chat. Requires Bearer API key.
 * Body: { bot_id, message, conversation_id?, stream? }
 */
export async function POST(request: NextRequest) {
  let auth;
  try {
    auth = await authenticateAPIKey(request);
  } catch (err) {
    if (err instanceof APIKeyError) {
      return jsonError(err.message, err.status);
    }
    return jsonError('Authentication failed', 401);
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(auth.keyId, auth.plan);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        retry_after: rateLimit.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.reset.toString(),
          'Retry-After': rateLimit.reset.toString(),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { bot_id, message, conversation_id, stream = false } = body;

    if (!bot_id || !message) {
      return jsonError('Missing required fields: bot_id, message', 400);
    }

    if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
      return jsonError(`Message must be a string under ${MAX_MESSAGE_LENGTH} characters`, 400);
    }

    const supabase = createServiceRoleClient();

    // Verify bot exists and belongs to the API key owner
    const { data: bot } = await supabase
      .from('bots')
      .select('*')
      .eq('id', bot_id)
      .eq('user_id', auth.userId)
      .single();

    if (!bot) {
      return jsonError('Bot not found or not owned by this API key', 404);
    }

    if (!bot.is_active) {
      return jsonError('Bot is currently inactive', 403);
    }

    // Message quota check
    const quota = await checkMessageQuota(auth.userId);
    if (!quota.allowed) {
      return jsonError('Monthly message limit reached. Upgrade your plan.', 429);
    }

    // Language detection
    const detectedLang = detectLanguage(message);

    // Create or continue conversation
    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .insert({ bot_id, language: detectedLang, channel: 'api' })
        .select('id')
        .single();
      convId = conv?.id;
    } else {
      // Verify conversation belongs to this bot
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('bot_id', bot_id)
        .single();

      if (!existing) {
        return jsonError('Conversation not found', 404);
      }

      await supabase
        .from('conversations')
        .update({ language: detectedLang })
        .eq('id', convId);
    }

    // Save user message
    const userMsgId = uuidv4();
    await supabase.from('messages').insert({
      id: userMsgId,
      conversation_id: convId,
      role: 'user',
      content: message,
    });

    // RAG search
    const searchResults = await searchDocuments(message, bot_id, {
      language: detectedLang,
    });

    const confidence = assessConfidence(searchResults);

    // Build prompt
    const systemPrompt = buildSystemPrompt(
      bot.name,
      bot.system_prompt,
      detectedLang,
      searchResults
    );

    const chatMessages = await buildChatMessages(supabase, convId, systemPrompt);

    const openai = getOpenAI();

    if (stream) {
      // Streaming SSE response
      const openaiStream = await openai.chat.completions.create({
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
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'meta',
                  conversation_id: convId,
                  message_id: assistantMsgId,
                  confidence: confidence.level,
                })}\n\n`
              )
            );

            for await (const chunk of openaiStream) {
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

            // Sources
            const dbSources = deduplicateSources(searchResults);
            if (dbSources.length > 0) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'sources',
                    sources: dbSources.map((s) => ({
                      title: s.title,
                      similarity: Math.round(s.similarity * 100),
                    })),
                  })}\n\n`
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

            await incrementMessageCount(auth.userId);

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
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      });
    } else {
      // Non-streaming JSON response
      const completion = await openai.chat.completions.create({
        model: bot.model || 'gpt-4o-mini',
        messages: chatMessages,
        max_tokens: bot.max_tokens || 1000,
        temperature: bot.temperature || 0.3,
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      const assistantMsgId = uuidv4();
      const dbSources = deduplicateSources(searchResults);

      // Save assistant message
      await supabase.from('messages').insert({
        id: assistantMsgId,
        conversation_id: convId,
        role: 'assistant',
        content: responseContent,
        sources: dbSources.length > 0 ? dbSources : null,
        tokens_used: completion.usage?.total_tokens ?? null,
      });

      await incrementMessageCount(auth.userId);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            conversation_id: convId,
            message_id: assistantMsgId,
            content: responseContent,
            confidence: confidence.level,
            sources: dbSources.map((s) => ({
              title: s.title,
              similarity: Math.round(s.similarity * 100),
            })),
            usage: {
              total_tokens: completion.usage?.total_tokens ?? 0,
              prompt_tokens: completion.usage?.prompt_tokens ?? 0,
              completion_tokens: completion.usage?.completion_tokens ?? 0,
            },
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      );
    }
  } catch (err) {
    console.error('v1/chat error:', err);
    return jsonError('Internal server error', 500);
  }
}

function detectLanguage(text: string): string {
  const cleaned = text.replace(/[\s\d\p{P}]/gu, '');
  if (!cleaned) return 'en';

  let hangul = 0, cjk = 0, khmer = 0, cyrillic = 0;
  for (const char of cleaned) {
    const code = char.codePointAt(0)!;
    if ((code >= 0xAC00 && code <= 0xD7AF) || (code >= 0x1100 && code <= 0x11FF) || (code >= 0x3130 && code <= 0x318F)) hangul++;
    else if (code >= 0x4E00 && code <= 0x9FFF) cjk++;
    else if (code >= 0x1780 && code <= 0x17FF) khmer++;
    else if (code >= 0x0400 && code <= 0x04FF) cyrillic++;
  }

  const total = cleaned.length;
  if (hangul / total > 0.3) return 'ko';
  if (cjk / total > 0.3) return 'zh';
  if (khmer / total > 0.3) return 'km';
  if (cyrillic / total > 0.3) return 'mn';
  if (/[ăâđêôơưĂÂĐÊÔƠƯàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/.test(text)) return 'vi';
  return 'en';
}
