import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy - AskDocs',
  description: 'AskDocs refund policy and money-back guarantee.',
};

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">AskDocs</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Refund Policy</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: February 14, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-gray-600">
          <Section title="30-Day Money-Back Guarantee">
            <p>
              We want you to be fully satisfied with AskDocs. If you&rsquo;re not happy with our paid
              plans, we offer a 30-day money-back guarantee from your initial subscription date.
            </p>
          </Section>

          <Section title="Eligibility">
            <ul className="list-disc pl-5 space-y-1">
              <li>Refund requests must be made within 30 days of your first payment.</li>
              <li>The guarantee applies to your first subscription only, not to renewals.</li>
              <li>Annual plan refunds are calculated pro-rata based on unused months.</li>
              <li>Free plan users are not eligible (no payment was made).</li>
            </ul>
          </Section>

          <Section title="How to Request a Refund">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Email{' '}
                <a href="mailto:billing@askdocs.app" className="text-blue-600 hover:underline">
                  billing@askdocs.app
                </a>{' '}
                with the subject line &ldquo;Refund Request&rdquo;.
              </li>
              <li>Include your account email and the reason for your request.</li>
              <li>We will process your refund within 5-10 business days.</li>
            </ol>
          </Section>

          <Section title="After a Refund">
            <ul className="list-disc pl-5 space-y-1">
              <li>Your account will be downgraded to the Free plan.</li>
              <li>If your usage exceeds Free plan limits, excess bots and documents will be deactivated (not deleted).</li>
              <li>You can re-subscribe to a paid plan at any time.</li>
            </ul>
          </Section>

          <Section title="Non-Refundable Items">
            <ul className="list-disc pl-5 space-y-1">
              <li>Renewal payments after the initial 30-day guarantee period.</li>
              <li>Accounts terminated for Terms of Service violations.</li>
              <li>Custom Enterprise agreements (governed by separate contract terms).</li>
            </ul>
          </Section>

          <Section title="Contact">
            <p>
              For billing questions, contact{' '}
              <a href="mailto:billing@askdocs.app" className="text-blue-600 hover:underline">
                billing@askdocs.app
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
