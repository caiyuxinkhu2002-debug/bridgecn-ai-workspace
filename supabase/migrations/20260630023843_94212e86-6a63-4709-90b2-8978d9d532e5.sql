
-- ============ ENUMS ============
CREATE TYPE public.workspace_role AS ENUM ('owner','admin','editor','viewer');
CREATE TYPE public.project_stage AS ENUM ('research','consumer','localization','launch','reports');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  company TEXT,
  role TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  theme TEXT NOT NULL DEFAULT 'Light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ WORKSPACES ============
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  region TEXT NOT NULL DEFAULT 'KR',
  plan TEXT NOT NULL DEFAULT 'Free',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- ============ MEMBERS ============
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role public.workspace_role NOT NULL DEFAULT 'viewer',
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  UNIQUE (workspace_id, email)
);
CREATE INDEX ON public.workspace_members(workspace_id);
CREATE INDEX ON public.workspace_members(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY HELPERS (avoid recursion) ============
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _workspace AND user_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.workspace_role_of(_workspace UUID, _user UUID)
RETURNS public.workspace_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members WHERE workspace_id = _workspace AND user_id = _user LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_admin_workspace(_workspace UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace AND user_id = _user AND role IN ('owner','admin')
  );
$$;

-- workspaces policies
CREATE POLICY "Workspaces: members read" ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "Workspaces: creator can insert" ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Workspaces: admins update" ON public.workspaces FOR UPDATE TO authenticated
  USING (public.can_admin_workspace(id, auth.uid()))
  WITH CHECK (public.can_admin_workspace(id, auth.uid()));
CREATE POLICY "Workspaces: owner delete" ON public.workspaces FOR DELETE TO authenticated
  USING (public.workspace_role_of(id, auth.uid()) = 'owner');

-- members policies
CREATE POLICY "Members: members read" ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members: admins insert" ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (public.can_admin_workspace(workspace_id, auth.uid()));
CREATE POLICY "Members: admins update" ON public.workspace_members FOR UPDATE TO authenticated
  USING (public.can_admin_workspace(workspace_id, auth.uid()))
  WITH CHECK (public.can_admin_workspace(workspace_id, auth.uid()));
CREATE POLICY "Members: admins delete" ON public.workspace_members FOR DELETE TO authenticated
  USING (public.can_admin_workspace(workspace_id, auth.uid()) AND role <> 'owner');

-- ============ PROJECTS ============
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT,
  industry TEXT,
  region TEXT,
  stage public.project_stage NOT NULL DEFAULT 'research',
  owner_name TEXT,
  progress INT NOT NULL DEFAULT 0,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.projects(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects: members read" ON public.projects FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Projects: admins write" ON public.projects FOR ALL TO authenticated
  USING (public.can_admin_workspace(workspace_id, auth.uid()))
  WITH CHECK (public.can_admin_workspace(workspace_id, auth.uid()));

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_workspaces_updated BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ NEW USER BOOTSTRAP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _name TEXT;
  _ws_id UUID;
  _seed BOOLEAN;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1));

  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, _name)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.workspaces (name, region, plan, created_by)
  VALUES (COALESCE(_name,'My') || '''s Workspace', 'KR', 'Free', NEW.id)
  RETURNING id INTO _ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, email, name, role, joined_at)
  VALUES (_ws_id, NEW.id, NEW.email, _name, 'owner', now());

  -- Seed demo projects so the workspace is not empty
  INSERT INTO public.projects (workspace_id, name, initials, industry, region, stage, owner_name, progress, summary) VALUES
    (_ws_id, 'Beauty of Joseon', 'BJ', 'Hanbang skincare', 'Shanghai · Tier 1', 'consumer', _name, 48, 'Premium hanbang skincare entering Tmall and Xiaohongshu in Q3 2026.'),
    (_ws_id, 'ANUA', 'AN', 'Skincare · clean beauty', 'Tier 1 + Tier 1.5', 'localization', _name, 68, 'Xiaohongshu KOC seeding for Heartleaf line, 50 creators in pilot wave.'),
    (_ws_id, 'Medicube', 'MC', 'Derma cosmetics', 'Mainland · Tier 1', 'launch', _name, 86, 'Tmall flagship store opening combined with Douyin live commerce kickoff.');

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ STORAGE policies ============
-- avatars: public read; user can upload to {user_id}/...
CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Avatars user upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars user delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- workspace-logos: public read; admins of {workspace_id} can write
CREATE POLICY "Workspace logos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'workspace-logos');
CREATE POLICY "Workspace logos admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'workspace-logos'
    AND public.can_admin_workspace(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "Workspace logos admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'workspace-logos'
    AND public.can_admin_workspace(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "Workspace logos admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'workspace-logos'
    AND public.can_admin_workspace(((storage.foldername(name))[1])::uuid, auth.uid())
  );
