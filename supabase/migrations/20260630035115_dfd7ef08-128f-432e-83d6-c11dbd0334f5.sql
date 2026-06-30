ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS knowledge_base jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS website text;