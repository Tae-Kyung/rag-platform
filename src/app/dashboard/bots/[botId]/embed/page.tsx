'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function EmbedPage({ params }: { params: Promise<{ botId: string }> }) {
  const { botId } = use(params);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const scriptCode = `<script src="${origin}/widget.js" data-bot-id="${botId}"></script>`;
  const iframeCode = `<iframe
  src="${origin}/widget/${botId}"
  width="380"
  height="560"
  style="border:none;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.2)"
  title="Chat Widget"
></iframe>`;
  const directLink = `${origin}/chat/${botId}`;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/bots/${botId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to Bot Settings
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">Embed Widget</h1>

      {/* Script Tag */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Script Tag (Recommended)</h2>
        <p className="mb-3 text-sm text-gray-600">
          Add this script to your website. A floating chat button will appear in the bottom-right corner.
        </p>
        <div className="relative rounded-lg bg-gray-900 p-4">
          <pre className="overflow-x-auto text-sm text-green-400">
            <code>{scriptCode}</code>
          </pre>
          <button
            onClick={() => handleCopy(scriptCode, 'script')}
            className="absolute right-2 top-2 rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
          >
            {copied === 'script' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Optional attributes: <code>data-position=&quot;bottom-left&quot;</code>,{' '}
          <code>data-color=&quot;#FF5733&quot;</code>,{' '}
          <code>data-lang=&quot;ko&quot;</code>
        </div>
      </section>

      {/* Iframe */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Iframe Embed</h2>
        <p className="mb-3 text-sm text-gray-600">
          Embed the chat widget directly in your page layout.
        </p>
        <div className="relative rounded-lg bg-gray-900 p-4">
          <pre className="overflow-x-auto text-sm text-green-400">
            <code>{iframeCode}</code>
          </pre>
          <button
            onClick={() => handleCopy(iframeCode, 'iframe')}
            className="absolute right-2 top-2 rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
          >
            {copied === 'iframe' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </section>

      {/* Direct Link */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Direct Link</h2>
        <p className="mb-3 text-sm text-gray-600">
          Share this link directly to let users chat with your bot.
        </p>
        <div className="relative rounded-lg bg-gray-900 p-4">
          <pre className="overflow-x-auto text-sm text-green-400">
            <code>{directLink}</code>
          </pre>
          <button
            onClick={() => handleCopy(directLink, 'link')}
            className="absolute right-2 top-2 rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600"
          >
            {copied === 'link' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </section>

      {/* Preview */}
      {origin && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Preview</h2>
          <div className="flex justify-center rounded-lg border bg-gray-50 p-6">
            <iframe
              src={`${origin}/widget/${botId}`}
              width="380"
              height="500"
              className="rounded-lg border shadow-lg"
              title="Widget Preview"
            />
          </div>
        </section>
      )}
    </div>
  );
}
