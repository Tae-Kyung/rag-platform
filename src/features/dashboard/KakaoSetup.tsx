'use client';

import { useState } from 'react';

interface KakaoSetupProps {
  botId: string;
  onConnected: () => void;
}

export function KakaoSetup({ botId, onConnected }: KakaoSetupProps) {
  const [appKey, setAppKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/kakao/${botId}`;

  async function handleConnect() {
    if (!appKey.trim()) {
      setError('REST API 키를 입력해 주세요.');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const res = await fetch(`/api/owner/bots/${botId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'kakao',
          config: { app_key: appKey.trim() },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setAppKey('');
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
          Webhook URL (스킬 서버 URL)
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          카카오 i 오픈빌더에서 스킬 설정 시 아래 URL을 입력하세요.
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
      </div>

      {/* App Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          REST API 키
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <a
            href="https://developers.kakao.com/console/app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            카카오 개발자 콘솔
          </a>
          에서 애플리케이션의 REST API 키를 확인하세요.
        </p>
        <input
          type="password"
          value={appKey}
          onChange={(e) => setAppKey(e.target.value)}
          placeholder="REST API 키를 입력하세요"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-yellow-500 disabled:opacity-50"
      >
        {connecting ? '연결 중...' : '카카오톡 연결'}
      </button>
    </div>
  );
}
