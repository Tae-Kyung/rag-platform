import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'AskDocs - AI Knowledge Bots from Your Documents',
    template: '%s | AskDocs',
  },
  description:
    'Build AI-powered chatbots from your documents. Upload PDFs, crawl websites, add Q&A pairs — deploy on your site, Telegram, or via API.',
  keywords: [
    'AI chatbot',
    'RAG',
    'document chatbot',
    'knowledge base',
    'chatbot builder',
    'RAG-as-a-Service',
  ],
  authors: [{ name: 'AskDocs' }],
  openGraph: {
    type: 'website',
    siteName: 'AskDocs',
    title: 'AskDocs - AI Knowledge Bots from Your Documents',
    description:
      'Build AI-powered chatbots from your documents. RAG-as-a-Service platform.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AskDocs - AI Knowledge Bots from Your Documents',
    description:
      'Build AI-powered chatbots from your documents. RAG-as-a-Service platform.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
