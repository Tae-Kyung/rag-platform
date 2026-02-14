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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface TrafficData {
  period: string;
  totalMessages: number;
  dailyMessages: { date: string; count: number }[];
  topUsers: { user_id: string; email: string; full_name: string | null; message_count: number }[];
  channelDistribution: { channel: string; count: number }[];
  errorCount: number;
}

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminTrafficPage() {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTraffic() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sys/traffic?period=${period}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        console.error('Failed to fetch traffic');
      } finally {
        setLoading(false);
      }
    }
    fetchTraffic();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="py-12 text-center text-gray-500">Failed to load traffic data.</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Traffic</h2>
          <p className="mt-1 text-sm text-gray-500">{data.totalMessages.toLocaleString()} total messages</p>
        </div>
        <div className="flex rounded-lg border border-gray-300 bg-white">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm font-medium ${
                period === p.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              } first:rounded-l-lg last:rounded-r-lg`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Total Messages</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{data.totalMessages.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Errors</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{data.errorCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">Avg/Day</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {data.dailyMessages.length > 0
              ? Math.round(data.totalMessages / data.dailyMessages.length)
              : 0}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Daily messages */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">Daily Messages</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyMessages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Messages" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700">Channel Distribution</h3>
          <div className="mt-4 h-64">
            {data.channelDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.channelDistribution}
                    dataKey="count"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props) => `${props.name} ${((props.percent as number) * 100).toFixed(0)}%`}
                  >
                    {data.channelDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-700">Top Users by Traffic</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-600">#</th>
              <th className="px-4 py-2 font-medium text-gray-600">User</th>
              <th className="px-4 py-2 font-medium text-gray-600">Messages</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.topUsers.map((u, i) => (
              <tr key={u.user_id}>
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{u.full_name || u.email}</div>
                  {u.full_name && <div className="text-xs text-gray-500">{u.email}</div>}
                </td>
                <td className="px-4 py-2 font-semibold text-gray-900">{u.message_count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
