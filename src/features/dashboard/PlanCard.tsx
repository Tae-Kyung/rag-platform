'use client';

interface PlanCardProps {
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  maxBots: number;
  maxDocuments: number;
  maxMessagesPerMonth: number;
  maxStorageMb: number;
  isCurrent: boolean;
  billingInterval: 'monthly' | 'yearly';
  onSelect?: () => void;
  isDowngrade?: boolean;
}

function formatLimit(value: number): string {
  if (value === -1) return 'Unlimited';
  return value.toLocaleString();
}

export function PlanCard({
  name,
  description,
  priceMonthly,
  priceYearly,
  maxBots,
  maxDocuments,
  maxMessagesPerMonth,
  maxStorageMb,
  isCurrent,
  billingInterval,
  onSelect,
  isDowngrade,
}: PlanCardProps) {
  const price = billingInterval === 'monthly' ? priceMonthly : priceYearly;
  const perMonth = billingInterval === 'yearly' ? Math.round((priceYearly / 12) * 100) / 100 : priceMonthly;

  return (
    <div
      className={`rounded-xl border-2 p-6 ${
        isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{name}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>

      <div className="mb-6">
        {price === 0 ? (
          <div className="text-3xl font-bold text-gray-900">Free</div>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-900">
              ${perMonth}
              <span className="text-base font-normal text-gray-500">/mo</span>
            </div>
            {billingInterval === 'yearly' && (
              <p className="text-sm text-gray-500">
                ${price}/year (save {Math.round((1 - priceYearly / (priceMonthly * 12)) * 100)}%)
              </p>
            )}
          </>
        )}
      </div>

      <ul className="mb-6 space-y-2 text-sm text-gray-600">
        <li className="flex items-center gap-2">
          <CheckIcon /> {formatLimit(maxBots)} bots
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon /> {formatLimit(maxDocuments)} documents
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon /> {formatLimit(maxMessagesPerMonth)} messages/mo
        </li>
        <li className="flex items-center gap-2">
          <CheckIcon /> {formatLimit(maxStorageMb)} MB storage
        </li>
      </ul>

      {isCurrent ? (
        <button
          disabled
          className="w-full rounded-lg bg-blue-100 px-4 py-2.5 text-sm font-medium text-blue-700 cursor-default"
        >
          Current Plan
        </button>
      ) : onSelect ? (
        <button
          onClick={onSelect}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
            isDowngrade
              ? 'bg-gray-500 hover:bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isDowngrade ? 'Downgrade' : 'Upgrade'}
        </button>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
