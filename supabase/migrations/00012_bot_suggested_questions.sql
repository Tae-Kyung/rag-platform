-- Add suggested_questions column to bots table
ALTER TABLE public.bots
  ADD COLUMN suggested_questions jsonb NOT NULL DEFAULT '[]'::jsonb;
