import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getDocsContent } from '../_content';

export const metadata: Metadata = {
  title: 'User Guide - AskDocs',
  description: 'AskDocs user guide. From signup to chatbot deployment.',
};

export default async function UserGuidePage() {
  const locale = await getLocale();
  const c = getDocsContent('user-guide', locale);

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{c.title}</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">{c.description}</p>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {locale === 'ko' ? '목차' : 'Table of Contents'}
        </h2>
        <ol className="mt-3 space-y-2 text-sm">
          {c.toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      {/* 1. Getting Started */}
      <Section title={c.gettingStarted.title} id="getting-started">
        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-200">{c.gettingStarted.signupTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {c.gettingStarted.signupSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{
              __html: step
                .replace('<signup>', '<a href="/signup" class="text-blue-600 dark:text-blue-400 hover:underline">')
                .replace('</signup>', '</a>')
            }} />
          ))}
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.gettingStarted.loginTitle}</h3>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: c.gettingStarted.loginDescription }} />
        <div className="mt-3 rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300" dangerouslySetInnerHTML={{ __html: c.gettingStarted.tip }} />
      </Section>

      {/* 2. Create Bot */}
      <Section title={c.createBot.title} id="create-bot">
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {c.createBot.steps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.createBot.promptTitle}</h3>
        <CodeBlock>{c.createBot.promptExample}</CodeBlock>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.createBot.settingsTitle}</h3>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 font-medium text-gray-700 dark:text-gray-300">{locale === 'ko' ? '설정' : 'Setting'}</th>
              <th className="py-2 font-medium text-gray-700 dark:text-gray-300">{locale === 'ko' ? '설명' : 'Description'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {c.createBot.settings.map((s) => (
              <tr key={s.name}>
                <td className="py-2 text-gray-800 dark:text-gray-200">{s.name}</td>
                <td className="py-2 text-gray-600 dark:text-gray-400">{s.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 3. Add Knowledge */}
      <Section title={c.addKnowledge.title} id="add-knowledge">
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.addKnowledge.description}</p>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.addKnowledge.pdfTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.addKnowledge.pdfSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.addKnowledge.crawlTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.addKnowledge.crawlSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.addKnowledge.qaTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.addKnowledge.qaSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>

        <div className="mt-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300" dangerouslySetInnerHTML={{ __html: c.addKnowledge.note }} />
      </Section>

      {/* 4. Channels */}
      <Section title={c.channels.title} id="channels">
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.channels.description}</p>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.channels.widgetTitle}</h3>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.channels.widgetDescription}</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.channels.widgetSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>
        <CodeBlock>{`<!-- AskDocs Chat Widget -->
<script
  src="https://your-domain.com/widget.js"
  data-bot-id="YOUR_BOT_ID"
  async
></script>`}</CodeBlock>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.channels.telegramTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.channels.telegramSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.channels.kakaoTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.channels.kakaoSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{
              __html: step
                .replace('<kakao>', '<a href="https://developers.kakao.com" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">')
                .replace('</kakao>', '</a>')
            }} />
          ))}
        </ol>

        <h4 className="mt-6 text-sm font-semibold text-gray-800 dark:text-gray-200">{c.channels.kakaoOpenBuilderTitle}</h4>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.channels.kakaoOpenBuilderSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{
              __html: step
                .replace('<openbuilder>', '<a href="https://i.kakao.com" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">')
                .replace('</openbuilder>', '</a>')
            }} />
          ))}
        </ol>

        <div
          className="mt-4 rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300"
          dangerouslySetInnerHTML={{ __html: c.channels.kakaoNote }}
        />
      </Section>

      {/* 5. Conversations */}
      <Section title={c.conversations.title} id="conversations">
        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-200">{c.conversations.monitorTitle}</h3>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: c.conversations.monitorDescription }} />

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.conversations.analyticsTitle}</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.conversations.analyticsItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </Section>

      {/* 6. Billing */}
      <Section title={c.billing.title} id="billing">
        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-200">{c.billing.comparisonTitle}</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {c.billing.headers.map((h) => (
                <th key={h} className="py-2 font-medium text-gray-700 dark:text-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {c.billing.rows.map((row) => (
              <tr key={row.feature}>
                <td className="py-2">{row.feature}</td>
                <td className="py-2">{row.free}</td>
                <td className="py-2">{row.pro}</td>
                <td className="py-2">{row.enterprise}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.billing.upgradeTitle}</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.billing.upgradeSteps.map((step, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
          ))}
        </ol>

        <div
          className="mt-4 rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300"
          dangerouslySetInnerHTML={{
            __html: c.billing.note
              .replace('<pricing>', '<a href="/pricing" class="font-medium text-blue-700 dark:text-blue-400 hover:underline">')
              .replace('</pricing>', '</a>')
          }}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-20">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="mt-3 text-gray-700 dark:text-gray-300">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
      <code>{children}</code>
    </pre>
  );
}
