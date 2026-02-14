-- Telegram chat-to-conversation mapping table
create table public.telegram_chat_mappings (
  id uuid primary key default gen_random_uuid(),
  telegram_chat_id bigint not null,
  bot_id uuid not null references public.bots(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one mapping per telegram chat + bot pair
alter table public.telegram_chat_mappings
  add constraint uq_telegram_chat_bot unique (telegram_chat_id, bot_id);

-- Indexes
create index idx_telegram_chat_mappings_chat_id on public.telegram_chat_mappings(telegram_chat_id);
create index idx_telegram_chat_mappings_bot_id on public.telegram_chat_mappings(bot_id);

-- Enable RLS
alter table public.telegram_chat_mappings enable row level security;

-- Service role full access
create policy "Service role full access on telegram_chat_mappings"
  on public.telegram_chat_mappings
  for all
  using (true)
  with check (true);
