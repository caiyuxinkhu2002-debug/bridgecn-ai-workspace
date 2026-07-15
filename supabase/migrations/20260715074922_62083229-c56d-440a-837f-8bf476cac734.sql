CREATE EXTENSION IF NOT EXISTS vector;

-- KOL master table
CREATE TABLE public.kols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('xiaohongshu','douyin','bilibili','wechat')),
  handle TEXT NOT NULL,
  display_name TEXT,
  profile_url TEXT NOT NULL,
  avatar_url TEXT,
  followers INTEGER,
  bio TEXT,
  verified_source TEXT NOT NULL DEFAULT 'crawl' CHECK (verified_source IN ('crawl','manual')),
  primary_categories TEXT[] NOT NULL DEFAULT '{}',
  content_types TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT[] NOT NULL DEFAULT '{}',
  audience_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  mentioned_brands TEXT[] NOT NULL DEFAULT '{}',
  contact_public_email TEXT,
  contact_note TEXT,
  price_band JSONB,
  ai_confidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  last_crawled_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, handle)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kols TO authenticated;
GRANT ALL ON public.kols TO service_role;
ALTER TABLE public.kols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kols readable by workspace members" ON public.kols FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = kols.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "kols writable by workspace members" ON public.kols FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = kols.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "kols updatable by workspace members" ON public.kols FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = kols.workspace_id AND wm.user_id = auth.uid()));
CREATE POLICY "kols deletable by workspace members" ON public.kols FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = kols.workspace_id AND wm.user_id = auth.uid()));

CREATE INDEX kols_workspace_idx ON public.kols(workspace_id);
CREATE INDEX kols_platform_idx ON public.kols(platform);
CREATE INDEX kols_embedding_idx ON public.kols USING hnsw (embedding vector_cosine_ops);
CREATE TRIGGER kols_touch BEFORE UPDATE ON public.kols FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Raw snapshots
CREATE TABLE public.kol_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kol_id UUID NOT NULL REFERENCES public.kols(id) ON DELETE CASCADE,
  raw_markdown TEXT,
  raw_json JSONB,
  ai_confidence JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.kol_snapshots TO authenticated;
GRANT ALL ON public.kol_snapshots TO service_role;
ALTER TABLE public.kol_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kol_snapshots readable by workspace members" ON public.kol_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.kols k JOIN public.workspace_members wm ON wm.workspace_id = k.workspace_id
                 WHERE k.id = kol_snapshots.kol_id AND wm.user_id = auth.uid()));
CREATE POLICY "kol_snapshots insertable by workspace members" ON public.kol_snapshots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.kols k JOIN public.workspace_members wm ON wm.workspace_id = k.workspace_id
                      WHERE k.id = kol_snapshots.kol_id AND wm.user_id = auth.uid()));

CREATE INDEX kol_snapshots_kol_idx ON public.kol_snapshots(kol_id, fetched_at DESC);

-- Project shortlists
CREATE TABLE public.kol_project_shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL REFERENCES public.kols(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved','contacted','rejected','booked')),
  match_score NUMERIC,
  match_breakdown JSONB,
  notes TEXT,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, kol_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kol_project_shortlist TO authenticated;
GRANT ALL ON public.kol_project_shortlist TO service_role;
ALTER TABLE public.kol_project_shortlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shortlist readable by workspace members" ON public.kol_project_shortlist FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
                 WHERE p.id = kol_project_shortlist.project_id AND wm.user_id = auth.uid()));
CREATE POLICY "shortlist insertable by workspace members" ON public.kol_project_shortlist FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
                      WHERE p.id = kol_project_shortlist.project_id AND wm.user_id = auth.uid()));
CREATE POLICY "shortlist updatable by workspace members" ON public.kol_project_shortlist FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
                 WHERE p.id = kol_project_shortlist.project_id AND wm.user_id = auth.uid()));
CREATE POLICY "shortlist deletable by workspace members" ON public.kol_project_shortlist FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
                 WHERE p.id = kol_project_shortlist.project_id AND wm.user_id = auth.uid()));

CREATE INDEX shortlist_project_idx ON public.kol_project_shortlist(project_id);
CREATE TRIGGER shortlist_touch BEFORE UPDATE ON public.kol_project_shortlist FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Extend usage_counters
ALTER TABLE public.usage_counters ADD COLUMN IF NOT EXISTS kol_crawls INTEGER NOT NULL DEFAULT 0;