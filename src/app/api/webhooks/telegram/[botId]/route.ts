import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { handleTelegramMessage } from '@/lib/channels/telegram/handler';
import { sendMessage } from '@/lib/channels/telegram/api';
import type { TelegramUpdate } from '@/lib/channels/telegram/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/webhooks/telegram/[botId]
 * Receives Telegram updates for a specific bot.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const supabase = createServiceRoleClient();

    // Look up channel config for this bot
    const { data: channelConfig } = await supabase
      .from('channel_configs')
      .select('config, is_active')
      .eq('bot_id', botId)
      .eq('channel', 'telegram')
      .single();

    if (!channelConfig || !channelConfig.is_active) {
      return NextResponse.json({ ok: true }); // silently ignore
    }

    const config = channelConfig.config as Record<string, string>;
    const botToken = config.bot_token;

    if (!botToken) {
      return NextResponse.json({ ok: true });
    }

    // Verify webhook secret
    const webhookSecret = config.webhook_secret;
    if (webhookSecret) {
      const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Load bot settings
    const { data: bot } = await supabase
      .from('bots')
      .select('name, system_prompt, model, temperature, max_tokens, conversation_history_limit, is_active')
      .eq('id', botId)
      .single();

    if (!bot || !bot.is_active) {
      return NextResponse.json({ ok: true });
    }

    const update: TelegramUpdate = await request.json();

    if (update.message?.text) {
      try {
        await handleTelegramMessage(update.message, {
          botId,
          token: botToken,
          name: bot.name,
          systemPrompt: bot.system_prompt,
          model: bot.model,
          temperature: bot.temperature,
          maxTokens: bot.max_tokens,
          conversationHistoryLimit: bot.conversation_history_limit,
        });
      } catch (handlerError) {
        console.error('Telegram handler error:', handlerError);
        const errMsg = handlerError instanceof Error ? handlerError.message : String(handlerError);
        await sendMessage(botToken, update.message.chat.id, `[Error] ${errMsg}`).catch(() => {});
      }
    }

    // Telegram expects 200 OK
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
