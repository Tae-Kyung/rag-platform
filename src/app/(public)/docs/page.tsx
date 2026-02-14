import Link from 'next/link';

export const metadata = {
  title: 'API Documentation - AskDocs',
  description: 'AskDocs Public API v1 documentation',
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        &larr; Back to Home
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">API Documentation</h1>
      <p className="mt-2 text-gray-600">
        AskDocs Public API v1 &mdash; Integrate your AI chatbot into any application.
      </p>

      <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        API access requires a <strong>Pro</strong> plan or higher.
        <Link href="/dashboard/billing" className="ml-1 text-yellow-900 underline">
          Upgrade your plan
        </Link>
      </div>

      {/* Authentication */}
      <Section title="Authentication" id="auth">
        <p>
          All API requests require a Bearer token in the <code>Authorization</code> header.
          Generate API keys in your{' '}
          <Link href="/dashboard/api-keys" className="text-blue-600 underline">
            Dashboard &gt; API Keys
          </Link>.
        </p>
        <CodeBlock>
          {`curl -H "Authorization: Bearer ask_your_api_key_here" \\
  https://your-domain.com/api/v1/usage`}
        </CodeBlock>
        <p className="mt-2 text-sm text-gray-500">
          API keys start with <code>ask_</code>. Keep them secret &mdash; the full key
          is only shown once at creation time.
        </p>
      </Section>

      {/* Rate Limits */}
      <Section title="Rate Limits" id="rate-limits">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 font-medium text-gray-700">Plan</th>
              <th className="py-2 font-medium text-gray-700">Limit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2">Pro</td>
              <td className="py-2">60 requests / minute</td>
            </tr>
            <tr>
              <td className="py-2">Enterprise</td>
              <td className="py-2">300 requests / minute</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-sm text-gray-500">
          Rate limit headers: <code>X-RateLimit-Remaining</code>, <code>Retry-After</code>
        </p>
      </Section>

      {/* Endpoints */}
      <Section title="Endpoints" id="endpoints">

        {/* POST /v1/chat */}
        <Endpoint method="POST" path="/api/v1/chat">
          <p>Send a message to a bot and receive an AI response.</p>
          <h4 className="mt-3 text-sm font-semibold text-gray-700">Request Body</h4>
          <CodeBlock lang="json">
            {`{
  "bot_id": "uuid",
  "message": "What is your return policy?",
  "conversation_id": "uuid (optional, for follow-up)",
  "stream": false
}`}
          </CodeBlock>

          <h4 className="mt-3 text-sm font-semibold text-gray-700">Response (stream: false)</h4>
          <CodeBlock lang="json">
            {`{
  "success": true,
  "data": {
    "conversation_id": "uuid",
    "message_id": "uuid",
    "content": "Our return policy allows...",
    "confidence": "high",
    "sources": [
      { "title": "FAQ.pdf", "similarity": 92 }
    ],
    "usage": {
      "total_tokens": 450,
      "prompt_tokens": 350,
      "completion_tokens": 100
    }
  }
}`}
          </CodeBlock>

          <h4 className="mt-3 text-sm font-semibold text-gray-700">Streaming (stream: true)</h4>
          <p className="text-sm text-gray-600">
            Returns Server-Sent Events (SSE). Event types:
          </p>
          <CodeBlock>
            {`data: {"type":"meta","conversation_id":"...","message_id":"...","confidence":"high"}
data: {"type":"content","content":"Our return"}
data: {"type":"content","content":" policy allows..."}
data: {"type":"sources","sources":[{"title":"FAQ.pdf","similarity":92}]}
data: {"type":"done"}`}
          </CodeBlock>
        </Endpoint>

        {/* GET /v1/bots/[botId] */}
        <Endpoint method="GET" path="/api/v1/bots/:botId">
          <p>Retrieve bot information.</p>
          <CodeBlock lang="json">
            {`{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Support Bot",
    "description": "Customer support assistant",
    "is_active": true,
    "model": "gpt-4o-mini",
    "document_count": 15,
    "conversation_count": 234,
    "created_at": "2025-01-15T10:00:00Z"
  }
}`}
          </CodeBlock>
        </Endpoint>

        {/* GET /v1/conversations */}
        <Endpoint method="GET" path="/api/v1/conversations?bot_id=uuid&limit=20&offset=0">
          <p>List conversations for a bot.</p>
          <CodeBlock lang="json">
            {`{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "language": "en",
        "channel": "api",
        "created_at": "2025-01-20T14:30:00Z"
      }
    ],
    "total": 50,
    "limit": 20,
    "offset": 0
  }
}`}
          </CodeBlock>
        </Endpoint>

        {/* GET /v1/conversations/[convId]/messages */}
        <Endpoint method="GET" path="/api/v1/conversations/:convId/messages">
          <p>Get all messages in a conversation.</p>
          <CodeBlock lang="json">
            {`{
  "success": true,
  "data": {
    "conversation": { "id": "uuid", "language": "en", "channel": "api" },
    "messages": [
      { "id": "uuid", "role": "user", "content": "Hello", "created_at": "..." },
      { "id": "uuid", "role": "assistant", "content": "Hi! How can I help?", "created_at": "..." }
    ]
  }
}`}
          </CodeBlock>
        </Endpoint>

        {/* GET /v1/usage */}
        <Endpoint method="GET" path="/api/v1/usage">
          <p>Get current usage and plan limits.</p>
          <CodeBlock lang="json">
            {`{
  "success": true,
  "data": {
    "plan": "pro",
    "limits": {
      "max_bots": 10,
      "max_documents": 500,
      "max_messages_per_month": 10000,
      "max_storage_mb": 5000
    },
    "usage": {
      "messages_used": 1234,
      "documents_used": 45,
      "storage_used_mb": 120.5,
      "bots": 3,
      "period_start": "2025-01-01T00:00:00Z",
      "period_end": "2025-01-31T23:59:59Z"
    }
  }
}`}
          </CodeBlock>
        </Endpoint>
      </Section>

      {/* Error Codes */}
      <Section title="Error Codes" id="errors">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 font-medium text-gray-700">Status</th>
              <th className="py-2 font-medium text-gray-700">Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2"><code>400</code></td>
              <td className="py-2">Bad request (missing fields, invalid input)</td>
            </tr>
            <tr>
              <td className="py-2"><code>401</code></td>
              <td className="py-2">Unauthorized (missing or invalid API key)</td>
            </tr>
            <tr>
              <td className="py-2"><code>403</code></td>
              <td className="py-2">Forbidden (plan doesn&apos;t support API access, or bot inactive)</td>
            </tr>
            <tr>
              <td className="py-2"><code>404</code></td>
              <td className="py-2">Not found (bot or conversation doesn&apos;t exist)</td>
            </tr>
            <tr>
              <td className="py-2"><code>429</code></td>
              <td className="py-2">Rate limit or message quota exceeded</td>
            </tr>
            <tr>
              <td className="py-2"><code>500</code></td>
              <td className="py-2">Internal server error</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm text-gray-500">
          All error responses follow the format:{' '}
          <code>{`{"success": false, "error": "description"}`}</code>
        </p>
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
    <section id={id} className="mt-10">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="mt-3 text-gray-700">{children}</div>
    </section>
  );
}

function Endpoint({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${colors[method] || 'bg-gray-100'}`}>
          {method}
        </span>
        <code className="text-sm text-gray-800">{path}</code>
      </div>
      <div className="mt-3 text-sm text-gray-600">{children}</div>
    </div>
  );
}

function CodeBlock({
  children,
  lang,
}: {
  children: string;
  lang?: string;
}) {
  return (
    <pre
      className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100"
      data-lang={lang}
    >
      <code>{children}</code>
    </pre>
  );
}
