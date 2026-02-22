-- Custom LLM models managed by admin
-- Allows connecting to OpenAI-compatible endpoints (e.g., local EXAONE)

CREATE TABLE public.custom_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_id text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'Custom',
  base_url text NOT NULL,
  api_key_env text NOT NULL DEFAULT '',              -- env var name, e.g. "EXAONE_API_KEY"
  api_key_header text NOT NULL DEFAULT 'x-api-key',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only admins can manage custom models (via service role client)
-- No RLS needed since all access goes through service role
ALTER TABLE public.custom_models ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (bypasses RLS automatically)
-- Allow authenticated users to read active models
CREATE POLICY "Anyone can read active custom models"
  ON public.custom_models
  FOR SELECT
  USING (is_active = true);
