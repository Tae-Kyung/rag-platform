'use client';

import Link from 'next/link';

interface BotCardProps {
  bot: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    model: string;
    document_count: number;
    conversation_count: number;
    created_at: string;
  };
}

export function BotCard({ bot }: BotCardProps) {
  return (
    <Link
      href={`/dashboard/bots/${bot.id}`}
      className="block rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{bot.name}</h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            bot.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {bot.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {bot.description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{bot.description}</p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          {bot.document_count} docs
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          {bot.conversation_count} chats
        </span>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{bot.model}</span>
      </div>
    </Link>
  );
}
