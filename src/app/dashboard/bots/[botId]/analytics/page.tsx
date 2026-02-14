'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ConversationChart } from '@/features/dashboard/charts/ConversationChart';
import { ChannelPieChart } from '@/features/dashboard/charts/ChannelPieChart';
import { FeedbackChart } from '@/features/dashboard/charts/FeedbackChart';
import { KeywordCloud } from '@/features/dashboard/charts/KeywordCloud';

interface StatsData {
  period: string;
  summary: {
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    avgRating: number;
    totalFeedback: number;
    positiveFeedback: number;
    negativeFeedback: number;
  };
  dailyConversations: { date: string; count: number }[];
  channelDistribution: { channel: string; count: number }[];
  languageDistribution: { language: string; count: number }[];
  feedbackTrend: { date: string; avg: number; count: number }[];
  topKeywords: { keyword: string; count: number }[];
}

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

export default function AnalyticsPage() {
  const params = useParams();
  const botId = params.botId as string;
  const [period, setPeriod] = useState('7d');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/owner/bots/${botId}/stats?period=${period}`);
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [botId, period]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/bots/${botId}`} className="text-sm text-blue-600 hover:underline">
            &larr; Back to bot
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Analytics</h2>
        </div>
        <div className="flex rounded-lg border border-gray-300 bg-white">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm font-medium ${
                period === p.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              } first:rounded-l-lg last:rounded-r-lg`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Conversations"
              value={stats.summary.totalConversations.toLocaleString()}
            />
            <KpiCard
              label="Total Messages"
              value={stats.summary.totalMessages.toLocaleString()}
            />
            <KpiCard
              label="Avg Rating"
              value={stats.summary.totalFeedback > 0 ? `${stats.summary.avgRating}/5` : 'N/A'}
              sub={stats.summary.totalFeedback > 0 ? `${stats.summary.totalFeedback} ratings` : undefined}
            />
            <KpiCard
              label="Tokens Used"
              value={stats.summary.totalTokens.toLocaleString()}
            />
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ConversationChart data={stats.dailyConversations} />
            <ChannelPieChart data={stats.channelDistribution} />
            <FeedbackChart data={stats.feedbackTrend} />
            <KeywordCloud data={stats.topKeywords} />
          </div>

          {/* Language Distribution */}
          {stats.languageDistribution.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium text-gray-700">Language Distribution</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {stats.languageDistribution.map((l) => (
                  <div
                    key={l.language}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-center"
                  >
                    <div className="text-lg font-bold text-gray-900">{l.count}</div>
                    <div className="text-xs text-gray-500">{l.language.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mt-12 text-center text-gray-500">Failed to load analytics.</p>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
