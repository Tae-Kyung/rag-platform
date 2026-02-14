'use client';

interface Invoice {
  id: string;
  paddle_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

interface InvoiceListProps {
  invoices: Invoice[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
      {status}
    </span>
  );
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No invoices yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Period</th>
            <th className="pb-2 font-medium">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td className="py-3 text-gray-900 dark:text-white">{formatDate(inv.created_at)}</td>
              <td className="py-3 text-gray-900 dark:text-white">
                ${inv.amount.toFixed(2)} {inv.currency}
              </td>
              <td className="py-3">{statusBadge(inv.status)}</td>
              <td className="py-3 text-gray-500 dark:text-gray-400">
                {inv.period_start && inv.period_end
                  ? `${formatDate(inv.period_start)} - ${formatDate(inv.period_end)}`
                  : '-'}
              </td>
              <td className="py-3">
                {inv.invoice_url ? (
                  <a
                    href={inv.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
