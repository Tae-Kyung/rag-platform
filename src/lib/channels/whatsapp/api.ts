import type { WhatsAppSendResponse } from './types';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';
const MAX_MESSAGE_LENGTH = 4096;

export function splitMessage(text: string): string[] {
  if (text.length <= MAX_MESSAGE_LENGTH) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_MESSAGE_LENGTH) {
      parts.push(remaining);
      break;
    }

    let splitIdx = remaining.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
    if (splitIdx === -1 || splitIdx < MAX_MESSAGE_LENGTH / 2) {
      splitIdx = remaining.lastIndexOf(' ', MAX_MESSAGE_LENGTH);
    }
    if (splitIdx === -1 || splitIdx < MAX_MESSAGE_LENGTH / 2) {
      splitIdx = MAX_MESSAGE_LENGTH;
    }

    parts.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return parts;
}

/**
 * Send a text message via WhatsApp Cloud API.
 */
export async function sendTextMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  text: string
): Promise<void> {
  const parts = splitMessage(text);
  for (const part of parts) {
    const res = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: part },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('WhatsApp send message error:', res.status, errorBody);
    }
  }
}

/**
 * Mark a message as read.
 */
export async function markAsRead(
  accessToken: string,
  phoneNumberId: string,
  messageId: string
): Promise<void> {
  await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
}
