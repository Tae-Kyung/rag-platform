'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const next = locale === 'en' ? 'ko' : 'en';
    startTransition(async () => {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className="rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
      aria-label="Switch language"
    >
      {locale === 'en' ? '한국어' : 'EN'}
    </button>
  );
}
