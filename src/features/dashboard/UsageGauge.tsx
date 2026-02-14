'use client';

interface UsageGaugeProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
}

export function UsageGauge({ label, used, max, unit = '' }: UsageGaugeProps) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {used.toLocaleString()}
          {unit ? ` ${unit}` : ''} /{' '}
          {isUnlimited ? 'Unlimited' : `${max.toLocaleString()}${unit ? ` ${unit}` : ''}`}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
}
