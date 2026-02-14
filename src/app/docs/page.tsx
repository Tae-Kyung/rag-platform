import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - AskDocs',
  description: 'AskDocs 사용 가이드 및 API 개발자 문서',
};

export default function DocsHubPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
      <p className="mt-3 text-gray-600">
        AskDocs를 시작하는 데 필요한 모든 정보를 확인하세요. 웹사이트 사용법부터 API 연동까지 안내합니다.
      </p>

      {/* Guide Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {/* User Guide Card */}
        <Link
          href="/docs/user-guide"
          className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
            사용자 가이드
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            회원가입, 봇 생성, 지식 추가, 채널 연결까지 AskDocs 웹사이트 사용법을 단계별로 안내합니다.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
            가이드 보기
            <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </Link>

        {/* Developer Guide Card */}
        <Link
          href="/docs/developer"
          className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
            개발자 가이드
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            API Key 발급, Python/JavaScript 코드 예제, 엔드포인트 레퍼런스 등 API 연동에 필요한 모든 정보.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
            API 문서 보기
            <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="mt-12">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">빠른 링크</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <QuickLink href="/docs/user-guide#getting-started" label="시작하기" description="회원가입 및 로그인" />
          <QuickLink href="/docs/user-guide#create-bot" label="봇 만들기" description="첫 번째 챗봇 생성" />
          <QuickLink href="/docs/user-guide#add-knowledge" label="지식 추가" description="PDF, 웹페이지, Q&A" />
          <QuickLink href="/docs/user-guide#channels" label="채널 연결" description="웹 위젯, 텔레그램, 카카오톡" />
          <QuickLink href="/docs/developer#quickstart" label="API 빠른 시작" description="3단계로 첫 API 호출" />
          <QuickLink href="/docs/developer#code-examples" label="코드 예제" description="Python, JavaScript, cURL" />
          <QuickLink href="/docs/developer#endpoints" label="엔드포인트 레퍼런스" description="전체 API 엔드포인트" />
          <QuickLink href="/docs/developer#errors" label="에러 코드" description="에러 코드 및 Rate Limits" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 transition hover:border-gray-200 hover:bg-gray-50"
    >
      <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </Link>
  );
}
