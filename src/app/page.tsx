import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isAdmin = profile?.role === 'admin';
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            AskDocs
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            <Link href="/pricing" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{t('nav.pricing')}</Link>
            <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{t('nav.docs')}</Link>
            <Link href="/demo" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{t('nav.demo')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Admin
                  </Link>
                )}
                <Link href="/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">{t('nav.login')}</Link>
                <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  {t('getStarted')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 dark:from-blue-950/30 to-white dark:to-gray-900" />
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400">
            {t('hero.badge')}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            {t('hero.titleStart')}
            <span className="text-blue-600 dark:text-blue-400">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
            {t('hero.description')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition"
            >
              {t('hero.startFree')}
            </Link>
            <Link
              href="/demo"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-8 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {t('hero.tryDemo')}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">{t('hero.noCreditCard')}</p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('features.title')}</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">{t('features.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              title={t('features.setup.title')}
              description={t('features.setup.description')}
            />
            <FeatureCard
              icon="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              title={t('features.multiChannel.title')}
              description={t('features.multiChannel.description')}
            />
            <FeatureCard
              icon="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              title={t('features.ragSearch.title')}
              description={t('features.ragSearch.description')}
            />
            <FeatureCard
              icon="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
              title={t('features.pricing.title')}
              description={t('features.pricing.description')}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 dark:bg-gray-800 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('howItWorks.title')}</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">{t('howItWorks.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <StepCard number={1} title={t('howItWorks.step1.title')} description={t('howItWorks.step1.description')} />
            <StepCard number={2} title={t('howItWorks.step2.title')} description={t('howItWorks.step2.description')} />
            <StepCard number={3} title={t('howItWorks.step3.title')} description={t('howItWorks.step3.description')} />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <TrustCard
              icon="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              title={t('trust.secure.title')}
              description={t('trust.secure.description')}
            />
            <TrustCard
              icon="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
              title={t('trust.dataControl.title')}
              description={t('trust.dataControl.description')}
            />
            <TrustCard
              icon="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
              title={t('trust.scale.title')}
              description={t('trust.scale.description')}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">{t('cta.title')}</h2>
          <p className="mt-4 text-blue-100">{t('cta.subtitle')}</p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition"
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AskDocs</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('footer.tagline')}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('footer.product')}</h4>
              <ul className="mt-2 space-y-2">
                <li><Link href="/pricing" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('nav.pricing')}</Link></li>
                <li><Link href="/docs" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('nav.docs')}</Link></li>
                <li><Link href="/demo" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('nav.demo')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('footer.legal')}</h4>
              <ul className="mt-2 space-y-2">
                <li><Link href="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('footer.privacy')}</Link></li>
                <li><Link href="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('footer.terms')}</Link></li>
                <li><Link href="/refund" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('footer.refund')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('footer.account')}</h4>
              <ul className="mt-2 space-y-2">
                <li><Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('nav.login')}</Link></li>
                <li><Link href="/signup" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{t('getStarted')}</Link></li>
                <li><Link href="/dashboard" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center text-sm text-gray-400 dark:text-gray-500">
            {t('footer.copyright', { year: new Date().getFullYear().toString() })}
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function TrustCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
