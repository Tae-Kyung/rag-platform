'use client';

import { useState } from 'react';

interface DiscordSetupProps {
  botId: string;
  onConnected: () => void;
}

export function DiscordSetup({ botId, onConnected }: DiscordSetupProps) {
  const [applicationId, setApplicationId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/discord/${botId}`;
  const inviteUrl = applicationId.trim()
    ? `https://discord.com/api/oauth2/authorize?client_id=${applicationId.trim()}&scope=applications.commands+bot`
    : '';

  async function handleConnect() {
    if (!applicationId.trim()) {
      setError('Application ID를 입력해 주세요.');
      return;
    }
    if (!botToken.trim()) {
      setError('Bot Token을 입력해 주세요.');
      return;
    }
    if (!publicKey.trim()) {
      setError('Public Key를 입력해 주세요.');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const res = await fetch(`/api/owner/bots/${botId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'discord',
          config: {
            application_id: applicationId.trim(),
            bot_token: botToken.trim(),
            public_key: publicKey.trim(),
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setApplicationId('');
        setBotToken('');
        setPublicKey('');
        onConnected();
      } else {
        setError(json.error || '연결에 실패했습니다.');
      }
    } catch {
      setError('연결에 실패했습니다.');
    } finally {
      setConnecting(false);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="space-y-3">
      {/* Interactions Endpoint URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Interactions Endpoint URL
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Discord Developer Portal &gt; Application &gt; General Information에 아래 URL을 등록하세요.
        </p>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={webhookUrl}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
          <button
            type="button"
            onClick={() => handleCopy(webhookUrl)}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            복사
          </button>
        </div>
      </div>

      {/* Bot Invite URL */}
      {inviteUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bot Invite URL
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            이 링크로 봇을 Discord 서버에 추가하세요.
          </p>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
            <button
              type="button"
              onClick={() => handleCopy(inviteUrl)}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              복사
            </button>
          </div>
        </div>
      )}

      {/* Application ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Application ID
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Discord Developer Portal
          </a>
          에서 Application ID를 확인하세요.
        </p>
        <input
          type="text"
          value={applicationId}
          onChange={(e) => setApplicationId(e.target.value)}
          placeholder="Application ID를 입력하세요"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Bot Token */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bot Token
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Discord Developer Portal &gt; Bot 탭에서 Token을 복사하세요.
        </p>
        <input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="Bot Token을 입력하세요"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Public Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Public Key
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Discord Developer Portal &gt; General Information에서 Public Key를 복사하세요.
        </p>
        <input
          type="text"
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="Public Key를 입력하세요"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
      >
        {connecting ? '연결 중...' : 'Discord 연결'}
      </button>
    </div>
  );
}
