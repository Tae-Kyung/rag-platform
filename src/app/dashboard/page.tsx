'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BotCard } from '@/features/dashboard/BotCard';
import { UsageAlertBanner } from '@/features/dashboard/UsageAlertBanner';

interface Bot {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  model: string;
  document_count: number;
  conversation_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [maxBots, setMaxBots] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBots() {
      try {
        const res = await fetch('/api/owner/bots');
        const json = await res.json();
        if (json.success) {
          setBots(json.data.bots);
          setMaxBots(json.data.max_bots);
        }
      } catch (err) {
        console.error('Failed to fetch bots:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBots();
  }, []);

  const canCreateBot = maxBots === -1 || bots.length < maxBots;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <UsageAlertBanner />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Bots</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {bots.length} / {maxBots === -1 ? 'unlimited' : maxBots} bots
          </p>
        </div>
        {canCreateBot ? (
          <Link
            href="/dashboard/bots/new"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Bot
          </Link>
        ) : (
          <div className="text-right">
            <button
              disabled
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed"
            >
              + New Bot
            </button>
            <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
              Bot limit reached. Upgrade your plan.
            </p>
          </div>
        )}
      </div>

      {bots.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400">You haven&apos;t created any bots yet.</p>
          <Link
            href="/dashboard/bots/new"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create your first bot
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  );
}
