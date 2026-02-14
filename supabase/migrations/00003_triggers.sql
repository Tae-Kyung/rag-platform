-- AskDocs RAG Platform Triggers
-- Migration 3: Auto-create profile + free subscription on signup

-- ============================================
-- Trigger: handle_new_user
-- Creates profile + free subscription when a new user signs up
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Create profile
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  -- Create free subscription
  insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  values (
    new.id,
    'free',
    'active',
    now(),
    now() + interval '100 years'
  );

  return new;
end;
$$;

-- Attach trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Trigger: update_updated_at
-- Auto-updates the updated_at column on row modification
-- ============================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to relevant tables
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at();

create trigger update_usage_records_updated_at
  before update on public.usage_records
  for each row execute function public.update_updated_at();

create trigger update_bots_updated_at
  before update on public.bots
  for each row execute function public.update_updated_at();

create trigger update_documents_updated_at
  before update on public.documents
  for each row execute function public.update_updated_at();

create trigger update_qa_pairs_updated_at
  before update on public.qa_pairs
  for each row execute function public.update_updated_at();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

create trigger update_channel_configs_updated_at
  before update on public.channel_configs
  for each row execute function public.update_updated_at();
