
-- One-shot cleanup of currently stuck jobs
UPDATE public.ai_jobs
SET status = 'failed',
    error = COALESCE(error, 'Stale job auto-failed by reaper'),
    completed_at = now()
WHERE status IN ('queued','running')
  AND updated_at < now() - interval '5 minutes';

-- Reaper function used by clients to clear stale rows on demand.
CREATE OR REPLACE FUNCTION public.reap_stale_ai_jobs()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
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

GRANT EXECUTE ON FUNCTION public.reap_stale_ai_jobs() TO authenticated;
