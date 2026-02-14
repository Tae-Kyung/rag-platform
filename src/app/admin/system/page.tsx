'use client';

import { useEffect, useState } from 'react';

interface SystemData {
  database: { status: string; error: string | null };
  counts: {
    users: number;
    bots: number;
    documents: number;
    document_chunks: number;
    conversations: number;
  };
  storage: { total_mb: number; total_gb: number };
  errors_24h: number;
  checked_at: string;
}

export default function AdminSystemPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/sys/system-status');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      console.error('Failed to fetch system status');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="py-12 text-center text-gray-500 dark:text-gray-400">Failed to load system status.</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Status</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Last checked: {new Date(data.checked_at).toLocaleString()}
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Service Status */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatusCard
          label="Database"
          status={data.database.status}
          error={data.database.error}
        />
        <StatusCard
          label="Errors (24h)"
          status={data.errors_24h === 0 ? 'healthy' : 'warning'}
          value={data.errors_24h.toString()}
        />
        <StatusCard
          label="Storage"
          status="healthy"
          value={data.storage.total_gb > 0 ? `${data.storage.total_gb} GB` : `${data.storage.total_mb} MB`}
        />
      </div>

      {/* Resource Counts */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Resources</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ResourceItem label="Users" value={data.counts.users} />
          <ResourceItem label="Bots" value={data.counts.bots} />
          <ResourceItem label="Documents" value={data.counts.documents} />
          <ResourceItem label="Chunks (Vector DB)" value={data.counts.document_chunks} />
          <ResourceItem label="Conversations" value={data.counts.conversations} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, status, error, value }: {
  label: string;
  status: string;
  error?: string | null;
  value?: string;
}) {
  const colors: Record<string, { bg: string; dot: string; text: string }> = {
    healthy: { bg: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
    warning: { bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800', dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
    error: { bg: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  };

  const c = colors[status] || colors.healthy;

  return (
    <div className={`rounded-xl border p-5 ${c.bg}`}>
      <div className="flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className={`mt-2 text-lg font-bold ${c.text}`}>
        {value || status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function ResourceItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 px-4 py-3 text-center dark:bg-gray-800">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}
