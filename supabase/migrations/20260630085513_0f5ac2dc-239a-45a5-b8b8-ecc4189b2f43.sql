
-- 1. Add stage_progress to projects (gated workflow state)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stage_progress jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. project_checklist — persisted launch checklist state
CREATE TABLE IF NOT EXISTS public.project_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_key text NOT NULL,
  item_key text NOT NULL,
  label text NOT NULL,
  checked boolean NOT NULL DEFAULT false,
  checked_at timestamptz,
  checked_by uuid REFERENCES auth.users(id),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, item_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_checklist TO authenticated;
GRANT ALL ON public.project_checklist TO service_role;

ALTER TABLE public.project_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read project checklist"
  ON public.project_checklist FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_checklist.project_id
      AND public.is_workspace_member(p.workspace_id, auth.uid())
  ));

CREATE POLICY "members can write project checklist"
  ON public.project_checklist FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_checklist.project_id
      AND public.is_workspace_member(p.workspace_id, auth.uid())
  ));

CREATE POLICY "members can update project checklist"
  ON public.project_checklist FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_checklist.project_id
      AND public.is_workspace_member(p.workspace_id, auth.uid())
  ));

CREATE POLICY "members can delete project checklist"
  ON public.project_checklist FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_checklist.project_id
      AND public.is_workspace_member(p.workspace_id, auth.uid())
  ));

CREATE TRIGGER trg_project_checklist_touch
  BEFORE UPDATE ON public.project_checklist
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. reports — real generated report records
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Market Entry Report',
  status text NOT NULL DEFAULT 'Ready',
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "members can insert reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "members can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "members can delete reports"
  ON public.reports FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE TRIGGER trg_reports_touch
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_reports_project ON public.reports(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_project ON public.project_checklist(project_id);
