import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getDocsContent } from './_content';

export const metadata: Metadata = {
  title: 'Documentation - AskDocs',
  description: 'AskDocs documentation — user guides and API developer docs.',
};

export default async function DocsHubPage() {
  const locale = await getLocale();
  const c = getDocsContent('hub', locale);

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">{c.title}</h1>
      <p className="mt-3 text-gray-600">{c.description}</p>

      {/* Guide Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* User Guide Card */}
        <Link
          href="/docs/user-guide"
          className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
            {c.userGuide.title}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{c.userGuide.description}</p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
            {c.userGuide.link}
            <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </Link>

        {/* Developer Guide Card */}
        <Link
          href="/docs/developer"
          className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
            {c.developerGuide.title}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{c.developerGuide.description}</p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
            {c.developerGuide.link}
            <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="mt-12">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{c.quickLinks.title}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {c.quickLinks.items.map((item) => (
            <QuickLink key={item.href} href={item.href} label={item.label} description={item.description} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 transition hover:border-gray-200 hover:bg-gray-50"
    >
      <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </Link>
  );
}
