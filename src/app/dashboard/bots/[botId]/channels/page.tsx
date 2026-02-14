'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChannelCard } from '@/features/dashboard/ChannelCard';
import { TelegramSetup } from '@/features/dashboard/TelegramSetup';
import { KakaoSetup } from '@/features/dashboard/KakaoSetup';

interface ChannelConfig {
  id: string;
  channel: string;
  is_active: boolean;
  config: Record<string, string>;
  created_at: string;
}

export default function ChannelsPage() {
  const params = useParams();
  const botId = params.botId as string;
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch(`/api/owner/bots/${botId}/channels`);
      const json = await res.json();
      if (json.success) {
        setChannels(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const telegramConfig = channels.find((c) => c.channel === 'telegram');
  const kakaoConfig = channels.find((c) => c.channel === 'kakao');

  async function handleDisconnect(channel: string) {
    if (!confirm(`Disconnect ${channel}? The webhook will be removed.`)) return;

    try {
      const res = await fetch(`/api/owner/bots/${botId}/channels/${channel}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        await fetchChannels();
      } else {
        alert(json.error || 'Failed to disconnect');
      }
    } catch {
      alert('Failed to disconnect');
    }
  }

  async function handleToggle(channel: string, active: boolean) {
    try {
      const res = await fetch(`/api/owner/bots/${botId}/channels/${channel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchChannels();
      }
    } catch {
      alert('Failed to toggle channel');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/dashboard/bots/${botId}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to bot
        </Link>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Channels</h2>
        <p className="mt-1 text-sm text-gray-500">
          Connect your bot to messaging platforms.
        </p>
      </div>

      <div className="space-y-4">
        {/* Telegram */}
        <ChannelCard
          name="Telegram"
          description="Connect your bot to Telegram for instant messaging."
          icon={
            <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          }
          isConnected={!!telegramConfig}
          isActive={telegramConfig?.is_active}
          onToggle={(active) => handleToggle('telegram', active)}
          onDisconnect={() => handleDisconnect('telegram')}
        >
          {!telegramConfig && (
            <TelegramSetup botId={botId} onConnected={fetchChannels} />
          )}
          {telegramConfig && (
            <div className="text-sm text-gray-500">
              <p>
                Token: <code className="text-gray-700">{telegramConfig.config.bot_token?.slice(0, 8)}...</code>
              </p>
              <p className="mt-1">
                Connected {new Date(telegramConfig.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </ChannelCard>

        {/* KakaoTalk */}
        <ChannelCard
          name="KakaoTalk"
          description="Connect to KakaoTalk for Korean users."
          icon={
            <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.5 0 10 3.58 10 8s-4.5 8-10 8c-.84 0-1.65-.09-2.43-.25L5.5 21l1.09-3.27C4.39 16.17 2 13.82 2 11c0-4.42 4.5-8 10-8z" />
            </svg>
          }
          isConnected={!!kakaoConfig}
          isActive={kakaoConfig?.is_active}
          onToggle={(active) => handleToggle('kakao', active)}
          onDisconnect={() => handleDisconnect('kakao')}
        >
          {!kakaoConfig && (
            <KakaoSetup botId={botId} onConnected={fetchChannels} />
          )}
          {kakaoConfig && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                REST API 키: <code className="text-gray-700 dark:text-gray-300">{kakaoConfig.config.app_key?.slice(0, 8)}...</code>
              </p>
              <div className="mt-1">
                <p className="text-xs text-gray-400">Webhook URL:</p>
                <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                  {kakaoConfig.config.webhook_url}
                </code>
              </div>
              <p className="mt-1">
                Connected {new Date(kakaoConfig.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </ChannelCard>

        {/* WeChat — Locked */}
        <ChannelCard
          name="WeChat"
          description="Connect to WeChat for Chinese users."
          icon={
            <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.832.398c.164 0 .325-.013.486-.018a6.627 6.627 0 01-.273-1.869c0-3.721 3.5-6.736 7.819-6.736.235 0 .467.013.698.028C16.739 4.66 13.038 2.188 8.691 2.188z" />
            </svg>
          }
          isConnected={false}
          isLocked={true}
          lockedMessage="Available on Pro plan and above."
        />
      </div>
    </div>
  );
}
