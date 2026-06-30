
DROP FUNCTION IF EXISTS public.reap_stale_ai_jobs();

CREATE OR REPLACE FUNCTION public.reap_stale_ai_jobs()
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE public.ai_jobs
    SET status = 'failed',
        error = COALESCE(error, 'Stale job auto-failed by reaper'),
        completed_at = now()
    WHERE status IN ('queued','running')
      AND updated_at < now() - interval '5 minutes'
    RETURNING 1
  )
  SELECT COUNT(*)::int FROM updated;
$$;

REVOKE ALL ON FUNCTION public.reap_stale_ai_jobs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reap_stale_ai_jobs() TO authenticated;
