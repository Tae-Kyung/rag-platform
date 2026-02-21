import type { TelegramApiResponse } from './types';

const TELEGRAM_API = 'https://api.telegram.org/bot';
const MAX_MESSAGE_LENGTH = 4096;

async function callTelegramApi(
  token: string,
  method: string,
  body: Record<string, unknown>
): Promise<TelegramApiResponse> {
  const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<TelegramApiResponse>;
}

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
 * Send a message to a Telegram chat. Falls back to plain text if Markdown parsing fails.
 */
export async function sendMessage(
  token: string,
  chatId: number,
  text: string
): Promise<void> {
  const parts = splitMessage(text);
  for (const part of parts) {
    const res = await callTelegramApi(token, 'sendMessage', {
      chat_id: chatId,
      text: part,
      parse_mode: 'Markdown',
    });
    if (!res.ok) {
      await callTelegramApi(token, 'sendMessage', {
        chat_id: chatId,
        text: part,
      });
    }
  }
}

/**
 * Send a message with inline keyboard buttons for suggested questions.
 */
export async function sendMessageWithKeyboard(
  token: string,
  chatId: number,
  text: string,
  questions: string[]
): Promise<void> {
  const inlineKeyboard = questions.map((q, i) => [
    { text: q, callback_data: `sq:${i}` },
  ]);

  const res = await callTelegramApi(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: inlineKeyboard },
  });

  if (!res.ok) {
    await callTelegramApi(token, 'sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  }
}

/**
 * Answer a callback query (removes loading state on button).
 */
export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string
): Promise<void> {
  await callTelegramApi(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
  });
}

/**
 * Send a typing indicator.
 */
export async function sendChatAction(
  token: string,
  chatId: number,
  action: 'typing' = 'typing'
): Promise<void> {
  await callTelegramApi(token, 'sendChatAction', {
    chat_id: chatId,
    action,
  });
}

/**
 * Register a webhook URL for a Telegram bot.
 */
export async function setWebhook(
  token: string,
  url: string,
  secretToken?: string
): Promise<TelegramApiResponse> {
  const body: Record<string, unknown> = { url };
  if (secretToken) {
    body.secret_token = secretToken;
  }
  return callTelegramApi(token, 'setWebhook', body);
}

/**
 * Remove the webhook for a Telegram bot.
 */
export async function deleteWebhook(token: string): Promise<TelegramApiResponse> {
  return callTelegramApi(token, 'deleteWebhook', {});
}
