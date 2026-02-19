import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { verifyDiscordSignature } from '@/lib/channels/discord/api';
import { handleDiscordMessage } from '@/lib/channels/discord/handler';
import {
  InteractionType,
  InteractionResponseType,
  type DiscordInteraction,
} from '@/lib/channels/discord/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/webhooks/discord/[botId]
 * Receives Discord Interactions (slash commands) for a specific bot.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const supabase = createServiceRoleClient();

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Look up channel config for this bot
    const { data: channelConfig } = await supabase
      .from('channel_configs')
      .select('config, is_active')
      .eq('bot_id', botId)
      .eq('channel', 'discord')
      .single();

    if (!channelConfig || !channelConfig.is_active) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const config = channelConfig.config as Record<string, string>;
    const publicKey = config.public_key;

    if (!publicKey) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    // Verify Discord Ed25519 signature
    const signature = request.headers.get('x-signature-ed25519') || '';
    const timestamp = request.headers.get('x-signature-timestamp') || '';

    if (!verifyDiscordSignature(publicKey, signature, timestamp, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction: DiscordInteraction = JSON.parse(rawBody);

    // Handle PING (Discord verification)
    if (interaction.type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle APPLICATION_COMMAND (/ask)
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const question = interaction.data?.options?.[0]?.value;
      const discordUserId = interaction.member?.user?.id || interaction.user?.id;

      if (!question || !discordUserId) {
        return NextResponse.json({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        });
      }

      // Load bot settings
      const { data: bot } = await supabase
        .from('bots')
        .select('name, system_prompt, model, temperature, max_tokens, conversation_history_limit, is_active')
        .eq('id', botId)
        .single();

      if (!bot || !bot.is_active) {
        return NextResponse.json({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        });
      }

      // Process RAG in the background after returning the deferred response
      after(async () => {
        await handleDiscordMessage(question, discordUserId, {
          botId,
          applicationId: config.application_id,
          interactionToken: interaction.token,
          name: bot.name,
          systemPrompt: bot.system_prompt,
          model: bot.model,
          temperature: bot.temperature,
          maxTokens: bot.max_tokens,
          conversationHistoryLimit: bot.conversation_history_limit,
        });
      });

      // Return deferred response immediately (within 3 seconds)
      return NextResponse.json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      });
    }

    // Unknown interaction type
    return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
