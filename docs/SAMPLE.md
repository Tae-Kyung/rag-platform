# SaaS 바이브 코딩 — 샘플 프롬프트 모음

> **목적:** `docs/COMMON.md` 가이드를 기반으로, 새 SaaS 프로젝트를 AI에게 요청할 때 복사-붙여넣기로 즉시 사용할 수 있는 프롬프트 모음.
> **사용법:** 각 프롬프트를 프로젝트 상황에 맞게 `{중괄호}` 부분만 교체하여 사용한다.
> **순서:** 프로젝트 라이프사이클 순서대로 배치. 위에서부터 순서대로 사용하면 견고한 SaaS가 만들어진다.

---

## 목차

1. [Phase 0: 프로젝트 킥오프](#phase-0-프로젝트-킥오프)
2. [Phase 1: 공유 컴포넌트 & 레이아웃](#phase-1-공유-컴포넌트--레이아웃)
3. [Phase 2: 인증 & 사용자 관리](#phase-2-인증--사용자-관리)
4. [Phase 3: 핵심 CRUD 기능](#phase-3-핵심-crud-기능)
5. [Phase 4: 목록 페이지 (테이블 + 필터 + 페이지네이션)](#phase-4-목록-페이지)
6. [Phase 5: 대량 처리 (벌크 업로드 / 임포트)](#phase-5-대량-처리)
7. [Phase 6: 실시간 기능 (채팅, 스트리밍)](#phase-6-실시간-기능)
8. [Phase 7: 결제 & 구독](#phase-7-결제--구독)
9. [Phase 8: 관리자 대시보드](#phase-8-관리자-대시보드)
10. [Phase 9: 배포 & 마무리](#phase-9-배포--마무리)
11. [공통 수정 요청 프롬프트](#공통-수정-요청-프롬프트)

---

## Phase 0: 프로젝트 킥오프

### P0-1. PRD 작성 요청

```
다음 서비스의 PRD(Product Requirements Document)를 작성해줘:

서비스명: {서비스명}
한 줄 설명: {예: 사용자가 문서를 업로드하여 AI 챗봇을 만들고 여러 채널에 배포하는 RAG-as-a-Service}
타겟 사용자: {예: 중소기업 고객지원팀, 교육기관}
핵심 기능 (3-5개):
1. {기능1}
2. {기능2}
3. {기능3}

PRD에 포함해야 할 섹션:
- 제품 개요 & 비전
- 사용자 역할 (최소 3개: 비로그인 방문자, 가입자, 시스템 관리자)
- 가격 정책 (Free / Starter / Pro / Enterprise 4단계)
- 기능 명세 (역할별)
- DB 스키마 (모든 테이블에 FK + ON DELETE CASCADE 포함, 인덱스 포함)
- API 설계 (내부 API + 퍼블릭 API)
- 화면 구성 (페이지 목록 + 경로)
- 보안 요구사항

기술 스택: Next.js 16 (App Router) + Supabase + Tailwind CSS 4 + Vercel
```

### P0-2. CLAUDE.md 생성

```
이 프로젝트의 CLAUDE.md 파일을 작성해줘.

서비스: {서비스명}
기술 스택: {기술 스택}

CLAUDE.md에 포함할 내용:
1. Project Overview (한 문단)
2. Tech Stack (표 형식)
3. Project Structure (폴더 트리)
4. Commands (dev, build, lint, test)
5. Environment Variables (목록 + 설명, NEXT_PUBLIC_ vs 서버 전용 구분)
6. Key Architecture Patterns:
   - 인증 가드 패턴 (requireAuth, requireOwner 등)
   - API 응답 형태 ({ success, data?, error? })
   - 다크모드 규칙 (모든 light 색상에 dark: 대응 필수)
   - 페이지네이션 필수 (20건 이상 목록)
   - 삭제 시 ConfirmModal 사용 (window.confirm 금지)
   - SSE 스트리밍 (3초 이상 작업)
7. Database (핵심 테이블 목록)
8. Coding Conventions:
   - TypeScript strict mode
   - Zod 입력 검증
   - 컴포넌트: features/{domain}/ 또는 components/
```

### P0-3. DB 스키마 + 마이그레이션

```
다음 요구사항에 맞는 PostgreSQL 스키마를 supabase/migrations/00001_schema.sql로 작성해줘.

핵심 엔티티:
{예:
- profiles (사용자)
- plans (구독 플랜 정의)
- subscriptions (사용자별 구독)
- usage_records (월별 사용량)
- bots (챗봇)
- documents (업로드 문서)
- document_chunks (문서 청크 + 벡터 임베딩)
- conversations (대화 세션)
- messages (개별 메시지)
- api_keys (API 키)
- channel_configs (채널 설정)
}

필수 규칙 (절대 생략하지 말 것):
1. 모든 부모-자식 관계에 REFERENCES ... ON DELETE CASCADE 포함
2. WHERE/JOIN/ORDER BY에 사용되는 컬럼에 인덱스 생성
3. 모든 테이블에 created_at TIMESTAMPTZ DEFAULT now() 포함
4. UUID PRIMARY KEY DEFAULT gen_random_uuid() 사용
5. pgvector 확장 + vector(1536) 타입 + IVFFlat 인덱스 포함 (임베딩 사용 시)
6. RLS 활성화 + 기본 정책 포함 (별도 마이그레이션 가능)

추가로 supabase/migrations/00002_rls_policies.sql에 RLS 정책을 작성해줘:
- profiles: 본인만 읽기/수정
- bots: user_id = auth.uid()인 경우만 CRUD
- documents: 봇 소유자만 접근
- conversations/messages: 봇 소유자 SELECT, service role INSERT
```

### P0-4. .env.example 생성

```
이 프로젝트의 .env.example 파일을 작성해줘.

사용하는 외부 서비스: {예: Supabase, OpenAI, Paddle, Vercel}

규칙:
- 각 변수에 주석으로 설명 추가
- NEXT_PUBLIC_ 접두사와 서버 전용을 명확히 구분
- 비밀키에는 "# 서버 전용 - NEXT_PUBLIC 금지!" 주석 추가
- 기본값이 있는 경우 예시값 포함
```

---

## Phase 1: 공유 컴포넌트 & 레이아웃

### P1-1. 공유 UI 컴포넌트 세트

```
아래 공유 컴포넌트들을 src/components/에 만들어줘.
이 컴포넌트들은 프로젝트 전체에서 재사용되므로 견고하게 만들어야 해.

기술 스택: React 19 + Tailwind CSS 4 + next-themes (다크모드)

모든 컴포넌트 공통 규칙:
- 다크모드 필수: 모든 bg-white → dark:bg-gray-900, text-gray-900 → dark:text-white 등 COMMON.md §5.1 색상 매핑 테이블 적용
- TypeScript props 인터페이스 정의
- 불필요한 외부 라이브러리 없이 Tailwind만으로 구현

1. ConfirmModal.tsx
   - Props: isOpen, title, message, confirmLabel, confirmVariant('danger'|'primary'), onConfirm, onCancel
   - 배경 오버레이 + 중앙 카드
   - ESC 키로 닫기
   - "취소" + "확인" 버튼 (danger 시 빨간색)

2. Pagination.tsx
   - Props: currentPage, totalPages, onPageChange
   - 이전/다음 버튼 + 페이지 번호 (1 ... 4 5 6 ... 20 형태)
   - 1페이지나 마지막 페이지에서 비활성화

3. EmptyState.tsx
   - Props: icon (ReactNode), title, description, action (ReactNode, optional)
   - 중앙 정렬 + 연한 색상

4. DataTable.tsx
   - Props: columns, data, selectedIds, onSelectChange, onSelectAll
   - 헤더 체크박스 (전체선택, indeterminate 상태)
   - 행별 체크박스
   - 반응형 (모바일에서 가로 스크롤)

5. ProgressBar.tsx
   - Props: progress (0-100), message, phase
   - 파란색 바 + 퍼센트 표시 + 단계 메시지
   - transition-all duration-300 애니메이션

6. LoadingSpinner.tsx
   - Props: size ('sm'|'md'|'lg'), message (optional)
   - animate-spin 원형 스피너

7. ErrorMessage.tsx
   - Props: message, onRetry (optional)
   - 빨간 배경 + 에러 아이콘 + 메시지 + 다시 시도 버튼

8. ThemeToggle.tsx
   - next-themes useTheme 사용
   - 해/달 아이콘 토글 버튼
   - mounted 상태 체크 (hydration mismatch 방지)
```

### P1-2. 대시보드 레이아웃 (반응형 + 다크모드)

```
src/app/dashboard/layout.tsx에 대시보드 레이아웃을 만들어줘.

필수 요구사항:
1. 데스크톱 (lg 이상): 왼쪽 고정 사이드바 (w-64) + 오른쪽 메인 콘텐츠
2. 모바일 (lg 미만): 햄버거 버튼 → 슬라이드 드로어 (왼쪽에서 밀려나옴) + 배경 오버레이
3. 다크모드 완벽 지원 (COMMON.md §5.1 색상 매핑 적용)

사이드바 메뉴:
- {서비스명} 로고 (클릭 시 / 이동)
- Dashboard (/dashboard)
- {핵심 리소스} (/dashboard/{리소스})
- Billing (/dashboard/billing)
- API Keys (/dashboard/api-keys)
- Profile (/dashboard/profile)
- 구분선
- admin 역할인 경우에만: Admin (/admin)
- 하단: 로그아웃 버튼

사이드바 컴포넌트: src/features/dashboard/Sidebar.tsx로 분리
현재 경로 하이라이트: usePathname()으로 활성 메뉴 표시
```

### P1-3. 퍼블릭 헤더 + 푸터

```
퍼블릭 페이지용 Header와 Footer 컴포넌트를 만들어줘.

Header (src/components/PublicHeader.tsx):
- 로고 + 서비스명 (/ 링크)
- 네비게이션: Pricing, Docs, Demo
- ThemeToggle 버튼
- 인증 상태에 따라:
  - 로그인 O: "Dashboard" 버튼
  - 로그인 X: "Login" 버튼
- 모바일: 햄버거 메뉴 → 드롭다운
- 다크모드 완벽 지원

Footer (src/components/PublicFooter.tsx):
- 4컬럼 레이아웃: Product, Resources, Legal, Company
- 하단: © 저작권 표시
- 다크모드 지원
```

---

## Phase 2: 인증 & 사용자 관리

### P2-1. 인증 가드 유틸리티

```
src/lib/auth/guards.ts에 인증 가드 함수들을 구현해줘.

함수 목록:
1. requireAuth(): 로그인 확인, 미인증 시 AuthError(401) throw
2. requireAdmin(): admin 역할 확인, 아닌 경우 AuthError(403) throw
3. requireOwner(resourceId): 리소스 소유자 확인, 미소유 시 AuthError(403) throw
4. requirePlan(minPlan): 최소 플랜 확인, 미충족 시 AuthError(403) throw

규칙:
- Supabase 서버 클라이언트 사용 (createServerClient)
- AuthError 클래스 정의 (message, status 포함)
- 모든 API 라우트에서 일관되게 사용할 수 있는 패턴

사용 예:
export async function GET(request: NextRequest) {
  try {
    const user = await requireOwner(botId);
    // 비즈니스 로직
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status);
    return errorResponse('Internal server error', 500);
  }
}
```

### P2-2. API 응답 헬퍼

```
src/lib/api/response.ts에 API 응답 헬퍼 함수를 만들어줘.

모든 API가 일관된 JSON 형태를 반환해야 해:
- 성공: { success: true, data: ... }
- 실패: { success: false, error: "..." }

함수:
1. successResponse(data, status = 200)
2. errorResponse(error, status = 400)

NextResponse.json() 사용.
```

---

## Phase 3: 핵심 CRUD 기능

### P3-1. 리소스 CRUD API + UI (표준 패턴)

```
{리소스명}의 CRUD 기능을 만들어줘.

API 라우트:
1. GET /api/owner/{리소스}s — 목록 조회 (페이지네이션 필수: page, limit 파라미터)
2. POST /api/owner/{리소스}s — 생성 (Zod 검증 필수)
3. GET /api/owner/{리소스}s/[id] — 상세 조회
4. PUT /api/owner/{리소스}s/[id] — 수정
5. DELETE /api/owner/{리소스}s/[id] — 삭제

모든 API 규칙 (하나도 빠뜨리지 말 것):
- requireOwner() 인증 가드 적용
- Zod 입력 검증 (POST, PUT)
- successResponse/errorResponse 사용
- 목록 API는 반드시 { data: [...], total, totalPages } 형태 반환
- export const maxDuration = 30 설정 (LLM 호출이 필요한 경우 60)
- 클라이언트가 보내는 ID는 소유권 검증 (예: 리소스의 bot_id가 현재 사용자 봇인지)

UI 페이지:
1. /dashboard/{리소스}s — 목록 페이지
   - DataTable 컴포넌트 사용 (체크박스, 벌크 액션)
   - Pagination 컴포넌트 사용
   - EmptyState (데이터 없을 때)
   - LoadingSpinner (로딩 중)
   - ErrorMessage (에러 시)
   - 삭제: ConfirmModal 사용 (window.confirm 금지!)
   - 벌크 삭제: "선택 삭제" 버튼 + ConfirmModal
2. /dashboard/{리소스}s/new — 생성 페이지
3. /dashboard/{리소스}s/[id] — 상세/수정 페이지

다크모드: 모든 컴포넌트에 dark: 클래스 필수 (COMMON.md §5.1 참고)
모바일 반응형: 테이블은 가로 스크롤, 폼은 1컬럼
```

### P3-2. 파일 업로드 + 다운로드

```
파일 업로드와 다운로드 기능을 만들어줘.

업로드 API (POST /api/owner/{리소스}s/[id]/documents):
- Supabase Storage에 파일 저장 (버킷: {버킷명})
- 경로: {리소스id}/{파일명}
- DB에 메타데이터 저장 (file_name, file_type, file_size, storage_path)
- 플랜별 용량 체크
- maxDuration = 60

다운로드 API (GET /api/owner/{리소스}s/[id]/documents/[docId]/download):
- requireOwner 인증 가드
- Supabase Storage createSignedUrl(path, 60) 으로 60초 유효 signed URL 생성
- 응답: { url: signedUrl, file_name: ... }

클라이언트 다운로드:
- 파일명 클릭 → fetch download API → a 태그 생성 → a.href = url → a.download = name → a.click()
- 다운로드 중 로딩 표시
```

---

## Phase 4: 목록 페이지

### P4-1. 필터 탭 + 카운트 배지 + 페이지네이션

```
{리소스} 목록 페이지에 타입별 필터 탭과 페이지네이션을 추가해줘.

API 수정 (GET /api/owner/...):
- Query params: page, limit (기본 20), type (기본 'all')
- type이 'all'이 아닌 경우 .eq('file_type', type) 필터
- 응답에 counts 추가: { all: 전체수, type1: 수, type2: 수, type3: 수 }
- 총 건수: select('*', { count: 'exact' })

UI:
1. 필터 탭 바:
   - All({전체수}) | Type1({수}) | Type2({수}) | Type3({수})
   - 활성 탭: bg-blue-50 dark:bg-blue-900/30 + border-b-2 border-blue-600
   - 비활성 탭: text-gray-500 dark:text-gray-400
   - 탭 클릭 시 currentPage를 1로 리셋

2. 페이지네이션:
   - Pagination 컴포넌트 사용
   - 페이지 변경 시 API 재호출

3. 벌크 액션:
   - 전체선택 체크박스 (indeterminate 상태 포함)
   - "N개 선택됨" 바 + "선택 삭제" 버튼
   - ConfirmModal로 확인

상태 관리: useState로 currentPage, filterType, selectedIds(Set), counts, totalPages
```

---

## Phase 5: 대량 처리

### P5-1. CSV 일괄 업로드 (SSE 프로그레스 바)

```
CSV 파일을 파싱하여 대량 데이터를 업로드하는 기능을 만들어줘.

서버 API (POST /api/owner/{리소스}s/[id]/bulk):

1단계 — 검증 (스트리밍 전, 실패 시 JSON 에러 반환):
  - 인증 (requireOwner)
  - body 파싱 + items 배열 검증
  - 플랜 한도 체크
  - 검증 실패 시 errorResponse() 반환 (JSON)

2단계 — SSE 스트리밍 (검증 통과 후):
  - new ReadableStream + TextEncoder
  - send() 헬퍼: data: JSON\n\n 형태
  - 진행 단계:
    Phase 1: records 생성 (5%)
    Phase 2: 데이터 저장 - 100건씩 배치 INSERT (10%)
    Phase 3: 임베딩 생성 - BATCH_SIZE 단위 (15-80%)
    Phase 4: DB 저장 - 50건씩 배치 INSERT (85-95%)
    Phase 5: 완료 표시 (100%)
  - 에러 시: { phase: 'error', message: ... }
  - send 이벤트 형태: { phase, message, progress, current, total }
  - 사용량 추적은 루프 밖에서 1회 호출: incrementCount(userId, items.length)
  - export const maxDuration = 300
  - Content-Type: text/event-stream

클라이언트 UI:
  - CSV 파일 선택 → 파싱 (인코딩: UTF-8 시도 → 깨지면 EUC-KR fallback)
  - 미리보기 (첫 3행)
  - "업로드" 버튼 클릭 → fetch POST
  - 응답 Content-Type 확인:
    - application/json → 에러 처리
    - text/event-stream → reader.read() 루프로 진행률 수신
  - ProgressBar 컴포넌트로 실시간 진행률 표시
  - 완료 시 목록 새로고침
```

### P5-2. 벌크 삭제 API

```
선택한 여러 항목을 일괄 삭제하는 API를 만들어줘.

API (DELETE /api/owner/{리소스}s/[id]/documents/bulk):
- Body: { ids: string[] }
- 인증: requireOwner
- 각 ID의 소유권 검증 (봇 소유 확인)
- Supabase Storage 파일도 삭제 (storage_path가 있는 경우)
- .in('id', ids)로 일괄 삭제
- 사용량 차감: decrementCount(userId, ids.length) — 1회 호출

클라이언트:
- selectedIds Set에서 배열 변환
- ConfirmModal: "선택한 {N}개 항목을 삭제하시겠습니까?"
- 삭제 후 selectedIds 초기화 + 목록 새로고침
```

---

## Phase 6: 실시간 기능

### P6-1. SSE 채팅 스트리밍

```
SSE 기반 스트리밍 채팅 API를 만들어줘.

API (POST /api/chat):
- Body: { bot_id, message, conversation_id?, language? }
- 인증 불요 (End User용)
- export const maxDuration = 60

처리 흐름:
1. bot_id로 봇 조회 + 활성 상태 확인 (비활성 시 403)
2. 봇 소유자의 메시지 쿼터 확인 (초과 시 429)
3. conversation_id 검증:
   ★ 중요: conversation_id가 전달된 경우 반드시 bot_id와 교차 검증!
   - .eq('id', convId).eq('bot_id', bot_id) 로 조회
   - 불일치 시 새 대화 생성 (절대 다른 봇의 대화를 로드하면 안 됨)
4. 사용자 메시지 저장
5. RAG 검색 (벡터 검색 + 키워드 검색)
6. 시스템 프롬프트 빌드
7. LLM 스트리밍 호출

SSE 이벤트 순서:
1. { type: 'meta', conversationId, messageId, confidence }
2. { type: 'content', content: '...' } (반복)
3. { type: 'sources', sources: [...] }
4. { type: 'done' }
에러 시: { type: 'error', error: '...' }

스트림 완료 후:
- assistant 메시지 DB 저장
- 사용량 증가: incrementMessageCount(botOwnerId)
```

### P6-2. 스트리밍 채팅 훅

```
SSE 채팅 스트리밍을 처리하는 React 커스텀 훅을 만들어줘.

src/hooks/useStreamChat.ts:

interface UseStreamChatReturn {
  sendMessage: (message: string) => Promise<void>;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  conversationId: string | null;
}

function useStreamChat(botId: string): UseStreamChatReturn

동작:
1. fetch('/api/chat', { method: 'POST', body: { bot_id, message, conversation_id } })
2. ReadableStream reader로 SSE 이벤트 파싱
3. 'meta' → conversationId 저장
4. 'content' → 현재 assistant 메시지에 append (실시간 렌더링)
5. 'sources' → 소스 저장
6. 'done' → isStreaming = false
7. 'error' → error 상태 설정

주의:
- 스트리밍 중 추가 메시지 전송 방지 (isStreaming 체크)
- 컴포넌트 언마운트 시 reader cancel
```

---

## Phase 7: 결제 & 구독

### P7-1. 사용량 추적 유틸리티

```
src/lib/billing/usage.ts에 사용량 추적 함수들을 구현해줘.

핵심 규칙:
- 모든 increment/decrement 함수는 count 파라미터 지원 (기본값 1)
  → 벌크 작업 시 루프 호출 대신 1회 호출로 처리
- getOrCreateUsageRecord(): 월별 레코드 조회 또는 생성
  → Race condition 처리: INSERT 실패 시 SELECT fallback

함수 목록:
1. checkMessageQuota(userId) → { allowed, remaining }
2. incrementMessageCount(userId, count = 1)
3. incrementDocumentCount(userId, count = 1)
4. decrementDocumentCount(userId, count = 1)
5. incrementStorageUsage(userId, fileSizeBytes)
6. decrementStorageUsage(userId, fileSizeBytes)
7. getCurrentUsage(userId) → UsageRecord

사용 예 (벌크):
// 500건 일괄 업로드 후
await incrementDocumentCount(userId, 500);  // DB 2회만 호출
// WRONG: for (let i = 0; i < 500; i++) await incrementDocumentCount(userId); // DB 1000회!
```

### P7-2. 플랜 제한 가드

```
src/lib/billing/plan-guard.ts에 플랜 제한 체크 함수들을 만들어줘.

함수 목록:
1. checkBotLimit(userId) → { allowed, current, max }
2. checkDocumentLimit(userId, botId) → { allowed, current, max }
3. checkStorageLimit(userId, fileSizeBytes) → { allowed }
4. checkMessageLimit(userId) → { allowed, remaining }
5. checkChannelAccess(userId, channel) → boolean
6. checkAPIAccess(userId) → boolean

각 함수:
- subscriptions 테이블에서 plan_id 조회
- plans 테이블에서 한도 조회
- -1은 무제한
- 현재 사용량과 비교하여 allowed 반환

API에서 사용:
- 봇 생성 전: checkBotLimit
- 문서 업로드 전: checkDocumentLimit + checkStorageLimit
- 채팅 전: checkMessageLimit
- 채널 추가 전: checkChannelAccess
```

---

## Phase 8: 관리자 대시보드

### P8-1. 관리자 레이아웃 + 대시보드

```
시스템 관리자 대시보드를 만들어줘.

레이아웃 (src/app/admin/layout.tsx):
- 대시보드 레이아웃과 동일한 반응형 패턴 (사이드바 + 모바일 드로어)
- requireAdmin 가드
- 메뉴: Dashboard, Users, Traffic, Revenue, System

대시보드 홈 (src/app/admin/page.tsx):
- KPI 카드 4개: 총 가입자, MRR, 오늘 메시지, 활성 봇 수
- 미니 차트: 7일 가입자 추이, 7일 메시지 추이

API (GET /api/sys/...):
- requireAdmin 가드
- 각 엔드포인트에 적절한 집계 쿼리

다크모드 + 반응형 필수.
```

---

## Phase 9: 배포 & 마무리

### P9-1. Vercel 배포 체크

```
이 프로젝트를 Vercel에 배포하기 전에 확인해야 할 사항들을 점검해줘:

1. 모든 API 라우트에 maxDuration이 설정되어 있는지 확인
   - /api/chat → 60
   - 문서 처리 / 벌크 업로드 → 300
   - 웹훅 → 30
   - 단순 CRUD → 기본값

2. 환경변수 확인:
   - NEXT_PUBLIC_ 접두사에 비밀키(SERVICE_ROLE_KEY, OPENAI_API_KEY, PADDLE_API_KEY)가 없는지
   - 모든 필수 환경변수가 .env.example에 정의되어 있는지

3. 무료 플랜 사용자 경로 테스트:
   - 구독 없는 사용자가 빌링 페이지 접근 시 크래시하지 않는지
   - null 구독 처리가 모든 곳에서 되어 있는지

4. 빌드 확인:
   - npm run build 성공
   - TypeScript 에러 없음
   - ESLint 경고/에러 없음
```

### P9-2. 다크모드 전체 검수

```
프로젝트의 모든 페이지에서 다크모드를 검수해줘.

체크할 항목:
1. 배경색: bg-white에 dark:bg-gray-900 대응이 있는지
2. 텍스트 색: text-gray-900에 dark:text-white 등 대응이 있는지
3. 보더: border-gray-200에 dark:border-gray-700 대응이 있는지
4. hover 상태: hover:bg-gray-50에 dark:hover:bg-gray-800 대응이 있는지
5. input/select 요소: 배경, 텍스트, 보더, placeholder 모두 다크모드 대응
6. 모달/오버레이: 배경색 다크모드
7. 카드/패널: 그림자, 배경 다크모드
8. 뱃지/태그: 색상 다크모드

dark: 클래스가 없는 색상 관련 Tailwind 클래스가 있으면 수정해줘.
```

---

## 공통 수정 요청 프롬프트

### 기존 목록에 페이지네이션 추가

```
{파일경로}의 {리소스} 목록에 페이지네이션을 추가해줘.

현재: 전체 데이터를 한 번에 로드
변경: 20건 단위 페이지네이션

API 수정:
- page, limit 쿼리 파라미터 추가
- select('*', { count: 'exact' }) 사용
- .range(offset, offset + limit - 1) 적용
- 응답: { data: [...], total, totalPages }

UI 수정:
- useState: currentPage, totalPages
- Pagination 컴포넌트 추가
- 페이지 변경 시 API 재호출
```

### 기존 삭제에 확인 모달 추가

```
{파일경로}의 삭제 기능을 window.confirm() 대신 ConfirmModal로 교체해줘.

현재: if (confirm('삭제?')) { ... }
변경:
1. deleteConfirm 상태 추가 (단건: { type: 'single', id, name }, 벌크: { type: 'bulk', count })
2. 삭제 버튼 → setDeleteConfirm() (모달 표시)
3. 모달의 "삭제" 버튼 → 실제 삭제 실행
4. 모달의 "취소" 버튼 → setDeleteConfirm(null)
5. 다크모드 지원
```

### 기존 동기 API를 SSE 프로그레스로 전환

```
{API 경로}를 SSE 스트리밍으로 전환해줘. 현재 동기 JSON 응답이라 오래 걸리면 사용자가 진행 상황을 모름.

변경 방식:
1. 검증 로직은 스트리밍 전에 실행 (실패 시 JSON 에러 반환)
2. 검증 통과 후 ReadableStream으로 SSE 스트리밍
3. 작업 단계별 progress 이벤트 전송: { phase, message, progress, current, total }
4. Content-Type: text/event-stream
5. export const maxDuration = 300

클라이언트:
1. fetch 후 Content-Type 확인 (json이면 에러, event-stream이면 스트림)
2. reader.read() 루프로 이벤트 수신
3. ProgressBar 컴포넌트로 표시
```

### 크로스 엔티티 소유권 검증 추가

```
{API 경로}에서 클라이언트가 보내는 {entity_id}의 소유권을 검증해줘.

현재 문제: 클라이언트가 다른 {부모 엔티티}의 {entity_id}를 전달하면 데이터 누출이 발생할 수 있음.

수정:
- {entity_id}로 DB 조회 시 .eq('{parent_column}', {parent_id}) 조건 추가
- 불일치 시:
  - 읽기 작업: 빈 결과 반환
  - 쓰기 작업: 새 {entity} 생성 (또는 403 에러)

예시:
const { data } = await supabase
  .from('{테이블}')
  .select('id')
  .eq('id', entityId)
  .eq('{parent_column}', parentId)  // ← 이 줄이 핵심
  .single();
```

### N+1 쿼리를 배치로 전환

```
{파일경로}에서 루프 안의 개별 DB 호출을 배치 쿼리로 최적화해줘.

현재 (N+1 문제):
for (const item of items) {
  await supabase.from('{테이블}').{operation}...  // N번 호출
}

변경:
- INSERT: items를 50-100건 배치로 분할하여 .insert(batch)
- SELECT: .in('id', ids)로 한 번에 조회 → Map으로 변환
- UPDATE (카운트): count 파라미터 지원하여 1회 호출

사용량 추적도 확인:
- incrementXxxCount(userId) 루프 호출 → incrementXxxCount(userId, items.length) 1회 호출
```

---

## 프롬프트 작성 팁

### 1. 컨텍스트를 먼저 제공

```
# 나쁜 예
"문서 업로드 기능 만들어줘"

# 좋은 예
"이 프로젝트는 Next.js 16 + Supabase SaaS이고, CLAUDE.md에 정의된 패턴을 따라.
docs/COMMON.md의 규칙을 적용하여 문서 업로드 기능을 만들어줘.
특히 §4.3 SSE 스트리밍, §5.1 다크모드, §5.3 삭제 모달 패턴을 반드시 적용해."
```

### 2. "하지 말 것"을 명시

```
# 나쁜 예
"삭제 기능 만들어줘"

# 좋은 예
"삭제 기능을 만들어줘.
- window.confirm() 절대 사용하지 마. ConfirmModal 컴포넌트 사용.
- 삭제 API에서 클라이언트가 보낸 ID의 소유권을 반드시 검증해.
- 다크모드 dark: 클래스 빠뜨리지 마."
```

### 3. 체크리스트를 포함

```
# 나쁜 예
"API 만들어줘"

# 좋은 예
"API를 만들어줘. 아래 체크리스트를 모두 충족해야 해:
- [ ] requireOwner 인증 가드
- [ ] Zod 입력 검증
- [ ] successResponse/errorResponse 사용
- [ ] 페이지네이션 (page, limit)
- [ ] maxDuration 설정
- [ ] 크로스 엔티티 소유권 검증
- [ ] 다크모드 (UI가 있는 경우)"
```

### 4. 한 번에 하나씩, 작은 단위로

```
# 나쁜 예
"대시보드 전체를 만들어줘" (너무 큼 → AI가 세부사항 놓침)

# 좋은 예
1차: "대시보드 레이아웃을 만들어줘 (사이드바 + 반응형)"
2차: "봇 목록 페이지를 만들어줘 (카드 그리드 + 빈 상태)"
3차: "봇 생성 폼을 만들어줘 (Zod 검증 + 플랜 한도 체크)"
4차: "봇 상세 페이지를 만들어줘 (설정 탭 + 위험 영역)"
```

### 5. 기존 패턴 참조

```
# 나쁜 예
"새로운 채팅 기능 만들어줘"

# 좋은 예
"src/app/api/chat/route.ts와 동일한 SSE 스트리밍 패턴으로
새 기능의 API를 만들어줘. 특히:
- meta → content → sources → done 이벤트 순서
- 에러 시 { type: 'error' } 이벤트
- 스트림 완료 후 DB 저장 + 사용량 증가"
```
