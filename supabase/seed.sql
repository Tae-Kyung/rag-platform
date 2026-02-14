-- AskDocs RAG Platform Seed Data
-- 4 subscription plans

insert into public.plans (id, name, description, price_monthly, price_yearly, max_bots, max_documents, max_messages_per_month, max_storage_mb, features)
values
  (
    'free',
    'Free',
    'Get started with basic RAG capabilities',
    0, 0,
    1, 10, 100, 100,
    '{"channels": ["web"], "support": "community"}'::jsonb
  ),
  (
    'starter',
    'Starter',
    'For small teams and projects',
    29, 290,
    3, 50, 1000, 500,
    '{"channels": ["web", "api"], "support": "email", "custom_branding": true}'::jsonb
  ),
  (
    'pro',
    'Pro',
    'For growing businesses',
    99, 990,
    10, 200, 10000, 2000,
    '{"channels": ["web", "api", "telegram", "kakao"], "support": "priority", "custom_branding": true, "analytics": true, "team_members": 5}'::jsonb
  ),
  (
    'enterprise',
    'Enterprise',
    'Custom solutions for large organizations',
    0, 0,
    -1, -1, -1, -1,
    '{"channels": ["web", "api", "telegram", "kakao", "wechat"], "support": "dedicated", "custom_branding": true, "analytics": true, "team_members": -1, "sla": true}'::jsonb
  )
on conflict (id) do nothing;
