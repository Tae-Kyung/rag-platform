import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개발자 가이드 - AskDocs',
  description: 'AskDocs API 연동 가이드. Python, JavaScript 코드 예제 포함.',
};

export default function DeveloperGuidePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">개발자 가이드</h1>
      <p className="mt-3 text-gray-600">
        AskDocs API를 사용하여 AI 챗봇을 애플리케이션에 연동하는 방법을 안내합니다.
      </p>

      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
        API 접근은 <strong>Pro</strong> 플랜 이상에서 사용 가능합니다.{' '}
        <Link href="/dashboard/billing" className="font-medium text-yellow-900 underline">
          요금제 업그레이드
        </Link>
      </div>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-700">목차</h2>
        <ol className="mt-3 space-y-2 text-sm">
          <li><a href="#quickstart" className="text-blue-600 hover:underline">1. 빠른 시작</a></li>
          <li><a href="#authentication" className="text-blue-600 hover:underline">2. 인증</a></li>
          <li><a href="#code-examples" className="text-blue-600 hover:underline">3. 코드 예제</a></li>
          <li><a href="#endpoints" className="text-blue-600 hover:underline">4. 엔드포인트 레퍼런스</a></li>
          <li><a href="#errors" className="text-blue-600 hover:underline">5. 에러 코드 &amp; Rate Limits</a></li>
          <li><a href="#tips" className="text-blue-600 hover:underline">6. SDK / Webhook 연동 팁</a></li>
        </ol>
      </nav>

      {/* 1. 빠른 시작 */}
      <Section title="1. 빠른 시작" id="quickstart">
        <p className="mt-2 text-sm text-gray-700">
          3단계로 첫 API 호출을 완료하세요.
        </p>
        <div className="mt-4 space-y-4">
          <StepBox step={1} title="API Key 발급">
            <p>
              <Link href="/dashboard/api-keys" className="text-blue-600 hover:underline">대시보드 &gt; API Keys</Link>에서
              새 API Key를 생성합니다. Key는 <code>ask_</code>로 시작하며, 생성 시 한 번만 표시됩니다.
            </p>
          </StepBox>
          <StepBox step={2} title="봇 ID 확인">
            <p>
              대시보드에서 연동할 봇의 상세 페이지로 이동하여 Bot ID를 복사합니다.
              URL에서 확인할 수도 있습니다: <code>/dashboard/bots/[BOT_ID]</code>
            </p>
          </StepBox>
          <StepBox step={3} title="첫 API 호출">
            <CodeBlock lang="bash">{`curl -X POST https://your-domain.com/api/v1/chat \\
  -H "Authorization: Bearer ask_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "YOUR_BOT_ID",
    "message": "안녕하세요, 반품 정책이 어떻게 되나요?"
  }'`}</CodeBlock>
          </StepBox>
        </div>
      </Section>

      {/* 2. 인증 */}
      <Section title="2. 인증" id="authentication">
        <p className="mt-2 text-sm text-gray-700">
          모든 API 요청에는 <code>Authorization</code> 헤더에 Bearer 토큰이 필요합니다.
        </p>
        <CodeBlock>{`Authorization: Bearer ask_your_api_key_here`}</CodeBlock>

        <h3 className="mt-6 text-base font-semibold text-gray-800">API Key 관리</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>API Key는 <Link href="/dashboard/api-keys" className="text-blue-600 hover:underline">대시보드 &gt; API Keys</Link>에서 생성/삭제할 수 있습니다.</li>
          <li>Key는 생성 시 한 번만 전체가 표시됩니다. 안전한 곳에 저장하세요.</li>
          <li>Key가 유출된 경우 즉시 삭제하고 새로 발급하세요.</li>
          <li>환경 변수에 저장하고, 코드에 직접 하드코딩하지 마세요.</li>
        </ul>
      </Section>

      {/* 3. 코드 예제 */}
      <Section title="3. 코드 예제" id="code-examples">

        <h3 className="mt-4 text-base font-semibold text-gray-800">Python (requests)</h3>
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
        "message": "반품 정책이 어떻게 되나요?",
    },
)

data = response.json()
print(data["data"]["content"])
# => "저희 반품 정책은..."
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800">JavaScript / Node.js (fetch)</h3>
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
    message: "반품 정책이 어떻게 되나요?",
  }),
});

const data = await response.json();
console.log(data.data.content);
// => "저희 반품 정책은..."
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800">cURL</h3>
        <CodeBlock lang="bash">{`curl -X POST https://your-domain.com/api/v1/chat \\
  -H "Authorization: Bearer ask_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": "YOUR_BOT_ID",
    "message": "반품 정책이 어떻게 되나요?"
  }'`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800">Python 스트리밍 (SSE)</h3>
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
        "message": "반품 정책이 어떻게 되나요?",
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

      {/* 4. 엔드포인트 레퍼런스 */}
      <Section title="4. 엔드포인트 레퍼런스" id="endpoints">

        {/* POST /v1/chat */}
        <Endpoint method="POST" path="/api/v1/chat">
          <p>봇에게 메시지를 보내고 AI 응답을 받습니다.</p>
          <h4 className="mt-3 text-sm font-semibold text-gray-700">Request Body</h4>
          <CodeBlock lang="json">{`{
  "bot_id": "uuid",
  "message": "What is your return policy?",
  "conversation_id": "uuid (optional, for follow-up)",
  "stream": false
}`}</CodeBlock>

          <h4 className="mt-3 text-sm font-semibold text-gray-700">Response (stream: false)</h4>
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

          <h4 className="mt-3 text-sm font-semibold text-gray-700">Streaming (stream: true)</h4>
          <p className="text-sm text-gray-600">
            Server-Sent Events (SSE) 형식으로 응답합니다.
          </p>
          <CodeBlock>{`data: {"type":"meta","conversation_id":"...","message_id":"...","confidence":"high"}
data: {"type":"content","content":"Our return"}
data: {"type":"content","content":" policy allows..."}
data: {"type":"sources","sources":[{"title":"FAQ.pdf","similarity":92}]}
data: {"type":"done"}`}</CodeBlock>
        </Endpoint>

        {/* GET /v1/bots/:botId */}
        <Endpoint method="GET" path="/api/v1/bots/:botId">
          <p>봇 정보를 조회합니다.</p>
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
          <p>봇의 대화 목록을 조회합니다.</p>
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
          <p>대화의 전체 메시지를 조회합니다.</p>
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
          <p>현재 사용량과 플랜 제한을 조회합니다.</p>
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

      {/* 5. 에러 코드 & Rate Limits */}
      <Section title="5. 에러 코드 & Rate Limits" id="errors">
        <h3 className="mt-4 text-base font-semibold text-gray-800">에러 코드</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 font-medium text-gray-700">Status</th>
              <th className="py-2 font-medium text-gray-700">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2"><code>400</code></td>
              <td className="py-2 text-gray-700">잘못된 요청 (필수 필드 누락, 유효하지 않은 입력)</td>
            </tr>
            <tr>
              <td className="py-2"><code>401</code></td>
              <td className="py-2 text-gray-700">인증 실패 (API Key 누락 또는 유효하지 않음)</td>
            </tr>
            <tr>
              <td className="py-2"><code>403</code></td>
              <td className="py-2 text-gray-700">접근 거부 (플랜이 API를 지원하지 않거나 봇 비활성)</td>
            </tr>
            <tr>
              <td className="py-2"><code>404</code></td>
              <td className="py-2 text-gray-700">리소스를 찾을 수 없음 (봇 또는 대화가 존재하지 않음)</td>
            </tr>
            <tr>
              <td className="py-2"><code>429</code></td>
              <td className="py-2 text-gray-700">Rate Limit 초과 또는 메시지 할당량 초과</td>
            </tr>
            <tr>
              <td className="py-2"><code>500</code></td>
              <td className="py-2 text-gray-700">서버 내부 오류</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3 text-sm text-gray-500">
          모든 에러 응답 형식: <code>{`{"success": false, "error": "description"}`}</code>
        </p>

        <h3 className="mt-8 text-base font-semibold text-gray-800">Rate Limits</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 font-medium text-gray-700">플랜</th>
              <th className="py-2 font-medium text-gray-700">제한</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 text-gray-700">Pro</td>
              <td className="py-2 text-gray-700">60 requests / minute</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-700">Enterprise</td>
              <td className="py-2 text-gray-700">300 requests / minute</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-sm text-gray-500">
          Rate Limit 관련 헤더: <code>X-RateLimit-Remaining</code>, <code>Retry-After</code>
        </p>
      </Section>

      {/* 6. SDK / Webhook 연동 팁 */}
      <Section title="6. SDK / Webhook 연동 팁" id="tips">
        <h3 className="mt-4 text-base font-semibold text-gray-800">환경 변수 관리</h3>
        <CodeBlock lang="bash">{`# .env
ASKDOCS_API_KEY=ask_your_api_key_here
ASKDOCS_BOT_ID=your_bot_id
ASKDOCS_BASE_URL=https://your-domain.com/api/v1`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800">에러 핸들링 패턴</h3>
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

        <h3 className="mt-8 text-base font-semibold text-gray-800">대화 이어가기 (Multi-turn)</h3>
        <p className="mt-2 text-sm text-gray-700">
          첫 번째 응답에서 받은 <code>conversation_id</code>를 다음 요청에 포함하면 대화를 이어갈 수 있습니다.
        </p>
        <CodeBlock lang="javascript">{`// 첫 번째 메시지
const first = await askBot("반품 정책이 뭔가요?");
const conversationId = first.conversation_id;

// 후속 메시지 (같은 대화)
const followUp = await askBot("해외 주문도 가능한가요?", conversationId);
`}</CodeBlock>

        <h3 className="mt-8 text-base font-semibold text-gray-800">Webhook 활용</h3>
        <p className="mt-2 text-sm text-gray-700">
          Telegram, 카카오톡 등의 메신저 연동은 Webhook 방식으로 동작합니다.
          AskDocs가 자동으로 Webhook을 설정하므로 별도의 서버 구성이 필요하지 않습니다.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>Telegram: 채널 설정에서 Bot Token 입력 시 자동 Webhook 등록</li>
          <li>카카오톡: 카카오 개발자 센터에서 Webhook URL 설정 필요</li>
          <li>커스텀 Webhook: REST API를 활용하여 직접 구현 가능</li>
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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {step}
        </span>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="mt-2 pl-10 text-sm text-gray-600">{children}</div>
    </div>
  );
}
