import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { setWebhook } from '@/lib/channels/telegram/api';
import { checkChannelAccess } from '@/lib/billing/plan-guard';
import { successResponse, errorResponse } from '@/lib/api/response';
import type { BotChannel } from '@/types';

/**
 * GET /api/owner/bots/[botId]/channels
 * List channel configs for a bot.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    await requireOwner(botId);
    const supabase = await createClient();

    const { data: channels, error } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false });

    if (error) return errorResponse(error.message, 500);

    return successResponse(channels ?? []);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse('Failed to fetch channels', 500);
  }
}

/**
 * POST /api/owner/bots/[botId]/channels
 * Add a channel to the bot (e.g., Telegram).
 * Body: { channel: 'telegram', config: { bot_token: '...' } }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { botId } = await params;
    const user = await requireOwner(botId);
    const supabase = await createClient();

    const body = await request.json();
    const { channel, config } = body;

    if (!channel || !config) {
      return errorResponse('channel and config are required', 400);
    }

    if (!['telegram', 'kakao', 'whatsapp', 'wechat', 'api'].includes(channel)) {
      return errorResponse('Invalid channel type', 400);
    }

    // Check plan channel access
    const hasAccess = await checkChannelAccess(user.id, channel as BotChannel);
    if (!hasAccess) {
      return errorResponse(`${channel} channel requires a higher plan. Please upgrade.`, 403);
    }

    // Check if channel already exists for this bot
    const { data: existing } = await supabase
      .from('channel_configs')
      .select('id')
      .eq('bot_id', botId)
      .eq('channel', channel)
      .single();

    if (existing) {
      return errorResponse(`${channel} channel already configured for this bot`, 409);
    }

    // For Telegram: validate token and register webhook
    if (channel === 'telegram') {
      const botToken = config.bot_token;
      if (!botToken || typeof botToken !== 'string') {
        return errorResponse('bot_token is required for Telegram', 400);
      }

      // Generate a webhook secret for this bot
      const webhookSecret = crypto.randomUUID();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const webhookUrl = `${appUrl}/api/webhooks/telegram/${botId}`;

      // Register webhook with Telegram
      const result = await setWebhook(botToken, webhookUrl, webhookSecret);
      if (!result.ok) {
        return errorResponse(`Failed to set Telegram webhook: ${result.description}`, 400);
      }

      // Store config with secret (token is stored encrypted-at-rest in DB)
      const { data: created, error } = await supabase
        .from('channel_configs')
        .insert({
          bot_id: botId,
          channel: 'telegram',
          config: {
            bot_token: botToken,
            webhook_secret: webhookSecret,
            webhook_url: webhookUrl,
          },
          is_active: true,
        })
        .select()
        .single();

      if (error) return errorResponse(error.message, 500);
      return successResponse(created, 201);
    }

    // For KakaoTalk: validate app_key and store webhook URL
    if (channel === 'kakao') {
      const appKey = config.app_key;
      if (!appKey || typeof appKey !== 'string') {
        return errorResponse('app_key (REST API 키) is required for KakaoTalk', 400);
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const webhookUrl = `${appUrl}/api/webhooks/kakao/${botId}`;

      const { data: created, error } = await supabase
        .from('channel_configs')
        .insert({
          bot_id: botId,
          channel: 'kakao',
          config: {
            app_key: appKey,
            webhook_url: webhookUrl,
          },
          is_active: true,
        })
        .select()
        .single();

      if (error) return errorResponse(error.message, 500);
      return successResponse(created, 201);
    }

    // For WhatsApp: validate access_token and phone_number_id, generate verify_token
    if (channel === 'whatsapp') {
      const accessToken = config.access_token;
      const phoneNumberId = config.phone_number_id;
      const appSecret = config.app_secret; // optional

      if (!accessToken || typeof accessToken !== 'string') {
        return errorResponse('access_token is required for WhatsApp', 400);
      }
      if (!phoneNumberId || typeof phoneNumberId !== 'string') {
        return errorResponse('phone_number_id is required for WhatsApp', 400);
      }

      const verifyToken = crypto.randomUUID();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const webhookUrl = `${appUrl}/api/webhooks/whatsapp/${botId}`;

      const configData: Record<string, string> = {
        access_token: accessToken,
        phone_number_id: phoneNumberId,
        verify_token: verifyToken,
        webhook_url: webhookUrl,
      };
      if (appSecret && typeof appSecret === 'string') {
        configData.app_secret = appSecret;
      }

      const { data: created, error } = await supabase
        .from('channel_configs')
        .insert({
          bot_id: botId,
          channel: 'whatsapp',
          config: configData,
          is_active: true,
        })
        .select()
        .single();

      if (error) return errorResponse(error.message, 500);
      return successResponse(created, 201);
    }

    // Generic channel config (wechat, api)
    const { data: created, error } = await supabase
      .from('channel_configs')
      .insert({
        bot_id: botId,
        channel,
        config,
        is_active: true,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse(created, 201);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    console.error('Create channel error:', err);
    return errorResponse('Failed to create channel', 500);
  }
}
