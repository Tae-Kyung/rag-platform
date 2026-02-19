-- Add 'discord' to conversations.channel CHECK constraint
alter table public.conversations drop constraint if exists conversations_channel_check;
alter table public.conversations add constraint conversations_channel_check
  check (channel in ('web', 'telegram', 'kakao', 'whatsapp', 'discord', 'wechat', 'api'));

-- Add 'discord' to channel_configs.channel CHECK constraint
alter table public.channel_configs drop constraint if exists channel_configs_channel_check;
alter table public.channel_configs add constraint channel_configs_channel_check
  check (channel in ('telegram', 'kakao', 'whatsapp', 'discord', 'wechat', 'api'));

-- Discord user-to-conversation mapping table
create table public.discord_user_mappings (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null,
  bot_id uuid not null references public.bots(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: one mapping per discord user + bot pair
alter table public.discord_user_mappings
  add constraint uq_discord_user_bot unique (discord_user_id, bot_id);

-- Indexes
create index idx_discord_user_mappings_user_id on public.discord_user_mappings(discord_user_id);
create index idx_discord_user_mappings_bot_id on public.discord_user_mappings(bot_id);

-- Enable RLS
alter table public.discord_user_mappings enable row level security;

-- Service role full access
create policy "Service role full access on discord_user_mappings"
  on public.discord_user_mappings
  for all
  using (true)
  with check (true);
