
-- Add 'completed' stage and soft delete + new metadata columns to projects
ALTER TYPE public.project_stage ADD VALUE IF NOT EXISTS 'completed';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS target_market TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_workspace_active_idx
  ON public.projects (workspace_id) WHERE deleted_at IS NULL;
