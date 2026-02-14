'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import AuthNav from '@/components/AuthNav';

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try AskDocs with a single bot',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 Bot',
      '10 Documents',
      '100 Messages / month',
      '100 MB Storage',
      'Web Widget',
      'Community Support',
    ],
    cta: 'Get Started Free',
    href: '/signup',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting started',
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      '3 Bots',
      '50 Documents',
      '1,000 Messages / month',
      '500 MB Storage',
      'Web Widget + Telegram',
      'Email Support',
    ],
    cta: 'Start Starter',
    href: '/signup?plan=starter',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing businesses',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      '10 Bots',
      '200 Documents',
      '10,000 Messages / month',
      '2 GB Storage',
      'All Channels',
      'API Access',
      'Priority Support',
    ],
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions at scale',
    monthlyPrice: -1,
    yearlyPrice: -1,
    features: [
      'Unlimited Bots',
      'Unlimited Documents',
      'Unlimited Messages',
      'Unlimited Storage',
      'All Channels + Custom',
      'API Access',
      'Dedicated Support',
      'Custom Integrations',
    ],
    cta: 'Contact Sales',
    href: 'mailto:support@askdocs.app',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Can I change my plan later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time from your dashboard. Changes take effect immediately.',
  },
  {
    q: 'What happens if I exceed my message limit?',
    a: 'Your chatbot will stop responding until the next billing cycle. You can upgrade your plan anytime to increase your limit.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'We offer a 14-day free trial for the Starter and Pro plans. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes, we offer a 30-day money-back guarantee. See our refund policy for details.',
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">AskDocs</Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Pricing</Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Docs</Link>
            <Link href="/demo" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Demo</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Simple, Transparent Pricing</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">Start free, scale as you grow. No hidden fees.</p>

        {/* Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2">
          <span className={`text-sm font-medium ${!yearly ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative h-6 w-11 rounded-full transition ${yearly ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                yearly ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
            Yearly <span className="text-green-600 dark:text-green-400">(Save ~17%)</span>
          </span>
        </div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 ${
                plan.highlighted
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg shadow-blue-600/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
              <div className="mt-4">
                {plan.monthlyPrice === -1 ? (
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">Custom</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${yearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                    {yearly && plan.monthlyPrice > 0 && (
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        ${plan.yearlyPrice}/year
                      </div>
                    )}
                  </>
                )}
              </div>
              <Link
                href={plan.href}
                className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {plan.cta}
              </Link>
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        &copy; {new Date().getFullYear()} AskDocs. All rights reserved.
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-white">{question}</span>
        <svg
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
          {answer}
        </div>
      )}
    </div>
  );
}
