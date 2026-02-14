'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ConversationList } from '@/features/dashboard/ConversationList';
import { ConversationDetail } from '@/features/dashboard/ConversationDetail';

interface Conversation {
  id: string;
  session_id: string | null;
  language: string;
  channel: string;
  created_at: string;
  message_count: number;
  preview: string;
}

export default function ConversationsPage() {
  const params = useParams();
  const botId = params.botId as string;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const limit = 20;

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set('search', search);
      if (channel) params.set('channel', channel);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(
        `/api/owner/bots/${botId}/conversations?${params.toString()}`
      );
      const json = await res.json();
      if (json.success) {
        setConversations(json.data.conversations);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [botId, page, search, channel, dateFrom, dateTo]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  function handleExportCSV() {
    const headers = ['ID', 'Channel', 'Language', 'Messages', 'Preview', 'Date'];
    const rows = conversations.map((c) => [
      c.id,
      c.channel,
      c.language,
      c.message_count.toString(),
      `"${c.preview.replace(/"/g, '""')}"`,
      new Date(c.created_at).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversations-${botId}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/bots/${botId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Back to bot
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Conversations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={conversations.length === 0}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search messages..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">All Channels</option>
          <option value="web">Web</option>
          <option value="telegram">Telegram</option>
          <option value="api">API</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="text-gray-400 dark:text-gray-500">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Content: list + detail side panel */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Conversation list */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {selectedId ? (
            <ConversationDetail botId={botId} conversationId={selectedId} />
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Select a conversation to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
