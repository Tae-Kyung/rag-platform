import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '사용자 가이드 - AskDocs',
  description: 'AskDocs 웹사이트 사용법 튜토리얼. 회원가입부터 챗봇 배포까지.',
};

export default function UserGuidePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">사용자 가이드</h1>
      <p className="mt-3 text-gray-600">
        AskDocs를 사용하여 AI 챗봇을 만들고 배포하는 방법을 단계별로 안내합니다.
      </p>

      {/* Table of Contents */}
      <nav className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-700">목차</h2>
        <ol className="mt-3 space-y-2 text-sm">
          <li><a href="#getting-started" className="text-blue-600 hover:underline">1. 시작하기</a></li>
          <li><a href="#create-bot" className="text-blue-600 hover:underline">2. 봇 만들기</a></li>
          <li><a href="#add-knowledge" className="text-blue-600 hover:underline">3. 지식 추가</a></li>
          <li><a href="#channels" className="text-blue-600 hover:underline">4. 채널 연결</a></li>
          <li><a href="#conversations" className="text-blue-600 hover:underline">5. 대화 관리</a></li>
          <li><a href="#billing" className="text-blue-600 hover:underline">6. 요금제 &amp; 결제</a></li>
        </ol>
      </nav>

      {/* 1. 시작하기 */}
      <Section title="1. 시작하기" id="getting-started">
        <h3 className="mt-4 text-base font-semibold text-gray-800">회원가입</h3>
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-gray-700">
          <li>
            <Link href="/signup" className="text-blue-600 hover:underline">회원가입 페이지</Link>에 접속합니다.
          </li>
          <li>이메일과 비밀번호를 입력하고 &quot;Sign Up&quot; 버튼을 클릭합니다.</li>
          <li>이메일 인증 링크를 확인하고 클릭하면 가입이 완료됩니다.</li>
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800">로그인 & 대시보드</h3>
        <p className="mt-2 text-sm text-gray-700">
          로그인하면 <strong>대시보드</strong>로 이동합니다. 대시보드에서 봇 관리, 문서 업로드,
          채널 설정, 사용량 확인 등 모든 기능에 접근할 수 있습니다.
        </p>
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Tip:</strong> 무료 플랜으로 시작하면 봇 1개, 문서 10개, 월 100건의 메시지를 사용할 수 있습니다.
        </div>
      </Section>

      {/* 2. 봇 만들기 */}
      <Section title="2. 봇 만들기" id="create-bot">
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-gray-700">
          <li>대시보드에서 <strong>&quot;새 봇 만들기&quot;</strong> 버튼을 클릭합니다.</li>
          <li>봇 이름과 설명을 입력합니다. (예: &quot;고객 지원 봇&quot;, &quot;FAQ 도우미&quot;)</li>
          <li><strong>시스템 프롬프트</strong>를 설정합니다. 시스템 프롬프트는 봇의 성격과 답변 스타일을 결정합니다.</li>
          <li>&quot;생성&quot; 버튼을 클릭하면 봇이 생성됩니다.</li>
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800">시스템 프롬프트 예시</h3>
        <CodeBlock>{`당신은 친절한 고객 지원 담당자입니다.
제공된 문서를 기반으로 정확하게 답변하세요.
답변을 모를 경우 솔직하게 모른다고 말하세요.
한국어로 응답하세요.`}</CodeBlock>

        <h3 className="mt-6 text-base font-semibold text-gray-800">봇 설정 옵션</h3>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 font-medium text-gray-700">설정</th>
              <th className="py-2 font-medium text-gray-700">설명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 text-gray-800">봇 이름</td>
              <td className="py-2 text-gray-600">사용자에게 표시되는 봇의 이름</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-800">설명</td>
              <td className="py-2 text-gray-600">봇의 용도를 설명하는 짧은 문구</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-800">시스템 프롬프트</td>
              <td className="py-2 text-gray-600">봇의 성격, 답변 스타일, 언어 등을 지정</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-800">AI 모델</td>
              <td className="py-2 text-gray-600">GPT-4o-mini (기본), GPT-4o (Pro 이상)</td>
            </tr>
          </tbody>
        </table>
      </Section>

      {/* 3. 지식 추가 */}
      <Section title="3. 지식 추가" id="add-knowledge">
        <p className="mt-2 text-sm text-gray-700">
          봇이 답변할 수 있도록 지식 문서를 추가합니다. AskDocs는 세 가지 방법을 지원합니다.
        </p>

        <h3 className="mt-6 text-base font-semibold text-gray-800">PDF 업로드</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>봇 상세 페이지에서 <strong>&quot;문서&quot;</strong> 탭을 선택합니다.</li>
          <li>&quot;PDF 업로드&quot; 버튼을 클릭하고 파일을 선택합니다.</li>
          <li>업로드가 완료되면 자동으로 텍스트 추출, 청킹, 임베딩이 진행됩니다.</li>
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800">웹페이지 크롤링</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>&quot;URL 추가&quot; 버튼을 클릭합니다.</li>
          <li>크롤링할 웹페이지 URL을 입력합니다.</li>
          <li>AskDocs가 자동으로 페이지 내용을 가져와 지식으로 저장합니다.</li>
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800">Q&A 쌍 추가</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>&quot;Q&A 추가&quot; 버튼을 클릭합니다.</li>
          <li>질문과 답변을 직접 입력합니다.</li>
          <li>자주 묻는 질문에 대한 정확한 답변을 보장할 수 있습니다.</li>
        </ol>

        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <strong>참고:</strong> 문서가 처리되는 데 수 초~수 분이 소요될 수 있습니다.
          처리가 완료되면 상태가 &quot;완료&quot;로 변경됩니다.
        </div>
      </Section>

      {/* 4. 채널 연결 */}
      <Section title="4. 채널 연결" id="channels">
        <p className="mt-2 text-sm text-gray-700">
          봇을 다양한 채널에 연결하여 사용자와 소통할 수 있습니다.
        </p>

        <h3 className="mt-6 text-base font-semibold text-gray-800">웹 위젯 임베드</h3>
        <p className="mt-2 text-sm text-gray-700">
          웹사이트에 채팅 위젯을 추가하여 방문자가 봇과 대화할 수 있습니다.
        </p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>봇 상세 페이지에서 <strong>&quot;채널&quot;</strong> 탭을 선택합니다.</li>
          <li>&quot;웹 위젯&quot; 섹션에서 임베드 코드를 복사합니다.</li>
          <li>웹사이트의 <code>&lt;/body&gt;</code> 태그 앞에 코드를 붙여넣습니다.</li>
        </ol>
        <CodeBlock>{`<!-- AskDocs 채팅 위젯 -->
<script
  src="https://your-domain.com/widget.js"
  data-bot-id="YOUR_BOT_ID"
  async
></script>`}</CodeBlock>

        <h3 className="mt-6 text-base font-semibold text-gray-800">텔레그램 봇 연결</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>Telegram에서 <strong>@BotFather</strong>와 대화하여 새 봇을 생성합니다.</li>
          <li>BotFather가 제공하는 <strong>Bot Token</strong>을 복사합니다.</li>
          <li>AskDocs 채널 설정에서 Telegram 토큰을 입력하고 연결합니다.</li>
          <li>Webhook이 자동으로 설정되며, 즉시 사용 가능합니다.</li>
        </ol>

        <h3 className="mt-6 text-base font-semibold text-gray-800">카카오톡 연결</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li><a href="https://developers.kakao.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">카카오 개발자 센터</a>에서 애플리케이션을 생성합니다.</li>
          <li>채널 관리자 센터에서 카카오톡 채널을 생성합니다.</li>
          <li>AskDocs에서 카카오 App Key와 채널 정보를 입력하여 연결합니다.</li>
        </ol>
      </Section>

      {/* 5. 대화 관리 */}
      <Section title="5. 대화 관리" id="conversations">
        <h3 className="mt-4 text-base font-semibold text-gray-800">대화 내역 모니터링</h3>
        <p className="mt-2 text-sm text-gray-700">
          대시보드의 <strong>&quot;대화&quot;</strong> 탭에서 모든 대화 내역을 확인할 수 있습니다.
          각 대화의 채널(웹, 텔레그램, API 등), 언어, 메시지 수 등을 확인할 수 있습니다.
        </p>

        <h3 className="mt-6 text-base font-semibold text-gray-800">분석 대시보드</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
          <li>일별/월별 메시지 수 추이</li>
          <li>채널별 사용 비중</li>
          <li>인기 질문 및 응답 품질 지표</li>
          <li>문서별 참조 빈도</li>
        </ul>
      </Section>

      {/* 6. 요금제 & 결제 */}
      <Section title="6. 요금제 & 결제" id="billing">
        <h3 className="mt-4 text-base font-semibold text-gray-800">요금제 비교</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 font-medium text-gray-700">기능</th>
              <th className="py-2 font-medium text-gray-700">Free</th>
              <th className="py-2 font-medium text-gray-700">Pro</th>
              <th className="py-2 font-medium text-gray-700">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            <tr>
              <td className="py-2">봇 수</td>
              <td className="py-2">1개</td>
              <td className="py-2">10개</td>
              <td className="py-2">무제한</td>
            </tr>
            <tr>
              <td className="py-2">문서 수</td>
              <td className="py-2">10개</td>
              <td className="py-2">500개</td>
              <td className="py-2">무제한</td>
            </tr>
            <tr>
              <td className="py-2">월 메시지</td>
              <td className="py-2">100건</td>
              <td className="py-2">10,000건</td>
              <td className="py-2">무제한</td>
            </tr>
            <tr>
              <td className="py-2">저장 용량</td>
              <td className="py-2">50MB</td>
              <td className="py-2">5GB</td>
              <td className="py-2">무제한</td>
            </tr>
            <tr>
              <td className="py-2">API 접근</td>
              <td className="py-2">-</td>
              <td className="py-2">O</td>
              <td className="py-2">O</td>
            </tr>
            <tr>
              <td className="py-2">AI 모델</td>
              <td className="py-2">GPT-4o-mini</td>
              <td className="py-2">GPT-4o</td>
              <td className="py-2">GPT-4o + Claude</td>
            </tr>
          </tbody>
        </table>

        <h3 className="mt-6 text-base font-semibold text-gray-800">업그레이드 방법</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-700">
          <li>대시보드에서 <strong>&quot;Billing&quot;</strong> 메뉴로 이동합니다.</li>
          <li>원하는 요금제를 선택하고 &quot;업그레이드&quot;를 클릭합니다.</li>
          <li>Paddle을 통해 안전하게 결제를 완료합니다.</li>
        </ol>

        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>참고:</strong> 요금제에 대한 자세한 내용은{' '}
          <Link href="/pricing" className="font-medium text-blue-700 hover:underline">요금제 페이지</Link>를 확인하세요.
        </div>
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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
      <code>{children}</code>
    </pre>
  );
}
