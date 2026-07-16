
-- Allow global catalog rows (workspace_id NULL) and add data_source classification
ALTER TABLE public.kols ALTER COLUMN workspace_id DROP NOT NULL;
ALTER TABLE public.kols ADD COLUMN IF NOT EXISTS data_source text NOT NULL DEFAULT 'crawl';
ALTER TABLE public.kols ADD COLUMN IF NOT EXISTS popularity_score integer;

-- Recompute popularity_score from followers as a cheap default
UPDATE public.kols SET popularity_score = COALESCE(followers, 0) WHERE popularity_score IS NULL;

CREATE INDEX IF NOT EXISTS kols_popularity_idx ON public.kols(popularity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS kols_platform_idx ON public.kols(platform);
CREATE INDEX IF NOT EXISTS kols_primary_categories_gin ON public.kols USING GIN (primary_categories);

-- Drop-and-recreate the unique constraint to accept NULL workspace_id
-- (Two identical global rows would collide on NULL, so add a partial unique for globals)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kols_workspace_id_platform_handle_key') THEN
    ALTER TABLE public.kols DROP CONSTRAINT kols_workspace_id_platform_handle_key;
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS kols_ws_platform_handle_uq
  ON public.kols(workspace_id, platform, handle) WHERE workspace_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS kols_global_platform_handle_uq
  ON public.kols(platform, handle) WHERE workspace_id IS NULL;

-- Update RLS: workspace members see their kols + everyone sees global (workspace_id IS NULL)
DROP POLICY IF EXISTS "kols readable by workspace members" ON public.kols;
CREATE POLICY "kols readable (global + workspace)" ON public.kols FOR SELECT
  USING (
    workspace_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = kols.workspace_id AND wm.user_id = auth.uid()
    )
  );
