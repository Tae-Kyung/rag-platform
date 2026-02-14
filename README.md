# AskDocs — RAG-as-a-Service Platform

Your documents, your AI — instantly.

AskDocs는 문서를 업로드하면 5분 만에 AI 챗봇을 생성하고, 다양한 채널에 배포할 수 있는 SaaS 플랫폼입니다.

## Features

- **즉시 챗봇 생성** — PDF, URL, Q&A를 업로드하면 RAG 기반 AI 챗봇이 자동 생성
- **멀티 채널 배포** — 웹 위젯, Telegram, KakaoTalk, WeChat, REST API
- **하이브리드 검색** — 벡터 검색(pgvector) + 키워드 검색 결합으로 높은 정확도
- **스트리밍 응답** — SSE 기반 실시간 응답
- **분석 대시보드** — 대화 트렌드, 자주 묻는 질문, 채널별 통계
- **다국어 지원** — 한국어, 영어 (자동 언어 감지)
- **구독 과금** — Paddle 기반 월간/연간 구독 (Free, Starter, Pro, Enterprise)

## Tech Stack

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| State | Zustand 5 |
| Auth & DB | Supabase (PostgreSQL + pgvector + Auth + Storage) |
| LLM | OpenAI API (GPT-4o-mini, GPT-4o) |
| Embeddings | text-embedding-3-small (1536차원) |
| Payments | Paddle |
| i18n | next-intl (ko, en) |
| Testing | Vitest, Testing Library |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase 프로젝트 ([supabase.com](https://supabase.com))
- OpenAI API Key ([platform.openai.com](https://platform.openai.com))

### Installation

```bash
# 저장소 클론
git clone https://github.com/Tae-Kyung/rag-platform.git
cd rag-platform

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 실제 키 값으로 수정
```

### Database Setup

1. Supabase 프로젝트에서 pgvector 확장 활성화
2. 마이그레이션 파일 순서대로 실행:

```
supabase/migrations/
├── 00001_platform_schema.sql    # 핵심 테이블
├── 00002_rls_policies.sql       # Row-Level Security
├── 00003_triggers.sql           # 트리거
├── 00004_storage_bucket.sql     # 파일 스토리지
├── 00005_stripe_to_paddle.sql   # Paddle 결제
└── 00006_telegram_chat_mappings.sql  # Telegram 매핑
```

3. 초기 데이터 시드: `supabase/seed.sql`

### Environment Variables

`.env.example`을 참고하여 `.env.local`을 설정합니다:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Paddle
PADDLE_API_KEY=pdl_test_your-paddle-api-key
PADDLE_WEBHOOK_SECRET=pdl_ntfset_your-webhook-secret
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_your-paddle-client-token
NEXT_PUBLIC_PADDLE_ENV=sandbox

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npm run dev       # 개발 서버 (http://localhost:3000)
npm run build     # 프로덕션 빌드
npm start         # 프로덕션 서버
npm run lint      # ESLint
npm run test      # 테스트 (watch)
npm run test:run  # 테스트 (1회)
```

## Architecture

```
사용자 쿼리
  → 언어 감지
  → 임베딩 생성 (OpenAI text-embedding-3-small)
  → 하이브리드 검색 (벡터 + 키워드)
  → Top-K 결과 추출 & 중복 제거
  → 시스템 프롬프트 조합 (봇 성격 + 컨텍스트)
  → OpenAI Chat Completion (스트리밍)
  → 응답 + 출처 반환
```

## Pricing Plans

| Plan | 월 요금 | 메시지/월 | 문서 | 저장소 | 채널 | API |
|------|---------|----------|------|--------|------|-----|
| Free | $0 | 100 | 3 | 100MB | Web | - |
| Starter | $29 | 3,000 | 20 | 500MB | Web, Telegram | - |
| Pro | $99 | 15,000 | 100 | 2GB | 전체 | O |
| Enterprise | $299 | 무제한 | 무제한 | 무제한 | 전체 + 커스텀 | O |

## API

공개 API는 `/api/v1/*` 경로로 제공됩니다. API 키를 Bearer 토큰으로 전달합니다.

```bash
# 챗봇에 메시지 보내기
curl -X POST https://your-domain.com/api/v1/chat \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "bot-uuid", "message": "안녕하세요?"}'
```

주요 엔드포인트:
- `POST /api/v1/chat` — 챗봇 대화
- `GET /api/v1/conversations` — 대화 목록
- `GET /api/v1/conversations/:id/messages` — 메시지 내역
- `GET /api/v1/bots/:id` — 봇 정보
- `GET /api/v1/usage` — API 사용량

## Widget Embed

웹사이트에 1줄의 스크립트로 챗봇 위젯을 삽입할 수 있습니다:

```html
<script src="https://your-domain.com/widget.js" data-bot-id="your-bot-id"></script>
```

## Project Structure

```
src/
├── app/                 # Next.js App Router (페이지 + API)
├── lib/                 # 핵심 비즈니스 로직
│   ├── auth/            # 인증 가드, API 키, Rate Limit
│   ├── billing/         # Paddle 결제, 사용량 추적
│   ├── channels/        # Telegram 등 채널 통합
│   ├── rag/             # RAG 파이프라인 (청킹, 임베딩, 검색)
│   └── supabase/        # Supabase 클라이언트
├── features/            # 도메인별 컴포넌트
├── components/          # 공유 UI 컴포넌트
├── hooks/               # 커스텀 훅
├── types/               # TypeScript 타입
├── config/              # 설정 상수
└── i18n/                # 다국어 메시지
```

## License

Private — All rights reserved.
