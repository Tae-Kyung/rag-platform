-- KakaoTalk user-to-conversation mapping table
create table public.kakao_user_mappings (
  id uuid primary key default gen_random_uuid(),
  kakao_user_id text not null,
  bot_id uuid not null references public.bots(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  language text not null default 'ko',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one mapping per kakao user + bot pair
alter table public.kakao_user_mappings
  add constraint uq_kakao_user_bot unique (kakao_user_id, bot_id);

-- Indexes
create index idx_kakao_user_mappings_user_id on public.kakao_user_mappings(kakao_user_id);
create index idx_kakao_user_mappings_bot_id on public.kakao_user_mappings(bot_id);

-- Enable RLS
alter table public.kakao_user_mappings enable row level security;

-- Service role full access
create policy "Service role full access on kakao_user_mappings"
  on public.kakao_user_mappings
  for all
  using (true)
  with check (true);
