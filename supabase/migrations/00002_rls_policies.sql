-- AskDocs RAG Platform RLS Policies
-- Migration 2: Row Level Security

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_records enable row level security;
alter table public.invoices enable row level security;
alter table public.bots enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.qa_pairs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.feedback enable row level security;
alter table public.channel_configs enable row level security;
alter table public.api_keys enable row level security;
alter table public.team_members enable row level security;
alter table public.system_logs enable row level security;

-- ============================================
-- profiles
-- ============================================
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- ============================================
-- plans (public read)
-- ============================================
create policy "Anyone can view plans"
  on public.plans for select
  using (true);

-- ============================================
-- subscriptions
-- ============================================
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ============================================
-- usage_records
-- ============================================
create policy "Users can view own usage"
  on public.usage_records for select
  using (auth.uid() = user_id);

-- ============================================
-- invoices
-- ============================================
create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

-- ============================================
-- bots
-- ============================================
create policy "Owners can view own bots"
  on public.bots for select
  using (auth.uid() = user_id);

create policy "Owners can create bots"
  on public.bots for insert
  with check (auth.uid() = user_id);

create policy "Owners can update own bots"
  on public.bots for update
  using (auth.uid() = user_id);

create policy "Owners can delete own bots"
  on public.bots for delete
  using (auth.uid() = user_id);

-- ============================================
-- documents
-- ============================================
create policy "Owners can view bot documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.bots
      where bots.id = documents.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can create bot documents"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.bots
      where bots.id = documents.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can update bot documents"
  on public.documents for update
  using (
    exists (
      select 1 from public.bots
      where bots.id = documents.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can delete bot documents"
  on public.documents for delete
  using (
    exists (
      select 1 from public.bots
      where bots.id = documents.bot_id
      and bots.user_id = auth.uid()
    )
  );

-- ============================================
-- document_chunks
-- ============================================
create policy "Owners can view bot chunks"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.bots
      where bots.id = document_chunks.bot_id
      and bots.user_id = auth.uid()
    )
  );

-- Service role handles insert/delete for chunks (RAG pipeline)

-- ============================================
-- qa_pairs
-- ============================================
create policy "Owners can view bot qa_pairs"
  on public.qa_pairs for select
  using (
    exists (
      select 1 from public.bots
      where bots.id = qa_pairs.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can create bot qa_pairs"
  on public.qa_pairs for insert
  with check (
    exists (
      select 1 from public.bots
      where bots.id = qa_pairs.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can update bot qa_pairs"
  on public.qa_pairs for update
  using (
    exists (
      select 1 from public.bots
      where bots.id = qa_pairs.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can delete bot qa_pairs"
  on public.qa_pairs for delete
  using (
    exists (
      select 1 from public.bots
      where bots.id = qa_pairs.bot_id
      and bots.user_id = auth.uid()
    )
  );

-- ============================================
-- conversations
-- ============================================
create policy "Bot owners can view conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.bots
      where bots.id = conversations.bot_id
      and bots.user_id = auth.uid()
    )
  );

-- Service role handles insert for conversations (end users)

-- ============================================
-- messages
-- ============================================
create policy "Bot owners can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      join public.bots b on b.id = c.bot_id
      where c.id = messages.conversation_id
      and b.user_id = auth.uid()
    )
  );

-- Service role handles insert for messages

-- ============================================
-- feedback
-- ============================================
create policy "Bot owners can view feedback"
  on public.feedback for select
  using (
    exists (
      select 1 from public.messages m
      join public.conversations c on c.id = m.conversation_id
      join public.bots b on b.id = c.bot_id
      where m.id = feedback.message_id
      and b.user_id = auth.uid()
    )
  );

create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (true);

-- ============================================
-- channel_configs
-- ============================================
create policy "Owners can view bot channel_configs"
  on public.channel_configs for select
  using (
    exists (
      select 1 from public.bots
      where bots.id = channel_configs.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can create bot channel_configs"
  on public.channel_configs for insert
  with check (
    exists (
      select 1 from public.bots
      where bots.id = channel_configs.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can update bot channel_configs"
  on public.channel_configs for update
  using (
    exists (
      select 1 from public.bots
      where bots.id = channel_configs.bot_id
      and bots.user_id = auth.uid()
    )
  );

create policy "Owners can delete bot channel_configs"
  on public.channel_configs for delete
  using (
    exists (
      select 1 from public.bots
      where bots.id = channel_configs.bot_id
      and bots.user_id = auth.uid()
    )
  );

-- ============================================
-- api_keys
-- ============================================
create policy "Users can view own api_keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can create api_keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own api_keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- ============================================
-- team_members
-- ============================================
create policy "Users can view related team_members"
  on public.team_members for select
  using (auth.uid() = owner_id or auth.uid() = member_id);

-- ============================================
-- system_logs (admin only)
-- ============================================
create policy "Admins can view system_logs"
  on public.system_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
