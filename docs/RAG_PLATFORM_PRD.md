# PRD2: RAG Platform — 상용 SaaS 서비스

> **Version:** 1.0
> **Date:** 2026-02-14
> **Base Code:** [k-chatbot](https://github.com/Tae-Kyung/k-chatbot) (Next.js 16 + Supabase + OpenAI)
> **Target Repo:** https://github.com/Tae-Kyung/rag-platform.git

---

## 1. 제품 개요

### 1.1 비전
누구나 자신의 문서·URL·Q&A를 업로드하여 **AI 챗봇을 즉시 생성**하고, 웹·텔레그램·위챗·카카오톡·WhatsApp 등 다양한 채널에 배포할 수 있는 **RAG-as-a-Service 플랫폼**.

### 1.2 브랜드
| 항목 | 내용 |
|------|------|
| **서비스명** | **AskDocs** (가칭) |
| **태그라인** | "Your documents, your AI — instantly." |
| **도메인** | askdocs.ai (또는 askdocs.io) |
| **로고 컨셉** | 문서 아이콘 + 말풍선 조합, 미니멀 디자인 |

### 1.3 핵심 가치
- **5분 안에 챗봇 생성** — 가입 → 문서 업로드 → 챗봇 배포
- **멀티채널 통합** — 웹 위젯, 텔레그램, 위챗, 카카오톡, WhatsApp
- **API 제공** — 유료 사용자는 API 키로 자체 시스템에 통합
- **투명한 요금** — 무료 체험 후 합리적 월정액 구독

---

## 2. 사용자 역할

| 역할 | 설명 |
|------|------|
| **Visitor** | 비로그인 상태에서 랜딩 페이지, 가격 페이지, 데모 챗봇 체험 |
| **Owner (가입자)** | 회원가입 후 자신의 봇 생성·관리, 문서 업로드, 채널 연동, 대시보드 이용 |
| **End User** | 가입자가 만든 챗봇과 대화하는 최종 사용자 (비로그인) |
| **System Admin** | 플랫폼 전체 관리 — 사용자 현황, 트래픽, 매출, 모니터링 |

---

## 3. 가격 정책

### 3.1 요금제 비교

| | **Free** | **Starter** | **Pro** | **Enterprise** |
|---|---------|-------------|---------|----------------|
| **월 요금** | $0 | $29/월 | $99/월 | $299/월 (또는 협의) |
| **연 요금** | — | $24/월 (연 $288) | $83/월 (연 $996) | $249/월 (연 $2,988) |
| **봇 수** | 1 | 3 | 10 | 무제한 |
| **메시지/월** | 100 | 3,000 | 15,000 | 무제한 |
| **문서 용량** | 1MB (최대 3건) | 10MB (최대 20건) | 100MB (최대 100건) | 무제한 |
| **지원 파일** | PDF, TXT, URL | + DOCX, XLSX, HWP | + 모든 포맷 | + 모든 포맷 |
| **Q&A 직접 등록** | 10건 | 100건 | 1,000건 | 무제한 |
| **채널 연동** | 웹 위젯 | + Telegram | + WeChat, KakaoTalk, WhatsApp | + 모든 채널 + 커스텀 |
| **API 액세스** | ✗ | ✗ | ✓ (Rate limit: 60 req/min) | ✓ (Rate limit: 300 req/min) |
| **팀 멤버** | 1 | 2 | 5 | 무제한 |
| **분석·통계** | 기본 | 대화 분석 | + 감성 분석, 키워드 트렌드 | + 커스텀 리포트 |
| **브랜딩 제거** | ✗ | ✗ | ✓ | ✓ |
| **LLM 모델** | GPT-4o Mini | GPT-4o Mini | GPT-4o / Claude | GPT-4o / Claude + BYO Key |
| **SLA** | — | — | 99.5% | 99.9% |
| **지원** | 커뮤니티 | 이메일 | 우선 이메일 | 전담 매니저 |

### 3.2 초과 요금 (Overage)

| 항목 | 요금 |
|------|------|
| 추가 메시지 1,000건 | $10 |
| 추가 문서 스토리지 10MB | $5 |
| 추가 봇 1개 | $5/월 |
| 브랜딩 제거 (Starter) | $19/월 추가 |

### 3.3 결제 수단
- **Paddle** 연동 (Merchant of Record — 세금/VAT 자동 처리)
- 신용카드, 체크카드, PayPal, Apple Pay, Google Pay
- 연간 결제 시 **약 17% 할인** (2개월 무료)
- 자동 갱신, 언제든 해지 가능
- 영수증·인보이스 자동 발행 (Paddle이 세금 계산서 발행)

---

## 4. 기능 명세

### 4.1 인증 & 가입

| 기능 | 설명 |
|------|------|
| 이메일/비밀번호 가입 | Supabase Auth 기본 |
| 소셜 로그인 | Google, GitHub OAuth |
| 이메일 인증 | 가입 시 확인 이메일 발송 |
| 비밀번호 재설정 | Magic link 방식 |
| 프로필 관리 | 이름, 회사명, 프로필 이미지, 타임존 |

### 4.2 봇 관리 (Owner Dashboard)

#### 4.2.1 봇 생성·설정
- 봇 이름, 설명, 아바타 이미지
- 환영 메시지 커스터마이징
- 시스템 프롬프트 (봇 성격·역할 지정)
- 응답 언어 설정 (자동 감지 / 고정)
- LLM 파라미터 조정 (temperature, max tokens)
- 커스텀 도메인 (Enterprise)

#### 4.2.2 지식 베이스 (Knowledge Base)
- **문서 업로드**: PDF, TXT, DOCX, XLSX, HWP, CSV, Markdown
- **URL 크롤링**: 단일 URL 또는 사이트맵 기반 일괄 크롤링
- **Q&A 직접 등록**: 질문-답변 쌍 수동 입력 + CSV 일괄 업로드 (RFC 4180 호환 파서, 템플릿 제공, SSE 실시간 진행률 표시)
- 문서별 처리 상태 표시 (pending → processing → completed/failed)
- 문서별 청크 수, 토큰 수 표시
- 문서 삭제 시 확인 모달 표시 후 관련 청크·임베딩 자동 정리
- **문서 목록 페이지네이션** (20건 단위) + 타입별 필터 탭 (All/File/URL/Q&A, 카운트 배지)
- **Q&A 인라인 편집**: 질문 클릭 → 모달에서 질문/답변/카테고리 수정, 저장 시 임베딩 자동 재생성
- **URL 문서 페이지 제목 표시**: 크롤링 시 페이지 타이틀 자동 저장, 클릭 시 원본 URL 이동
- **파일 다운로드**: 파일명 클릭 시 Supabase Storage signed URL 기반 다운로드
- **일괄 삭제**: 체크박스 다중 선택 후 확인 모달을 거쳐 일괄 삭제
- **자동 재크롤링**: URL 소스 주기적 업데이트 (Pro 이상, 주 1회)

#### 4.2.3 채널 연동

**웹 위젯**
- iframe 기반 삽입 코드 (`<script>` 1줄)
- 플로팅 버튼 커스터마이징 (위치, 색상, 아이콘)
- 반응형 디자인 (모바일·데스크톱)

**Telegram**
- Bot Token 입력 → 자동 Webhook 등록
- 그룹 챗 지원 (`/ask` 명령어)
- 인라인 모드 지원

**KakaoTalk** (Pro 이상)
- 카카오 i 오픈빌더 채널 연동
- 스킬 서버 API endpoint 제공
- 카카오 비즈니스 채널 필요

**WeChat** (Pro 이상)
- 위챗 공식계정(公众号) 연동
- 메시지 XML 파싱 + 응답
- 위챗 서비스 계정 필요

**WhatsApp** (Pro 이상)
- WhatsApp Business API 연동
- Webhook 기반 메시지 수신·응답
- Meta Business 계정 필요

#### 4.2.4 API 액세스 (Pro 이상)
```
POST https://api.askdocs.ai/v1/chat
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "bot_id": "bot_xxxxx",
  "message": "사용자 질문",
  "conversation_id": "optional_session_id",
  "stream": true
}
```

- API 키 생성·폐기 관리
- Rate limiting (플랜별 차등)
- 사용량 실시간 모니터링
- Webhook 콜백 설정 (대화 완료 시 알림)

### 4.3 Owner 대시보드

#### 4.3.1 분석·통계
- **일별/주별/월별 대화 수** (라인 차트)
- **채널별 대화 분포** (파이 차트: 웹, Telegram, Kakao, WeChat, API)
- **인기 질문 TOP 10** (키워드 클라우드)
- **응답 만족도** (피드백 기반 별점 평균)
- **언어별 사용 분포**
- **응답 시간 평균** (P50, P95)
- **미답변/실패 질문 목록** (개선 포인트 파악)

#### 4.3.2 대화 로그
- 전체 대화 이력 검색·필터
- 대화별 소스 문서 확인
- 피드백(별점·코멘트) 확인
- CSV/JSON 내보내기

#### 4.3.3 결제·빌링
- 현재 플랜 및 사용량 표시
- 플랜 업/다운그레이드
- 결제 수단 관리 (Paddle 구독 관리 API)
- 인보이스·영수증 목록 및 PDF 다운로드
- 결제 이력 조회
- 다음 결제일·예상 금액 표시

#### 4.3.4 팀 관리 (Starter 이상)
- 팀원 초대 (이메일)
- 역할 구분: Owner, Editor, Viewer
- 팀원별 활동 로그

### 4.4 시스템 관리자 대시보드

#### 4.4.1 사용자 관리
- 전체 가입자 목록 (가입일, 플랜, 상태)
- 사용자별 상세 정보 (봇 수, 문서 수, 메시지 사용량)
- 사용자 계정 정지/해제
- 플랜 수동 변경

#### 4.4.2 트래픽 모니터링
- **실시간 대시보드** — 동시 접속자, 분당 요청 수
- **일별/주별/월별 트래픽 추이** (전체 + 사용자별)
- **API 호출 모니터링** — 엔드포인트별 호출 수, 레이턴시
- **에러율 모니터링** — 5xx, 타임아웃, LLM 실패 비율
- **LLM 토큰 사용량** — 전체 및 사용자별 (비용 추적)

#### 4.4.3 매출 모니터링
- **MRR (Monthly Recurring Revenue)** 추이
- **ARR (Annual Recurring Revenue)** 계산
- **플랜별 가입자 분포** (파이 차트)
- **Churn Rate** (월별 이탈률)
- **ARPU** (가입자당 평균 매출)
- **LTV** (고객 생애 가치) 추정
- **결제 실패·재시도 현황**

#### 4.4.4 시스템 상태
- Supabase DB 연결 상태, 스토리지 사용량
- Vercel 함수 실행 시간·메모리
- OpenAI API 할당량·잔여량
- 전체 벡터 DB 크기 (pgvector)

---

## 5. 기술 아키텍처

### 5.1 Tech Stack

| 레이어 | 기술 | 비고 |
|--------|------|------|
| **프론트엔드** | Next.js 16 (App Router) | 기존 코드베이스 활용 |
| **스타일링** | Tailwind CSS 4 | |
| **상태관리** | Zustand | |
| **인증** | Supabase Auth | Google, GitHub OAuth 추가 |
| **데이터베이스** | Supabase PostgreSQL + pgvector | RLS 기반 멀티테넌시 |
| **스토리지** | Supabase Storage | 문서 파일 저장 |
| **결제** | Paddle | Checkout Overlay, Subscription API, Webhooks (MoR) |
| **LLM** | OpenAI API (기본) | 사용자 BYO Key 지원 (Enterprise) |
| **임베딩** | text-embedding-3-small | 1536 차원 |
| **배포** | Vercel | Serverless Functions |
| **모니터링** | Vercel Analytics + 커스텀 로깅 | |
| **이메일** | Resend (또는 Supabase Auth 기본) | 가입 확인, 알림 |
| **i18n** | next-intl | ko, en (구현 완료), zh, ja (확장 가능), IP 기반 자동 언어 감지 |
| **테마** | next-themes + Tailwind CSS `dark:` | 다크/라이트 모드 전환 (전체 페이지 적용 완료) |

### 5.2 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
├──────────┬──────────┬───────────┬───────────┬───────────┤
│  Web App │  Widget  │ Telegram  │  KakaoTalk│  WeChat   │
│ (Next.js)│ (iframe) │   Bot     │  채널     │  공식계정  │
└────┬─────┴────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘
     │          │           │           │           │
     ▼          ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────┐
│               API Gateway (Vercel Edge)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Auth Guard│ │Rate Limit│ │Plan Check│ │Usage Track│  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     ▼                   ▼                   ▼
┌──────────┐     ┌──────────────┐     ┌───────────┐
│ Chat API │     │ Owner APIs   │     │ Admin APIs│
│ /v1/chat │     │ /api/owner/* │     │ /api/sys/*│
└────┬─────┘     └──────┬───────┘     └─────┬─────┘
     │                  │                   │
     ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Business Logic                         │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐  │
│  │RAG Pipe │ │Doc Proc │ │Channel   │ │Billing      │  │
│  │(Search) │ │(Parse/  │ │Connector │ │(Paddle)     │  │
│  │         │ │Chunk/   │ │          │ │             │  │
│  │         │ │Embed)   │ │          │ │             │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘ └──────┬──────┘  │
└───────┼───────────┼───────────┼───────────────┼─────────┘
        │           │           │               │
        ▼           ▼           ▼               ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Layer (Supabase)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │PostgreSQL│ │ pgvector │ │ Storage  │ │   Auth    │  │
│  │  + RLS   │ │(embeddings)│ │ (files)  │ │(sessions) │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 5.3 데이터베이스 스키마 (신규·변경)

기존 k-chatbot 테이블을 **멀티테넌트 SaaS**로 확장한다.

```sql
-- ============================================================
-- 1. 사용자·조직
-- ============================================================

-- profiles: Supabase Auth 연동 사용자 프로필
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  company       TEXT,
  avatar_url    TEXT,
  timezone      TEXT DEFAULT 'Asia/Seoul',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- plans: 구독 플랜 정의
CREATE TABLE plans (
  id              TEXT PRIMARY KEY, -- 'free', 'starter', 'pro', 'enterprise'
  name            TEXT NOT NULL,
  price_monthly   INTEGER NOT NULL, -- cents (e.g., 2900 = $29)
  price_yearly    INTEGER NOT NULL, -- cents (e.g., 28800 = $288/year)
  max_bots        INTEGER NOT NULL,
  max_messages    INTEGER NOT NULL, -- per month
  max_storage_mb  INTEGER NOT NULL,
  max_documents   INTEGER NOT NULL,
  max_qa          INTEGER NOT NULL,
  max_team_members INTEGER NOT NULL,
  channels        JSONB NOT NULL,   -- ["web","telegram","kakao","wechat"]
  api_access      BOOLEAN DEFAULT FALSE,
  api_rate_limit  INTEGER DEFAULT 0, -- req/min
  branding_removal BOOLEAN DEFAULT FALSE,
  llm_models      JSONB NOT NULL,   -- ["gpt-4o-mini","gpt-4o","claude"]
  features        JSONB DEFAULT '{}' -- 기타 기능 플래그
);

-- subscriptions: 사용자 구독 정보
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id             TEXT NOT NULL REFERENCES plans(id),
  status              TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, trialing
  paddle_customer_id  TEXT,
  paddle_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- usage_records: 월별 사용량 추적
CREATE TABLE usage_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  period      TEXT NOT NULL, -- 'YYYY-MM'
  messages    INTEGER DEFAULT 0,
  storage_mb  NUMERIC DEFAULT 0,
  api_calls   INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period)
);

-- invoices: 결제 이력
CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id),
  paddle_transaction_id TEXT,
  amount              INTEGER NOT NULL, -- cents
  currency            TEXT DEFAULT 'usd',
  status              TEXT NOT NULL, -- paid, open, void, uncollectible
  invoice_url         TEXT,
  invoice_pdf         TEXT,
  period_start        TIMESTAMPTZ,
  period_end          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. 봇·지식베이스
-- ============================================================

-- bots: 챗봇 인스턴스
CREATE TABLE bots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  avatar_url      TEXT,
  welcome_message TEXT DEFAULT 'Hello! How can I help you?',
  system_prompt   TEXT DEFAULT 'You are a helpful assistant.',
  language_mode   TEXT DEFAULT 'auto', -- 'auto' | 'ko' | 'en' | ...
  llm_model       TEXT DEFAULT 'gpt-4o-mini',
  temperature     NUMERIC DEFAULT 0.7,
  max_tokens      INTEGER DEFAULT 1024,
  is_active       BOOLEAN DEFAULT TRUE,
  custom_domain   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- documents: 업로드 문서
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id        UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id),
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL, -- 'pdf','txt','docx','url','qa',...
  file_size     INTEGER DEFAULT 0, -- bytes
  storage_path  TEXT,
  source_url    TEXT, -- URL 크롤링인 경우
  status        TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  chunk_count   INTEGER DEFAULT 0,
  error_message TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- document_chunks: 문서 청크 + 임베딩
CREATE TABLE document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  bot_id      UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(1536),
  chunk_index INTEGER NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- IVFFlat 인덱스
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- qa_pairs: 직접 등록 Q&A
CREATE TABLE qa_pairs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  embedding   vector(1536),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. 대화·메시지
-- ============================================================

-- conversations: 대화 세션
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL DEFAULT 'web', -- web, telegram, kakao, wechat, api
  channel_uid TEXT, -- 채널별 사용자 식별자
  language    TEXT DEFAULT 'auto',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- messages: 개별 메시지
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL, -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  sources         JSONB DEFAULT '[]',
  token_count     INTEGER DEFAULT 0,
  latency_ms      INTEGER,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- feedback: 대화 피드백
CREATE TABLE feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. 채널 연동
-- ============================================================

-- channel_configs: 봇별 채널 설정
CREATE TABLE channel_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL, -- 'telegram','kakao','wechat'
  config      JSONB NOT NULL, -- 채널별 인증 정보 (암호화)
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bot_id, channel)
);

-- ============================================================
-- 5. API 키
-- ============================================================

-- api_keys: Owner의 외부 API 연동 키
CREATE TABLE api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL, -- 키 별칭
  key_hash    TEXT NOT NULL, -- SHA-256 해시 저장
  key_prefix  TEXT NOT NULL, -- 'ask_xxxx' (표시용 앞 8자)
  last_used   TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(key_hash)
);

-- ============================================================
-- 6. 팀
-- ============================================================

-- team_members: 봇 공동 관리
CREATE TABLE team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- 초대한 Owner
  member_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- 초대받은 멤버
  role        TEXT NOT NULL DEFAULT 'viewer', -- 'owner','editor','viewer'
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, member_id)
);

-- ============================================================
-- 7. 시스템 관리
-- ============================================================

-- system_logs: 관리자용 이벤트 로그
CREATE TABLE system_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  TEXT NOT NULL, -- 'signup','upgrade','downgrade','payment_failed',...
  user_id     UUID REFERENCES profiles(id),
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 RLS (Row Level Security) 정책

```sql
-- profiles: 본인만 읽기/수정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- bots: 본인 소유 봇만 CRUD
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own bots" ON bots FOR ALL USING (auth.uid() = user_id);

-- documents: 본인 봇의 문서만
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own documents" ON documents FOR ALL USING (auth.uid() = user_id);

-- conversations: 봇 소유자가 조회, End User는 service role로 삽입
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot owners read conversations" ON conversations FOR SELECT
  USING (bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid()));

-- messages: 대화 소속 봇 소유자 조회
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot owners read messages" ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT c.id FROM conversations c JOIN bots b ON c.bot_id = b.id WHERE b.user_id = auth.uid()
  ));

-- 기타 테이블도 동일 패턴 적용
```

---

## 6. API 설계

### 6.1 Public API (Pro 이상)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/v1/chat` | 챗봇 대화 (스트리밍 지원) |
| POST | `/v1/chat/completions` | OpenAI 호환 형식 |
| GET | `/v1/bots/{bot_id}` | 봇 정보 조회 |
| GET | `/v1/conversations` | 대화 목록 |
| GET | `/v1/conversations/{id}/messages` | 대화 내역 |
| POST | `/v1/documents` | 문서 업로드 |
| DELETE | `/v1/documents/{id}` | 문서 삭제 |
| GET | `/v1/usage` | 사용량 조회 |

### 6.2 Internal API (웹 앱용)

| 그룹 | Endpoints |
|------|-----------|
| **Auth** | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/reset-password` |
| **Owner - Bots** | `GET/POST /api/owner/bots`, `GET/PUT/DELETE /api/owner/bots/{id}` |
| **Owner - Documents** | `GET/POST /api/owner/bots/{id}/documents`, `DELETE /api/owner/bots/{id}/documents/{docId}`, `POST /api/owner/bots/{id}/documents/crawl`, `POST /api/owner/bots/{id}/qa` |
| **Owner - Channels** | `GET/POST/PUT/DELETE /api/owner/bots/{id}/channels/{channel}` |
| **Owner - Analytics** | `GET /api/owner/bots/{id}/stats`, `GET /api/owner/bots/{id}/conversations` |
| **Owner - Billing** | `GET /api/owner/billing`, `POST /api/owner/billing/checkout`, `POST /api/owner/billing/portal` |
| **Owner - API Keys** | `GET/POST/DELETE /api/owner/api-keys` |
| **Owner - Team** | `GET/POST/DELETE /api/owner/team` |
| **Chat** | `POST /api/chat` (End User용, 인증 불요) |
| **Webhooks** | `POST /api/webhooks/paddle`, `POST /api/webhooks/telegram/{botId}`, `POST /api/webhooks/kakao/{botId}`, `POST /api/webhooks/whatsapp/{botId}`, `POST /api/webhooks/wechat/{botId}` |
| **System Admin** | `GET /api/sys/users`, `GET /api/sys/traffic`, `GET /api/sys/revenue`, `GET /api/sys/system-status`, `PUT /api/sys/users/{id}` |

---

## 7. 화면 구성

### 7.1 Public 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 랜딩 페이지 | `/` | 서비스 소개, 기능 요약, CTA |
| 가격 페이지 | `/pricing` | 플랜 비교 테이블, FAQ |
| 데모 | `/demo` | 샘플 챗봇 체험 |
| 로그인 | `/login` | 이메일 + 소셜 로그인 |
| 회원가입 | `/signup` | 이메일 + 소셜 가입 |
| Docs 허브 | `/docs` | API 문서 + 사용자 가이드 + 개발자 가이드 |
| 사용자 가이드 | `/docs/user-guide` | 봇 생성·문서 업로드·채널 연동 가이드 |
| 개발자 가이드 | `/docs/developer-guide` | API 인증·엔드포인트·코드 예시 |
| 개인정보처리방침 | `/privacy` | GDPR/개인정보 |
| 이용약관 | `/terms` | 서비스 이용약관 |
| 환불 정책 | `/refund` | Paddle 결제 환불 정책 |

### 7.2 Owner 대시보드 (`/dashboard/*`)

> **반응형:** 모바일에서 사이드바는 햄버거 메뉴 → 슬라이드 드로어로 전환. Admin 대시보드도 동일 패턴.

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 홈 | `/dashboard` | 전체 봇 요약, 사용량, 알림 |
| 봇 목록 | `/dashboard/bots` | 봇 카드 리스트 |
| 봇 상세 | `/dashboard/bots/{id}` | 봇 설정, 지식베이스, 채널, 분석 탭 |
| 문서 관리 | `/dashboard/bots/{id}/documents` | 업로드, 크롤링, Q&A |
| 채널 관리 | `/dashboard/bots/{id}/channels` | Telegram, Kakao, WeChat 설정 |
| 대화 로그 | `/dashboard/bots/{id}/conversations` | 대화 이력 검색 |
| 분석 | `/dashboard/bots/{id}/analytics` | 차트, 통계 |
| 빌링 | `/dashboard/billing` | 플랜, 결제, 인보이스 |
| API 키 | `/dashboard/api-keys` | 키 생성·관리 |
| 팀 | `/dashboard/team` | 멤버 초대·관리 |
| 프로필 | `/dashboard/profile` | 개인 정보 수정 |

### 7.3 시스템 관리자 (`/admin/*`)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 대시보드 | `/admin` | KPI 요약 (MRR, 가입자, 트래픽) |
| 사용자 관리 | `/admin/users` | 가입자 목록, 검색, 상세 |
| 트래픽 | `/admin/traffic` | 실시간 + 히스토리 차트 |
| 매출 | `/admin/revenue` | MRR, ARR, Churn, ARPU |
| 시스템 | `/admin/system` | DB, API, 스토리지 상태 |

### 7.4 챗봇 (End User)

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 챗봇 페이지 | `/chat/{botId}` | 독립 챗봇 URL |
| 위젯 | `/widget/{botId}` | iframe 삽입용 |

---

## 8. 보안 요구사항

| 항목 | 구현 |
|------|------|
| 인증 | Supabase Auth (JWT) + RLS |
| API 키 | SHA-256 해시 저장, prefix만 표시 |
| 채널 토큰 | Supabase Vault 또는 AES-256 암호화 후 JSONB 저장 |
| HTTPS | Vercel 기본 SSL |
| Rate Limiting | Vercel Edge Middleware + Redis (Upstash) |
| CORS | 위젯 도메인 화이트리스트 |
| 입력 검증 | Zod 스키마 검증 (모든 API) |
| XSS 방어 | React 기본 이스케이핑 + DOMPurify (위젯) |
| SQL Injection | Supabase 파라미터 바인딩 (PostgREST) |
| GDPR | 데이터 삭제 요청 API, 개인정보처리방침 |

---

## 9. 기존 코드베이스 활용 전략

k-chatbot에서 **그대로 재사용**하는 모듈:

| 모듈 | 파일 | 재사용 방식 |
|------|------|------------|
| RAG 파이프라인 | `src/lib/rag/*` | 멀티테넌트 bot_id 파라미터 추가 |
| 문서 파싱 | `src/lib/rag/parser.ts` | 그대로 사용 |
| 청킹 | `src/lib/rag/chunker.ts` | 그대로 사용 |
| 임베딩 | `src/lib/rag/embeddings.ts` | 그대로 사용 |
| 벡터 검색 | `src/lib/rag/search/*` | bot_id 필터 추가 |
| Supabase 클라이언트 | `src/lib/supabase/*` | 타입 확장 |
| Telegram 핸들러 | `src/lib/telegram/*` | 봇별 동적 라우팅으로 변경 |
| 위젯 | `src/app/widget/*` | botId 기반으로 변경 |
| i18n | `src/i18n/*` | 그대로 사용, 언어 추가 가능 |
| 에러 처리 | `src/components/ErrorBoundary.tsx` | 그대로 사용 |
| OpenAI 클라이언트 | `src/lib/openai/client.ts` | 그대로 사용 |

**변경이 필요한 영역:**
- university_id 기반 → user_id + bot_id 기반 멀티테넌시
- 하드코딩된 대학 테마 → 봇별 커스터마이징
- Admin 페이지 → Owner 대시보드 + System Admin 분리
- 고정 Telegram 봇 → 동적 봇 등록·관리

---

## 10. 구현 로드맵

### Phase 1: 프로젝트 초기화 (1주) ✅
- [x] 새 레포 생성 (`rag-platform`)
- [x] k-chatbot 코드베이스 복사 및 리팩토링
- [x] 새 DB 스키마 마이그레이션 작성
- [x] university 의존성 제거, user/bot 기반 구조로 전환
- [ ] Supabase 프로젝트 생성 (또는 기존 프로젝트 확장)
- [x] 환경변수 설정

### Phase 2: 인증 & 사용자 관리 (1주) ✅
- [x] Supabase Auth 가입/로그인 (이메일 + Google + GitHub)
- [x] profiles 테이블 자동 생성 트리거
- [x] 무료 플랜 자동 할당
- [x] 로그인/회원가입 UI
- [x] 프로필 관리 페이지

### Phase 3: 봇 CRUD & 지식베이스 (2주) ✅
- [x] 봇 생성/수정/삭제 API & UI
- [x] 문서 업로드 (PDF, TXT, DOCX)
- [x] URL 크롤링
- [x] Q&A 직접 등록
- [x] 문서 처리 파이프라인 (기존 RAG 파이프라인 연동)
- [x] 봇별 지식베이스 관리 UI

### Phase 4: 챗봇 & 위젯 (1주) ✅
- [x] `/chat/{botId}` 챗봇 페이지
- [x] `/widget/{botId}` iframe 위젯
- [x] 위젯 삽입 코드 생성기
- [x] 봇 설정 반영 (환영 메시지, 프롬프트, LLM 파라미터)
- [x] 대화 이력 저장

### Phase 5: 채널 연동 (2주) ✅
- [x] Telegram 봇 동적 등록·Webhook
- [x] KakaoTalk 스킬 서버 연동
- [x] WhatsApp Business API 연동
- [ ] WeChat 공식계정 메시지 처리
- [x] 채널 관리 UI (토큰 입력, 활성/비활성)
- [x] 채널별 대화 구분

### Phase 6: 결제 시스템 (2주) — 코드 완료, 외부 설정 미완
- [x] Paddle 연동 코드 (서버 클라이언트, Webhook 핸들러)
- [x] Paddle.js Checkout Overlay로 구독 생성
- [x] 구독 변경/해지 (Paddle Subscription API)
- [x] Paddle Webhook 처리 (subscription.created/updated/canceled, transaction.completed/payment_failed)
- [x] 사용량 추적 (메시지, 스토리지, API 호출)
- [x] 플랜 제한 적용 (미들웨어)
- [x] 빌링 UI (구독 상태, 플랜 변경, 인보이스)
- [x] 인보이스/영수증 조회 (Paddle 트랜잭션 기반)
- [ ] Paddle 계정 설정 (Sandbox Products/Prices 생성, Webhook 등록)

### Phase 7: Owner 대시보드 (2주) ✅
- [x] 대화 분석 차트 (Recharts)
- [x] 대화 로그 검색·필터
- [x] 피드백 통계
- [x] 사용량 모니터링
- [x] API 키 생성·관리
- [ ] 팀 멤버 초대·역할 관리

### Phase 8: Public API (1주) ✅
- [x] `/v1/chat` 엔드포인트 (스트리밍)
- [x] API 키 인증 미들웨어
- [x] Rate limiting (플랜별)
- [x] API 문서 페이지
- [x] 사용량 추적

### Phase 9: 시스템 관리자 (1주) ✅
- [x] 사용자 관리 (목록, 검색, 상세, 정지)
- [x] 트래픽 모니터링 대시보드
- [x] 매출 모니터링 (MRR, ARR, Churn)
- [x] 시스템 상태 모니터링
- [ ] 이벤트 로그 조회

### Phase 10: 랜딩 & 마케팅 (1주) ✅
- [x] 랜딩 페이지 (히어로, 기능, 가격, CTA)
- [x] 가격 페이지 (플랜 비교 테이블)
- [x] 데모 챗봇
- [x] 개인정보처리방침, 이용약관
- [x] SEO 최적화 (메타태그, OG)

### Phase 11: 테스트 & 배포 (1주) — 부분 완료
- [x] Vitest 단위 테스트 (98 tests 통과)
- [ ] E2E 테스트 (Playwright)
- [ ] Paddle Sandbox 모드 결제 검증
- [ ] Vercel 프로덕션 배포
- [ ] 커스텀 도메인 설정
- [ ] 모니터링 알림 설정

### Phase 12.5: WhatsApp 연동 ✅
- [x] WhatsApp Business API Webhook 핸들러 (`/api/webhooks/whatsapp/[botId]`)
- [x] WhatsApp 메시지 수신·응답 처리
- [x] 채널 관리 UI 추가 (`WhatsAppSetup.tsx`)
- [x] 채널 CRUD API
- [x] `whatsapp_user_mappings` 테이블 추가

### Phase 13: WeChat 연동
- [ ] 위챗 공식계정 개발자 설정
- [ ] XML 메시지 파싱·응답 핸들러
- [ ] 채널 관리 UI 추가

### Post-MVP 완료 작업
- [x] KakaoTalk 채널 연동 (Phase 12)
- [x] Docs 허브 (사용자 가이드 + 개발자 가이드)
- [x] 다국어 지원 (EN/KO) — docs + 랜딩 페이지
- [x] 다크 모드 — 퍼블릭 페이지 (랜딩, 가격, 데모, docs)
- [x] 다크 모드 — 어드민 + 대시보드 전체 (37개 파일)
- [x] 퍼블릭 페이지 네비게이션 메뉴 (Pricing, Docs, Demo)
- [x] 인증 기반 네비게이션 (로그인/비로그인 분기)
- [x] 대시보드 사이드바 Admin 링크 (admin 역할 전용)
- [x] 다양한 버그 수정 (빌링 크래시, 다크 모드 텍스트, Vercel 배포)
- [x] WhatsApp Business API 채널 연동
- [x] KakaoTalk Open Builder 스킬 설정 가이드 (사용자 문서)
- [x] Bot ID 표시 + 복사 버튼 (봇 상세 페이지)
- [x] Admin 메시지 카운트 수정 + KST 자동 다크 모드
- [x] IP 기반 동적 언어 감지 (한국 IP → 한국어, 해외 → 영어)
- [x] CSV Q&A 일괄 업로드 + 템플릿 제공 (RFC 4180, BOM, CP949, 자동 컬럼 매핑)
- [x] Excel → CSV 변환 가이드 (Q&A 업로드 섹션)
- [x] 문서 일괄 삭제 (체크박스 다중 선택)
- [x] Q&A 일괄 업로드 배치 최적화 (타임아웃 수정)
- [x] qa_pairs document_id FK 추가 (CASCADE 삭제, 데이터 무결성)
- [x] 문서 목록 페이지네이션 (20건 단위) + 타입별 필터 탭 (All/File/URL/Q&A 카운트)
- [x] Q&A 인라인 편집 (질문 클릭 → 모달 수정, 임베딩 자동 재생성)
- [x] URL 문서 페이지 제목 표시 + 클릭 시 원본 URL 링크
- [x] 삭제 확인 모달 (브라우저 confirm 대체)
- [x] 파일 다운로드 (파일명 클릭 → Supabase signed URL)
- [x] Q&A 일괄 업로드 실시간 진행률 표시 (SSE 스트리밍, 단계별 프로그레스 바)
- [x] Q&A 일괄 업로드 DB 배치 최적화 (N*2 DB 호출 → 단일 호출로 개선)
- [x] 크로스봇 데이터 누출 수정 (conversation_id 소유권 검증, 봇 간 데이터 격리)

**총 예상 기간: 약 14주 (3.5개월)**

---

## 11. 성공 지표 (KPI)

| 지표 | 목표 (출시 후 3개월) |
|------|---------------------|
| 가입자 수 | 500+ |
| 유료 전환율 | 5%+ |
| MRR | $1,000+ |
| 월 활성 봇 수 | 200+ |
| 평균 응답 만족도 | 4.0+ / 5.0 |
| 시스템 가동률 | 99.5%+ |
| 평균 응답 시간 (P95) | < 5초 |

---

## 12. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| OpenAI API 비용 급증 | 수익성 저하 | 사용량 기반 과금, 토큰 최적화, 모델 다변화 |
| Vercel 서버리스 한계 | 대용량 문서 처리 실패 | 비동기 큐 (Inngest/Trigger.dev), 청크 분할 |
| Paddle 결제 실패 | 매출 누락 | Paddle 자동 재시도(dunning), 이메일 알림, Grace period |
| 카카오/위챗 API 변경 | 채널 연동 장애 | 추상화 레이어, 빠른 대응 체계 |
| 데이터 유출 | 신뢰 상실 | RLS, 암호화, 정기 보안 점검 |
| 경쟁사 가격 인하 | 고객 이탈 | 차별화 기능, 무료 tier 강화 |

---

## 부록 A: 경쟁사 가격 비교

| 서비스 | Free | Starter | Pro | Enterprise |
|--------|------|---------|-----|------------|
| **AskDocs (본 서비스)** | $0 | $29 | $99 | $299 |
| Chatbase | $0 | $40 | $150 | $500+ |
| Dante AI | $0 | $29 | $99 | $299+ |
| Botpress | $0 | $89 | $495 | $995+ |
| DocsBot | $0 | $49 | $149 | $499+ |
| Voiceflow | $0 | $60 | $150 | Custom |

→ AskDocs는 **Dante AI와 동등 수준**의 가격대로, 시장 중간 포지셔닝.
→ Chatbase/Botpress 대비 **가격 경쟁력** 확보.
→ 핵심 차별화: **멀티채널 통합** (Telegram + KakaoTalk + WhatsApp + WeChat) + **한국어 최적화 RAG**.

---

## 부록 B: Paddle 연동 구조

```
사용자 가입
  → Free Plan 할당 (Paddle 구독 없음)
  → Paddle Customer는 첫 결제 시 자동 생성

사용자 업그레이드 클릭
  → Paddle.js Checkout Overlay 열기 (클라이언트 사이드)
  → 결제 완료 → Webhook (subscription.created) → subscription 테이블 업데이트
  → 플랜 제한 즉시 적용

월간 갱신
  → Paddle 자동 결제
  → Webhook (transaction.completed) → usage_records 리셋
  → 결제 실패 시 → Webhook (subscription.past_due) → 이메일 알림 + Grace period 3일

해지
  → Paddle Subscription API로 해지 요청
  → Webhook (subscription.canceled) → cancel_at_period_end = true
  → 기간 만료 시 → Free 플랜 다운그레이드

※ Paddle은 Merchant of Record (MoR):
  - 세금/VAT 자동 계산 및 징수
  - 세금 계산서(인보이스) Paddle이 직접 발행
  - 환불 처리도 Paddle 대시보드에서 관리
```
