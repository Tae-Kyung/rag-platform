# CLAUDE.md — AskDocs RAG Platform

## Project Overview

AskDocs is a RAG-as-a-Service SaaS platform. Users upload documents (PDF, URL, Q&A) to create AI chatbots and deploy them across multiple channels (Web widget, Telegram, KakaoTalk, WeChat, API).

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind CSS 4 + next-themes (dark/light mode)
- **State:** Zustand 5
- **Auth & DB:** Supabase (PostgreSQL + pgvector + Auth + Storage)
- **LLM:** OpenAI API (GPT-4o-mini default, GPT-4o, Claude for paid)
- **Embeddings:** OpenAI text-embedding-3-small (1536-dim)
- **Payments:** Paddle (Merchant of Record)
- **i18n:** next-intl (ko, en)
- **Testing:** Vitest + Testing Library
- **Deployment:** Vercel (serverless, 60s max duration)

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── (public)/           # Public auth pages (login, signup)
│   ├── admin/              # System admin dashboard
│   ├── api/
│   │   ├── chat/           # Internal chat endpoints
│   │   ├── owner/          # Owner CRUD APIs (bots, docs, billing)
│   │   ├── sys/            # System admin APIs
│   │   ├── v1/             # Public REST API (API key auth)
│   │   └── webhooks/       # Paddle, Telegram & KakaoTalk webhooks
│   ├── dashboard/          # Owner dashboard pages
│   ├── chat/               # Chat interface
│   └── widget/             # Embeddable widget
├── lib/                    # Core business logic
│   ├── auth/               # Guards, API key validation, rate limiting
│   ├── billing/            # Paddle integration, usage tracking, plan guards
│   ├── channels/           # Telegram & KakaoTalk handlers & API
│   ├── chat/               # Chat history, sources, dedup
│   ├── openai/             # OpenAI client
│   ├── rag/                # RAG pipeline (chunker, embeddings, parser, search)
│   └── supabase/           # Supabase client instances (server, service)
├── features/               # Feature-specific components
│   ├── admin/              # Admin dashboard components
│   ├── chat/               # Chat UI + Zustand store
│   └── dashboard/          # Dashboard components
├── components/             # Shared UI components
├── hooks/                  # Custom hooks (useStreamChat)
├── types/                  # TypeScript type definitions
├── config/                 # Constants & configuration
└── i18n/                   # Internationalization messages (ko, en)
supabase/
├── migrations/             # 6 migration files (schema, RLS, triggers, storage)
└── seed.sql                # Initial seed data
docs/                       # PRD, task breakdown, vision docs (Korean)
public/
└── widget.js               # Embeddable chat widget script
```

## Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint
npm run test             # Vitest watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Coverage report
```

## Environment Variables

See `.env.example`. Required:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `PADDLE_API_KEY` / `PADDLE_WEBHOOK_SECRET` / `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` / `NEXT_PUBLIC_PADDLE_ENV`
- `NEXT_PUBLIC_APP_URL`

## Key Architecture Patterns

- **Auth guards** (`src/lib/auth/guards.ts`): `requireAuth()`, `requireAdmin()`, `requireOwner()`, `requirePlan()` — used in API routes
- **Plan enforcement** (`src/lib/billing/plan-guard.ts`): Checks quotas before operations (message count, document count, storage)
- **RAG pipeline** (`src/lib/rag/`): Query → embed → vector search (pgvector) + keyword fallback → dedup → prompt assembly → OpenAI streaming response
- **Streaming chat**: SSE-based streaming via `useStreamChat` hook; API routes return `text/event-stream`
- **RLS policies** (`supabase/migrations/00002_rls_policies.sql`): All user data protected by Supabase Row-Level Security
- **API auth**: Owner endpoints use Supabase session; `/v1/*` endpoints use Bearer API key from `api_keys` table
- **Dark mode**: `next-themes` ThemeProvider + Tailwind `dark:` variant classes; `ThemeToggle` component in all layouts

## Database

PostgreSQL via Supabase with pgvector extension. Key tables:
- `profiles`, `plans`, `subscriptions`, `usage_records`
- `bots`, `documents`, `document_chunks` (with `embedding vector(1536)`)
- `conversations`, `messages`, `api_keys`, `channel_configs`, `telegram_chat_mappings`

Migrations are in `supabase/migrations/` (run in order 00001–00006).

## Coding Conventions

- Use TypeScript strict mode
- API routes return `NextResponse.json()` with consistent `{ success, data?, error? }` shape
- Validate request bodies with Zod
- Use `createServerClient()` for authenticated routes, `createServiceClient()` for admin/webhook operations
- Components go in `src/features/<domain>/` for domain-specific or `src/components/` for shared
- Korean as primary language in UI, English supported via next-intl
