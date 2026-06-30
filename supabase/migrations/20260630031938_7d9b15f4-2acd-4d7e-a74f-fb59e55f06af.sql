DO $$ BEGIN
  CREATE TYPE public.ai_job_status AS ENUM ('queued','running','completed','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  module text NOT NULL,
  provider text NOT NULL DEFAULT 'placeholder',
  model text,
  prompt text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.ai_job_status NOT NULL DEFAULT 'queued',
  phase text,
  output text NOT NULL DEFAULT '',
  output_data jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_jobs_workspace_idx ON public.ai_jobs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_jobs_project_idx ON public.ai_jobs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_jobs_module_idx ON public.ai_jobs(workspace_id, module, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_jobs TO authenticated;
GRANT ALL ON public.ai_jobs TO service_role;

ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_jobs select by workspace members"
  ON public.ai_jobs FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "ai_jobs insert by workspace members"
  ON public.ai_jobs FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "ai_jobs update own"
  ON public.ai_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "ai_jobs delete own"
  ON public.ai_jobs FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_workspace_member(workspace_id, auth.uid()));

CREATE TRIGGER ai_jobs_touch_updated_at
  BEFORE UPDATE ON public.ai_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();