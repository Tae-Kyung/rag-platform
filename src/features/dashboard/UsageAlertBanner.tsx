'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageAlerts {
  messageAlert: number | null;
  storageAlert: number | null;
  botAlert: number | null;
}

export function UsageAlertBanner() {
  const [alerts, setAlerts] = useState<UsageAlerts | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/owner/usage-alerts');
        const json = await res.json();
        if (json.success) {
          setAlerts(json.data);
        }
      } catch {
        // silently fail
      }
    }
    fetchAlerts();
  }, []);

  if (!alerts) return null;

  const warnings: { label: string; pct: number }[] = [];
  if (alerts.messageAlert !== null) {
    warnings.push({ label: 'Messages', pct: alerts.messageAlert });
  }
  if (alerts.storageAlert !== null) {
    warnings.push({ label: 'Storage', pct: alerts.storageAlert });
  }
  if (alerts.botAlert !== null) {
    warnings.push({ label: 'Bots', pct: alerts.botAlert });
  }

  if (warnings.length === 0) return null;

  const hasLimitReached = warnings.some((w) => w.pct >= 100);

  return (
    <div
      className={`mb-6 rounded-xl border px-4 py-3 ${
        hasLimitReached
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
          : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className={`h-5 w-5 ${hasLimitReached ? 'text-red-500' : 'text-yellow-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div>
            <span
              className={`text-sm font-medium ${
                hasLimitReached ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'
              }`}
            >
              {hasLimitReached ? 'Plan limit reached' : 'Approaching plan limit'}
            </span>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {warnings.map((w) => `${w.label}: ${w.pct}%`).join(' · ')}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${
            hasLimitReached ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
