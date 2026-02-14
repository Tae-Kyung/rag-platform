import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getDocsContent } from '../_content';

export const metadata: Metadata = {
  title: 'Developer Guide - AskDocs',
  description: 'AskDocs API integration guide with Python, JavaScript code examples.',
};

export default async function DeveloperGuidePage() {
  const locale = await getLocale();
  const c = getDocsContent('developer', locale);

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{c.title}</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">{c.description}</p>

      <div className="mt-4 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
        <span dangerouslySetInnerHTML={{ __html: c.apiNotice }} />{' '}
        <Link href="/dashboard/billing" className="font-medium text-yellow-900 dark:text-yellow-200 underline">
          {c.upgradeLinkText}
        </Link>
      </div>

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

      {/* 1. Quickstart */}
      <Section title={c.quickstart.title} id="quickstart">
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.quickstart.description}</p>
        <div className="mt-4 space-y-4">
          {c.quickstart.steps.map((step, i) => (
            <StepBox key={i} step={i + 1} title={step.title}>
              {step.description ? (
                <p dangerouslySetInnerHTML={{
                  __html: step.description
                    .replace('<apikeys>', '<a href="/dashboard/api-keys" class="text-blue-600 dark:text-blue-400 hover:underline">')
                    .replace('</apikeys>', '</a>')
                }} />
              ) : (
                <CodeBlock lang="bash">{`curl -X POST https://your-domain.com/api/v1/chat \\
  -H "Authorization: Bearer ask_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "YOUR_BOT_ID",
    "message": "Hello, what is your return policy?"
  }'`}</CodeBlock>
              )}
            </StepBox>
          ))}
        </div>
      </Section>

      {/* 2. Authentication */}
      <Section title={c.authentication.title} id="authentication">
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: c.authentication.description }} />
        <CodeBlock>{`Authorization: Bearer ask_your_api_key_here`}</CodeBlock>

        <h3 className="mt-6 text-base font-semibold text-gray-800 dark:text-gray-200">{c.authentication.managementTitle}</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.authentication.managementItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{
              __html: item
                .replace('<apikeys>', '<a href="/dashboard/api-keys" class="text-blue-600 dark:text-blue-400 hover:underline">')
                .replace('</apikeys>', '</a>')
            }} />
          ))}
        </ul>
      </Section>

      {/* 3. Code Examples */}
      <Section title={c.codeExamples.title} id="code-examples">
        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-200">{c.codeExamples.pythonTitle}</h3>
        <CodeBlock lang="python">{`import requests

API_KEY = "ask_your_api_key_here"
BASE_URL = "https://your-domain.com/api/v1"

response = requests.post(
    f"{BASE_URL}/chat",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "bot_id": "YOUR_BOT_ID",
        "message": "What is your return policy?",
    },
)

data = response.json()
print(data["data"]["content"])
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.codeExamples.jsTitle}</h3>
        <CodeBlock lang="javascript">{`const API_KEY = "ask_your_api_key_here";
const BASE_URL = "https://your-domain.com/api/v1";

const response = await fetch(\`\${BASE_URL}/chat\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    bot_id: "YOUR_BOT_ID",
    message: "What is your return policy?",
  }),
});

const data = await response.json();
console.log(data.data.content);
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.codeExamples.curlTitle}</h3>
        <CodeBlock lang="bash">{`curl -X POST https://your-domain.com/api/v1/chat \\
  -H "Authorization: Bearer ask_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "YOUR_BOT_ID",
    "message": "What is your return policy?"
  }'`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.codeExamples.streamingTitle}</h3>
        <CodeBlock lang="python">{`import requests

API_KEY = "ask_your_api_key_here"
BASE_URL = "https://your-domain.com/api/v1"

response = requests.post(
    f"{BASE_URL}/chat",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "bot_id": "YOUR_BOT_ID",
        "message": "What is your return policy?",
        "stream": True,
    },
    stream=True,
)

for line in response.iter_lines():
    if line:
        decoded = line.decode("utf-8")
        if decoded.startswith("data: "):
            import json
            event = json.loads(decoded[6:])
            if event["type"] == "content":
                print(event["content"], end="", flush=True)
            elif event["type"] == "done":
                print()  # newline
                break
`}</CodeBlock>
      </Section>

      {/* 4. Endpoint Reference */}
      <Section title={c.endpoints.title} id="endpoints">
        {/* POST /v1/chat */}
        <Endpoint method="POST" path="/api/v1/chat">
          <p>{c.endpoints.chat.description}</p>
          <h4 className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{c.endpoints.chat.requestBodyTitle}</h4>
          <CodeBlock lang="json">{`{
  "bot_id": "uuid",
  "message": "What is your return policy?",
  "conversation_id": "uuid (optional, for follow-up)",
  "stream": false
}`}</CodeBlock>

          <h4 className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{c.endpoints.chat.responseTitle}</h4>
          <CodeBlock lang="json">{`{
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
}`}</CodeBlock>

          <h4 className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{c.endpoints.chat.streamingTitle}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{c.endpoints.chat.streamingDescription}</p>
          <CodeBlock>{`data: {"type":"meta","conversation_id":"...","message_id":"...","confidence":"high"}
data: {"type":"content","content":"Our return"}
data: {"type":"content","content":" policy allows..."}
data: {"type":"sources","sources":[{"title":"FAQ.pdf","similarity":92}]}
data: {"type":"done"}`}</CodeBlock>
        </Endpoint>

        {/* GET /v1/bots/:botId */}
        <Endpoint method="GET" path="/api/v1/bots/:botId">
          <p>{c.endpoints.getBot.description}</p>
          <CodeBlock lang="json">{`{
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
}`}</CodeBlock>
        </Endpoint>

        {/* GET /v1/conversations */}
        <Endpoint method="GET" path="/api/v1/conversations?bot_id=uuid&limit=20&offset=0">
          <p>{c.endpoints.getConversations.description}</p>
          <CodeBlock lang="json">{`{
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
}`}</CodeBlock>
        </Endpoint>

        {/* GET /v1/conversations/:convId/messages */}
        <Endpoint method="GET" path="/api/v1/conversations/:convId/messages">
          <p>{c.endpoints.getMessages.description}</p>
          <CodeBlock lang="json">{`{
  "success": true,
  "data": {
    "conversation": { "id": "uuid", "language": "en", "channel": "api" },
    "messages": [
      { "id": "uuid", "role": "user", "content": "Hello", "created_at": "..." },
      { "id": "uuid", "role": "assistant", "content": "Hi! How can I help?", "created_at": "..." }
    ]
  }
}`}</CodeBlock>
        </Endpoint>

        {/* GET /v1/usage */}
        <Endpoint method="GET" path="/api/v1/usage">
          <p>{c.endpoints.getUsage.description}</p>
          <CodeBlock lang="json">{`{
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
}`}</CodeBlock>
        </Endpoint>
      </Section>

      {/* 5. Error Codes & Rate Limits */}
      <Section title={c.errors.title} id="errors">
        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-200">{c.errors.errorsTitle}</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {c.errors.headers.map((h) => (
                <th key={h} className="py-2 font-medium text-gray-700 dark:text-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {c.errors.rows.map((row) => (
              <tr key={row.status}>
                <td className="py-2"><code className="text-gray-800 dark:text-gray-200">{row.status}</code></td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: c.errors.errorFormat }} />

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.errors.rateLimitTitle}</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {c.errors.rateLimitHeaders.map((h) => (
                <th key={h} className="py-2 font-medium text-gray-700 dark:text-gray-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {c.errors.rateLimitRows.map((row) => (
              <tr key={row.plan}>
                <td className="py-2 text-gray-700 dark:text-gray-300">{row.plan}</td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{row.limit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: c.errors.rateLimitNote }} />
      </Section>

      {/* 6. SDK / Webhook Tips */}
      <Section title={c.tips.title} id="tips">
        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-gray-200">{c.tips.envTitle}</h3>
        <CodeBlock lang="bash">{`# .env
ASKDOCS_API_KEY=ask_your_api_key_here
ASKDOCS_BOT_ID=your_bot_id
ASKDOCS_BASE_URL=https://your-domain.com/api/v1`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.tips.errorHandlingTitle}</h3>
        <CodeBlock lang="python">{`import requests

def ask_bot(message: str, conversation_id: str | None = None):
    payload = {
        "bot_id": BOT_ID,
        "message": message,
    }
    if conversation_id:
        payload["conversation_id"] = conversation_id

    resp = requests.post(
        f"{BASE_URL}/chat",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json=payload,
    )

    if resp.status_code == 429:
        retry_after = int(resp.headers.get("Retry-After", 60))
        raise Exception(f"Rate limited. Retry after {retry_after}s")

    resp.raise_for_status()
    return resp.json()["data"]
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.tips.multiTurnTitle}</h3>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: c.tips.multiTurnDescription }} />
        <CodeBlock lang="javascript">{`// First message
const first = await askBot("What is your return policy?");
const conversationId = first.conversation_id;

// Follow-up (same conversation)
const followUp = await askBot("Do you ship internationally?", conversationId);
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800 dark:text-gray-200">{c.tips.webhookTitle}</h3>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{c.tips.webhookDescription}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700 dark:text-gray-300">
          {c.tips.webhookItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
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
    GET: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    POST: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    PUT: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    DELETE: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
      <div className="flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-bold ${colors[method] || 'bg-gray-100 dark:bg-gray-700'}`}>
          {method}
        </span>
        <code className="text-sm text-gray-800 dark:text-gray-200">{path}</code>
      </div>
      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">{children}</div>
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

function StepBox({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {step}
        </span>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
      </div>
      <div className="mt-2 pl-10 text-sm text-gray-600 dark:text-gray-400">{children}</div>
    </div>
  );
}
