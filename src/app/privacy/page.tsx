import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - AskDocs',
  description: 'AskDocs privacy policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">AskDocs</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: February 14, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-gray-600">
          <Section title="1. Information We Collect">
            <p>We collect the following types of information:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account.</li>
              <li><strong>Documents:</strong> Files you upload (PDFs, text) and URLs you provide for crawling.</li>
              <li><strong>Usage Data:</strong> Chat messages, API requests, and interaction logs with your bots.</li>
              <li><strong>Payment Information:</strong> Processed securely by Stripe. We do not store credit card details.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, and device information for security purposes.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, maintain, and improve our services.</li>
              <li>To process your documents and create AI-powered chatbot responses.</li>
              <li>To manage your account and process payments.</li>
              <li>To send service-related communications and support responses.</li>
              <li>To monitor usage, detect abuse, and ensure platform security.</li>
            </ul>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>
              Your data is stored in isolated Supabase databases with row-level security (RLS) policies.
              All data is encrypted in transit (TLS) and at rest. Each tenant&rsquo;s documents, embeddings,
              and conversations are fully isolated from other users.
            </p>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              We do not sell your data. We may share data only with:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>OpenAI:</strong> Document content and chat messages are sent to OpenAI for embedding and response generation.</li>
              <li><strong>Stripe:</strong> Payment processing.</li>
              <li><strong>Vercel:</strong> Hosting infrastructure.</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights.</li>
            </ul>
          </Section>

          <Section title="5. Your Rights">
            <ul className="list-disc pl-5 space-y-1">
              <li>Access, update, or delete your personal data at any time from your dashboard.</li>
              <li>Delete your account and all associated data (documents, conversations, embeddings).</li>
              <li>Export your data upon request.</li>
              <li>Opt out of non-essential communications.</li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use essential cookies for authentication and session management. We do not use
              advertising or tracking cookies.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain your data for as long as your account is active. When you delete your account,
              all documents, embeddings, conversations, and personal data are permanently removed within
              30 days.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:privacy@askdocs.app" className="text-blue-600 hover:underline">
                privacy@askdocs.app
              </a>.
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-gray-200 px-6 py-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} AskDocs. All rights reserved.
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
