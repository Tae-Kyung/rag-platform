'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BotForm } from '@/features/dashboard/BotForm';

interface BotDetail {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string | null;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  document_count: number;
  conversation_count: number;
  created_at: string;
}

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.botId as string;
  const [bot, setBot] = useState<BotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<'settings' | 'knowledge'>('settings');
  const [idCopied, setIdCopied] = useState(false);

  useEffect(() => {
    async function fetchBot() {
      try {
        const res = await fetch(`/api/owner/bots/${botId}`);
        const json = await res.json();
        if (json.success) {
          setBot(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch bot:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBot();
  }, [botId]);

  async function handleDelete() {
    if (!confirm('Delete this bot? All documents, chunks, and conversations will be permanently deleted.')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/owner/bots/${botId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/dashboard');
      }
    } catch {
      alert('Failed to delete bot');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!bot) {
    return <p className="py-12 text-center text-gray-500 dark:text-gray-400">Bot not found.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            &larr; Back to bots
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{bot.name}</h2>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-gray-500">Bot ID:</span>
            <code className="text-xs font-mono text-gray-500 dark:text-gray-400">{botId}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(botId).catch(() => {});
                setIdCopied(true);
                setTimeout(() => setIdCopied(false), 2000);
              }}
              className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              {idCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              bot.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {bot.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="mt-4 flex items-center gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{bot.document_count}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Documents</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{bot.conversation_count}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Conversations</div>
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href={`/dashboard/bots/${botId}/analytics`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Analytics
          </Link>
          <Link
            href={`/dashboard/bots/${botId}/conversations`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Conversations
          </Link>
          <Link
            href={`/chat/${botId}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Test Chat
          </Link>
          <Link
            href={`/dashboard/bots/${botId}/channels`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Channels
          </Link>
          <Link
            href={`/dashboard/bots/${botId}/embed`}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Embed Widget
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab('settings')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setTab('knowledge')}
            className={`border-b-2 pb-3 text-sm font-medium ${
              tab === 'knowledge'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Knowledge Base
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {tab === 'settings' ? (
          <div className="max-w-2xl">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <BotForm
                mode="edit"
                botId={botId}
                initialData={{
                  name: bot.name,
                  description: bot.description || '',
                  system_prompt: bot.system_prompt || '',
                  model: bot.model,
                  temperature: bot.temperature,
                  max_tokens: bot.max_tokens,
                }}
              />
            </div>

            <div className="mt-8 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-6">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Danger Zone</h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Deleting this bot will permanently remove all documents, chunks, and conversations.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Bot'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Link
              href={`/dashboard/bots/${botId}/documents`}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Manage Documents
            </Link>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Upload documents, crawl URLs, and add Q&A pairs to build your knowledge base.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
