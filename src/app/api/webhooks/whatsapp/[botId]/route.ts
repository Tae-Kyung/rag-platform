import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { handleWhatsAppMessage } from '@/lib/channels/whatsapp/handler';
import type { WhatsAppWebhookPayload } from '@/lib/channels/whatsapp/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Verify HMAC SHA-256 signature from Meta webhook.
 */
function verifySignature(body: string, signature: string | null, appSecret: string): boolean {
  if (!signature) return false;

  // In edge/serverless, use Web Crypto API
  // signature format: "sha256=<hex>"
  const expectedPrefix = 'sha256=';
  if (!signature.startsWith(expectedPrefix)) return false;

  // For serverless environments without Node.js crypto, we do a timing-safe comparison
  // using the Web Crypto API via SubtleCrypto
  // However, since this runs in Node.js runtime on Vercel, we can use crypto
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', appSecret);
    hmac.update(body);
    const expected = expectedPrefix + hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

/**
 * GET /api/webhooks/whatsapp/[botId]
 * Meta webhook verification (subscribe mode).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !token || !challenge) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Look up the verify token from channel config
  const supabase = createServiceRoleClient();
  const { data: channelConfig } = await supabase
    .from('channel_configs')
    .select('config')
    .eq('bot_id', botId)
    .eq('channel', 'whatsapp')
    .single();

  if (!channelConfig) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const config = channelConfig.config as Record<string, string>;
  if (token !== config.verify_token) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Return the challenge to complete verification
  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

/**
 * POST /api/webhooks/whatsapp/[botId]
 * Receives WhatsApp Cloud API webhook events.
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
      .eq('channel', 'whatsapp')
      .single();

    if (!channelConfig || !channelConfig.is_active) {
      return NextResponse.json({ status: 'ok' });
    }

    const config = channelConfig.config as Record<string, string>;
    const accessToken = config.access_token;
    const phoneNumberId = config.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ status: 'ok' });
    }

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify signature if app_secret is configured
    if (config.app_secret) {
      const signature = request.headers.get('x-hub-signature-256');
      if (!verifySignature(rawBody, signature, config.app_secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Load bot settings
    const { data: bot } = await supabase
      .from('bots')
      .select('name, system_prompt, model, temperature, max_tokens, is_active')
      .eq('id', botId)
      .single();

    if (!bot || !bot.is_active) {
      return NextResponse.json({ status: 'ok' });
    }

    const payload: WhatsAppWebhookPayload = JSON.parse(rawBody);

    // Process each message in the webhook payload
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages ?? [];
        for (const message of messages) {
          // Only handle text messages
          if (message.type === 'text' && message.text?.body) {
            try {
              await handleWhatsAppMessage(message, {
                botId,
                accessToken,
                phoneNumberId,
                name: bot.name,
                systemPrompt: bot.system_prompt,
                model: bot.model,
                temperature: bot.temperature,
                maxTokens: bot.max_tokens,
              });
            } catch (handlerError) {
              console.error('WhatsApp handler error:', handlerError);
            }
          }
        }
      }
    }

    // WhatsApp expects 200 OK
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ status: 'ok' });
  }
}
