'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { date: string; avg: number; count: number }[];
}

export function FeedbackChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Feedback Trend</h3>
      <div className="mt-4 h-64">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            No feedback data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
              />
              <Tooltip
                contentStyle={{ fontSize: 13, borderRadius: 8 }}
                formatter={(value, name) =>
                  name === 'avg' ? [`${value}/5`, 'Avg Rating'] : [value, 'Count']
                }
              />
              <Bar dataKey="avg" fill="#f59e0b" radius={[4, 4, 0, 0]} name="avg" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
