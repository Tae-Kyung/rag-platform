-- AskDocs RAG Platform Schema
-- Migration 1: Core tables + pgvector

-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================
-- 1. profiles (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 2. plans (subscription tiers)
-- ============================================
create table public.plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly integer not null default 0,
  price_yearly integer not null default 0,
  max_bots integer not null default 1,
  max_documents integer not null default 10,
  max_messages_per_month integer not null default 100,
  max_storage_mb integer not null default 100,
  features jsonb not null default '{}',
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- 3. subscriptions
-- ============================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ============================================
-- 4. usage_records
-- ============================================
create table public.usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  messages_used integer not null default 0,
  documents_used integer not null default 0,
  storage_used_mb integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 5. invoices
-- ============================================
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_invoice_id text,
  amount integer not null,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'void')),
  invoice_url text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- 6. bots
-- ============================================
create table public.bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  system_prompt text,
  model text not null default 'gpt-4o-mini',
  temperature numeric(3,2) not null default 0.3,
  max_tokens integer not null default 1000,
  widget_config jsonb not null default '{}',
  rag_config jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 7. documents
-- ============================================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'html', 'url', 'text', 'qa')),
  file_size integer,
  storage_path text,
  source_url text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  chunk_count integer not null default 0,
  error_message text,
  language text,
  doc_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 8. document_chunks
-- ============================================
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  bot_id uuid not null references public.bots(id) on delete cascade,
  content text not null,
  metadata jsonb not null default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- IVFFlat index for vector similarity search
create index on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for bot_id filtering
create index idx_document_chunks_bot_id on public.document_chunks(bot_id);

-- ============================================
-- 9. qa_pairs
-- ============================================
create table public.qa_pairs (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 10. conversations
-- ============================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  session_id text,
  language text not null default 'en',
  channel text not null default 'web' check (channel in ('web', 'telegram', 'kakao', 'wechat', 'api')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 11. messages
-- ============================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sources jsonb,
  tokens_used integer,
  created_at timestamptz not null default now()
);

-- ============================================
-- 12. feedback
-- ============================================
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ============================================
-- 13. channel_configs
-- ============================================
create table public.channel_configs (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots(id) on delete cascade,
  channel text not null check (channel in ('telegram', 'kakao', 'wechat', 'api')),
  config jsonb not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(bot_id, channel)
);

-- ============================================
-- 14. api_keys
-- ============================================
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- 15. team_members
-- ============================================
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique(owner_id, member_id)
);

-- ============================================
-- 16. system_logs
-- ============================================
create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  source text not null,
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================
-- RPC: match_documents (vector similarity search)
-- ============================================
create or replace function public.match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  filter_bot_id uuid default null,
  match_threshold float default 0.0
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where
    (filter_bot_id is null or dc.bot_id = filter_bot_id)
    and 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;
