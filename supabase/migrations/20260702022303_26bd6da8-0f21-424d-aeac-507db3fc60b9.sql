
-- 1) Create private schema for internal helpers
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2) Recreate helper functions in private schema
CREATE OR REPLACE FUNCTION private.is_workspace_member(_workspace uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION private.can_admin_workspace(_workspace uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace AND user_id = _user AND role IN ('owner','admin')
  );
$$;

CREATE OR REPLACE FUNCTION private.workspace_role_of(_workspace uuid, _user uuid)
RETURNS public.workspace_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members WHERE workspace_id = _workspace AND user_id = _user LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.is_workspace_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_admin_workspace(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.workspace_role_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
-- Policies invoke these as SECURITY DEFINER through the RLS engine; grant only to postgres/service_role for direct use.
GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.can_admin_workspace(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION private.workspace_role_of(uuid, uuid) TO service_role;

-- 3) Recreate all policies to reference private.* helpers

-- workspaces
DROP POLICY IF EXISTS "Workspaces: members read" ON public.workspaces;
DROP POLICY IF EXISTS "Workspaces: admins update" ON public.workspaces;
DROP POLICY IF EXISTS "Workspaces: owner delete" ON public.workspaces;
CREATE POLICY "Workspaces: members read" ON public.workspaces FOR SELECT TO authenticated
  USING (private.is_workspace_member(id, auth.uid()));
CREATE POLICY "Workspaces: admins update" ON public.workspaces FOR UPDATE TO authenticated
  USING (private.can_admin_workspace(id, auth.uid()))
  WITH CHECK (private.can_admin_workspace(id, auth.uid()));
CREATE POLICY "Workspaces: owner delete" ON public.workspaces FOR DELETE TO authenticated
  USING (private.workspace_role_of(id, auth.uid()) = 'owner'::public.workspace_role);

-- workspace_members
DROP POLICY IF EXISTS "Members: admins read" ON public.workspace_members;
DROP POLICY IF EXISTS "Members: admins insert" ON public.workspace_members;
DROP POLICY IF EXISTS "Members: admins update" ON public.workspace_members;
DROP POLICY IF EXISTS "Members: admins delete" ON public.workspace_members;
CREATE POLICY "Members: admins read" ON public.workspace_members FOR SELECT TO authenticated
  USING (private.can_admin_workspace(workspace_id, auth.uid()));
CREATE POLICY "Members: admins insert" ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    private.can_admin_workspace(workspace_id, auth.uid())
    AND (role <> 'owner'::public.workspace_role OR private.workspace_role_of(workspace_id, auth.uid()) = 'owner'::public.workspace_role)
  );
CREATE POLICY "Members: admins update" ON public.workspace_members FOR UPDATE TO authenticated
  USING (private.can_admin_workspace(workspace_id, auth.uid()))
  WITH CHECK (
    private.can_admin_workspace(workspace_id, auth.uid())
    AND (role <> 'owner'::public.workspace_role OR private.workspace_role_of(workspace_id, auth.uid()) = 'owner'::public.workspace_role)
  );
CREATE POLICY "Members: admins delete" ON public.workspace_members FOR DELETE TO authenticated
  USING (private.can_admin_workspace(workspace_id, auth.uid()) AND role <> 'owner'::public.workspace_role);

-- projects
DROP POLICY IF EXISTS "Projects: members read" ON public.projects;
DROP POLICY IF EXISTS "Projects: admins write" ON public.projects;
CREATE POLICY "Projects: members read" ON public.projects FOR SELECT TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Projects: admins write" ON public.projects FOR ALL TO authenticated
  USING (private.can_admin_workspace(workspace_id, auth.uid()))
  WITH CHECK (private.can_admin_workspace(workspace_id, auth.uid()));

-- ai_jobs
DROP POLICY IF EXISTS "ai_jobs select by workspace members" ON public.ai_jobs;
DROP POLICY IF EXISTS "ai_jobs insert by workspace members" ON public.ai_jobs;
DROP POLICY IF EXISTS "ai_jobs update own" ON public.ai_jobs;
DROP POLICY IF EXISTS "ai_jobs delete own" ON public.ai_jobs;
CREATE POLICY "ai_jobs select by workspace members" ON public.ai_jobs FOR SELECT TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "ai_jobs insert by workspace members" ON public.ai_jobs FOR INSERT TO authenticated
  WITH CHECK (private.is_workspace_member(workspace_id, auth.uid()) AND user_id = auth.uid());
CREATE POLICY "ai_jobs update own" ON public.ai_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND private.is_workspace_member(workspace_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND private.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "ai_jobs delete own" ON public.ai_jobs FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND private.is_workspace_member(workspace_id, auth.uid()));

-- project_checklist
DROP POLICY IF EXISTS "members can read project checklist" ON public.project_checklist;
DROP POLICY IF EXISTS "members can write project checklist" ON public.project_checklist;
DROP POLICY IF EXISTS "members can update project checklist" ON public.project_checklist;
DROP POLICY IF EXISTS "members can delete project checklist" ON public.project_checklist;
CREATE POLICY "members can read project checklist" ON public.project_checklist FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_checklist.project_id AND private.is_workspace_member(p.workspace_id, auth.uid())));
CREATE POLICY "members can write project checklist" ON public.project_checklist FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_checklist.project_id AND private.is_workspace_member(p.workspace_id, auth.uid())));
CREATE POLICY "members can update project checklist" ON public.project_checklist FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_checklist.project_id AND private.is_workspace_member(p.workspace_id, auth.uid())));
CREATE POLICY "members can delete project checklist" ON public.project_checklist FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_checklist.project_id AND private.is_workspace_member(p.workspace_id, auth.uid())));

-- reports
DROP POLICY IF EXISTS "members can read reports" ON public.reports;
DROP POLICY IF EXISTS "members can insert reports" ON public.reports;
DROP POLICY IF EXISTS "members can update reports" ON public.reports;
DROP POLICY IF EXISTS "members can delete reports" ON public.reports;
CREATE POLICY "members can read reports" ON public.reports FOR SELECT TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members can insert reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (private.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members can update reports" ON public.reports FOR UPDATE TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "members can delete reports" ON public.reports FOR DELETE TO authenticated
  USING (private.is_workspace_member(workspace_id, auth.uid()));

-- storage.objects: workspace-logos admin policies (recreate referencing private.*)
DROP POLICY IF EXISTS "Workspace logos admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Workspace logos admin update" ON storage.objects;
DROP POLICY IF EXISTS "Workspace logos admin delete" ON storage.objects;
CREATE POLICY "Workspace logos admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workspace-logos' AND private.can_admin_workspace(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Workspace logos admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'workspace-logos' AND private.can_admin_workspace(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "Workspace logos admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'workspace-logos' AND private.can_admin_workspace(((storage.foldername(name))[1])::uuid, auth.uid()));

-- 4) Drop the old public.* helpers (no longer referenced by any policy)
DROP FUNCTION IF EXISTS public.is_workspace_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_admin_workspace(uuid, uuid);
DROP FUNCTION IF EXISTS public.workspace_role_of(uuid, uuid);

-- 5) Tighten storage SELECT policies

-- Avatars: only the owning user can read their own folder
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Workspace logos: only workspace members can read
DROP POLICY IF EXISTS "Workspace logos public read" ON storage.objects;
CREATE POLICY "Workspace logos member read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'workspace-logos' AND private.is_workspace_member(((storage.foldername(name))[1])::uuid, auth.uid()));
