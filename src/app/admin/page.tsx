'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SystemStatus {
  counts: {
    users: number;
    bots: number;
    documents: number;
    document_chunks: number;
    conversations: number;
  };
  errors_24h: number;
}

interface Revenue {
  mrr: number;
  totalSubscribers: number;
}

interface Traffic {
  totalMessages: number;
  dailyMessages: { date: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [traffic, setTraffic] = useState<Traffic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statusRes, revenueRes, trafficRes] = await Promise.all([
          fetch('/api/sys/system-status'),
          fetch('/api/sys/revenue'),
          fetch('/api/sys/traffic?period=7d'),
        ]);

        const [statusJson, revenueJson, trafficJson] = await Promise.all([
          statusRes.json(),
          revenueRes.json(),
          trafficRes.json(),
        ]);

        if (statusJson.success) setStatus(statusJson.data);
        if (revenueJson.success) setRevenue(revenueJson.data);
        if (trafficJson.success) setTraffic(trafficJson.data);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      <p className="mt-1 text-sm text-gray-500">System overview</p>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Users" value={status?.counts.users ?? 0} />
        <KpiCard
          label="MRR"
          value={`$${(revenue?.mrr ?? 0).toLocaleString()}`}
          sub={`${revenue?.totalSubscribers ?? 0} subscribers`}
        />
        <KpiCard
          label="Messages (7d)"
          value={traffic?.totalMessages ?? 0}
        />
        <KpiCard
          label="Active Bots"
          value={status?.counts.bots ?? 0}
          sub={`${status?.errors_24h ?? 0} errors (24h)`}
        />
      </div>

      {/* Mini Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 7-day messages */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">Messages (7 days)</h3>
          <div className="mt-4 h-48">
            {traffic?.dailyMessages && traffic.dailyMessages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={traffic.dailyMessages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Messages" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">System Resources</h3>
          <div className="mt-4 space-y-3">
            <ResourceRow label="Documents" value={status?.counts.documents ?? 0} />
            <ResourceRow label="Document Chunks" value={status?.counts.document_chunks ?? 0} />
            <ResourceRow label="Conversations" value={status?.counts.conversations ?? 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function ResourceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
}
