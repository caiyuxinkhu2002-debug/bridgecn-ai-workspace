REVOKE EXECUTE ON FUNCTION public.get_active_plan(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_plan(UUID, TEXT) TO service_role;