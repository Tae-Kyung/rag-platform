'use client';

import { useState } from 'react';

interface WhatsAppSetupProps {
  botId: string;
  onConnected: () => void;
}

export function WhatsAppSetup({ botId, onConnected }: WhatsAppSetupProps) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/whatsapp/${botId}`;

  async function handleConnect() {
    if (!phoneNumberId.trim()) {
      setError('Phone Number ID를 입력해 주세요.');
      return;
    }
    if (!accessToken.trim()) {
      setError('Access Token을 입력해 주세요.');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const config: Record<string, string> = {
        phone_number_id: phoneNumberId.trim(),
        access_token: accessToken.trim(),
      };
      if (appSecret.trim()) {
        config.app_secret = appSecret.trim();
      }

      const res = await fetch(`/api/owner/bots/${botId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'whatsapp',
          config,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setPhoneNumberId('');
        setAccessToken('');
        setAppSecret('');
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

  function handleCopyWebhook() {
    navigator.clipboard.writeText(webhookUrl).catch(() => {});
  }

  return (
    <div className="space-y-3">
      {/* Webhook URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Webhook URL
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Meta 앱 설정에서 아래 Webhook URL을 등록하세요.
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
            onClick={handleCopyWebhook}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            복사
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Verify Token은 연결 후 자동 생성되어 표시됩니다.
        </p>
      </div>

      {/* Phone Number ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone Number ID
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Meta Developer Console &gt; WhatsApp &gt; API Setup에서 확인하세요.
        </p>
        <input
          type="text"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="Phone Number ID를 입력하세요"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {/* Access Token */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Access Token
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Permanent access token 또는 temporary token을 입력하세요.
        </p>
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="Access Token을 입력하세요"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {/* App Secret (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          App Secret <span className="text-gray-400">(선택)</span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          웹훅 서명 검증을 위해 입력하면 보안이 강화됩니다.
        </p>
        <input
          type="password"
          value={appSecret}
          onChange={(e) => setAppSecret(e.target.value)}
          placeholder="App Secret (선택)"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
      >
        {connecting ? '연결 중...' : 'WhatsApp 연결'}
      </button>
    </div>
  );
}
