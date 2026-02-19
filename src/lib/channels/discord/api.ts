import { createPublicKey, verify } from 'crypto';

const DISCORD_API = 'https://discord.com/api/v10';
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Verify Discord Ed25519 request signature.
 * Uses Node.js built-in crypto (no external dependencies).
 */
export function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  try {
    const key = createPublicKey({
      key: Buffer.concat([
        Buffer.from('302a300506032b6570032100', 'hex'), // Ed25519 SPKI DER prefix
        Buffer.from(publicKey, 'hex'),
      ]),
      format: 'der',
      type: 'spki',
    });

    const message = Buffer.from(timestamp + body);
    const signatureBuffer = Buffer.from(signature, 'hex');

    return verify(null, message, key, signatureBuffer);
  } catch {
    return false;
  }
}

/**
 * Edit the initial deferred response (follow-up message).
 * PATCH /webhooks/{application_id}/{interaction_token}/messages/@original
 */
export async function sendFollowupMessage(
  applicationId: string,
  interactionToken: string,
  content: string
): Promise<void> {
  const parts = splitMessage(content);

  // Edit the original deferred response with the first part
  await fetch(
    `${DISCORD_API}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: parts[0] }),
    }
  );

  // Send additional parts as follow-up messages
  for (let i = 1; i < parts.length; i++) {
    await fetch(
      `${DISCORD_API}/webhooks/${applicationId}/${interactionToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: parts[i] }),
      }
    );
  }
}

/**
 * Register the /ask slash command for a Discord application.
 * PUT /applications/{application_id}/commands (upserts global commands).
 */
export async function registerSlashCommand(
  applicationId: string,
  botToken: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `${DISCORD_API}/applications/${applicationId}/commands`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify({
        name: 'ask',
        description: 'Ask a question to the AI assistant',
        options: [
          {
            name: 'question',
            description: 'Your question',
            type: 3, // STRING
            required: true,
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.message || `HTTP ${res.status}` };
  }

  return { ok: true };
}

/**
 * Split a message to fit Discord's 2000 character limit.
 */
export function splitMessage(text: string, maxLength = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= maxLength) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      parts.push(remaining);
      break;
    }

    let splitIdx = remaining.lastIndexOf('\n', maxLength);
    if (splitIdx === -1 || splitIdx < maxLength / 2) {
      splitIdx = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIdx === -1 || splitIdx < maxLength / 2) {
      splitIdx = maxLength;
    }

    parts.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return parts;
}

/**
 * Generate the bot invite URL for a Discord application.
 */
export function getBotInviteUrl(applicationId: string): string {
  return `https://discord.com/api/oauth2/authorize?client_id=${applicationId}&scope=applications.commands+bot`;
}
