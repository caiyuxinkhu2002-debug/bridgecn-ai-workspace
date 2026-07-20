
CREATE TABLE public.platform_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('xiaohongshu','douyin')),
  category TEXT NOT NULL,
  query TEXT NOT NULL,
  source_url TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_excerpt TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX platform_snapshots_lookup_idx
  ON public.platform_snapshots (platform, category, captured_at DESC);

GRANT SELECT ON public.platform_snapshots TO authenticated;
GRANT ALL ON public.platform_snapshots TO service_role;

ALTER TABLE public.platform_snapshots ENABLE ROW LEVEL SECURITY;

-- Global read for any signed-in user: this is aggregate market
-- data, not per-user data. Writes are server-side (service role) only.
CREATE POLICY "Authenticated users can read platform snapshots"
  ON public.platform_snapshots FOR SELECT
  TO authenticated
  USING (true);
