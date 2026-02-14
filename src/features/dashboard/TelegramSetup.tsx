'use client';

import { useState } from 'react';

interface TelegramSetupProps {
  botId: string;
  onConnected: () => void;
}

export function TelegramSetup({ botId, onConnected }: TelegramSetupProps) {
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  async function handleConnect() {
    if (!token.trim()) {
      setError('Please enter a bot token');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const res = await fetch(`/api/owner/bots/${botId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'telegram',
          config: { bot_token: token.trim() },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToken('');
        onConnected();
      } else {
        setError(json.error || 'Failed to connect');
      }
    } catch {
      setError('Failed to connect');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Bot Token</label>
        <p className="text-xs text-gray-500">
          Get your bot token from{' '}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            @BotFather
          </a>{' '}
          on Telegram.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="123456789:ABCdef..."
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {connecting ? 'Connecting...' : 'Connect Telegram'}
      </button>
    </div>
  );
}
