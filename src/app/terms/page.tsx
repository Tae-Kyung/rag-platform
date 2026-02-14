import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - AskDocs',
  description: 'AskDocs terms of service agreement.',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">AskDocs</Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: February 14, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7 text-gray-600">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using AskDocs (&ldquo;the Service&rdquo;), you agree to be bound by these
              Terms of Service. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              AskDocs is a RAG-as-a-Service platform that allows users to create AI-powered chatbots
              from their documents. The Service includes document processing, embedding generation,
              chatbot hosting, and API access.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>One person or entity may not maintain more than one free account.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Upload illegal, harmful, or infringing content.</li>
              <li>Use the Service to generate misleading, fraudulent, or harmful responses.</li>
              <li>Attempt to circumvent usage limits or security measures.</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
              <li>Resell access to the Service without authorization.</li>
              <li>Use the Service in a way that violates applicable laws or regulations.</li>
            </ul>
          </Section>

          <Section title="5. Intellectual Property">
            <p>
              You retain ownership of all documents and content you upload. By using the Service, you
              grant us a limited license to process your content for the purpose of providing the
              Service (embedding, indexing, and generating responses).
            </p>
          </Section>

          <Section title="6. Payment & Billing">
            <ul className="list-disc pl-5 space-y-1">
              <li>Paid plans are billed monthly or annually in advance.</li>
              <li>All prices are in USD and exclude applicable taxes.</li>
              <li>You may cancel your subscription at any time. Access continues until the end of your billing period.</li>
              <li>We reserve the right to change pricing with 30 days&rsquo; notice.</li>
            </ul>
          </Section>

          <Section title="7. Service Availability">
            <p>
              We strive for high availability but do not guarantee uninterrupted service. We are not
              liable for downtime, data loss, or service interruptions caused by factors beyond our
              reasonable control.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, AskDocs and its affiliates shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Service. Our total liability shall not exceed the amount you paid us in
              the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              We may suspend or terminate your access if you violate these terms. Upon termination,
              your data will be retained for 30 days to allow export, after which it will be permanently
              deleted.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>
              We may update these terms from time to time. We will notify you of material changes via
              email or an in-app notice at least 30 days before they take effect.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:legal@askdocs.app" className="text-blue-600 hover:underline">
                legal@askdocs.app
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
