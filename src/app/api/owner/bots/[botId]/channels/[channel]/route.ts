import { NextRequest } from 'next/server';
import { requireOwner, AuthError } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { deleteWebhook, setWebhook } from '@/lib/channels/telegram/api';
import { successResponse, errorResponse } from '@/lib/api/response';

/**
 * PUT /api/owner/bots/[botId]/channels/[channel]
 * Update a channel config (e.g., toggle active, update token).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string; channel: string }> }
) {
  try {
    const { botId, channel } = await params;
    await requireOwner(botId);
    const supabase = await createClient();

    const body = await request.json();

    // Get existing config
    const { data: existing } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('bot_id', botId)
      .eq('channel', channel)
      .single();

    if (!existing) {
      return errorResponse(`${channel} channel not found`, 404);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    if (body.config) {
      // For Telegram: re-register webhook if token changes
      if (channel === 'telegram' && body.config.bot_token) {
        const existingConfig = existing.config as Record<string, string>;
        const oldToken = existingConfig.bot_token;
        const newToken = body.config.bot_token;

        if (oldToken && oldToken !== newToken) {
          // Remove old webhook
          await deleteWebhook(oldToken).catch(() => {});

          // Set new webhook
          const webhookSecret = crypto.randomUUID();
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const webhookUrl = `${appUrl}/api/webhooks/telegram/${botId}`;

          const result = await setWebhook(newToken, webhookUrl, webhookSecret);
          if (!result.ok) {
            return errorResponse(`Failed to set Telegram webhook: ${result.description}`, 400);
          }

          updateData.config = {
            bot_token: newToken,
            webhook_secret: webhookSecret,
            webhook_url: webhookUrl,
          };
        }
      } else {
        updateData.config = body.config;
      }
    }

    const { data: updated, error } = await supabase
      .from('channel_configs')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse(updated);
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse('Failed to update channel', 500);
  }
}

/**
 * DELETE /api/owner/bots/[botId]/channels/[channel]
 * Remove a channel from the bot.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ botId: string; channel: string }> }
) {
  try {
    const { botId, channel } = await params;
    await requireOwner(botId);
    const supabase = await createClient();

    // Get existing config
    const { data: existing } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('bot_id', botId)
      .eq('channel', channel)
      .single();

    if (!existing) {
      return errorResponse(`${channel} channel not found`, 404);
    }

    // For Telegram: remove webhook before deleting config
    if (channel === 'telegram') {
      const config = existing.config as Record<string, string>;
      if (config.bot_token) {
        await deleteWebhook(config.bot_token).catch(() => {});
      }
    }

    // For KakaoTalk: clean up user mappings
    if (channel === 'kakao') {
      const serviceClient = createServiceRoleClient();
      await serviceClient
        .from('kakao_user_mappings')
        .delete()
        .eq('bot_id', botId);
    }

    // For WhatsApp: clean up user mappings
    if (channel === 'whatsapp') {
      const serviceClient = createServiceRoleClient();
      await serviceClient
        .from('whatsapp_user_mappings')
        .delete()
        .eq('bot_id', botId);
    }

    // For Discord: clean up user mappings
    if (channel === 'discord') {
      const serviceClient = createServiceRoleClient();
      await serviceClient
        .from('discord_user_mappings')
        .delete()
        .eq('bot_id', botId);
    }

    const { error } = await supabase
      .from('channel_configs')
      .delete()
      .eq('id', existing.id);

    if (error) return errorResponse(error.message, 500);
    return successResponse({ message: `${channel} channel removed` });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse('Failed to delete channel', 500);
  }
}
