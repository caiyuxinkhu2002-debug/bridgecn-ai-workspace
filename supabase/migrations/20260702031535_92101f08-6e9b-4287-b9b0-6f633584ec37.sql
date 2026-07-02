-- Fix workspace access helper functions so RLS policies can evaluate them safely.
-- The previous lockdown removed direct execution from authenticated users, but Postgres
-- still requires EXECUTE privilege on functions referenced by RLS policy expressions.
-- These helpers now only evaluate the current signed-in user, so direct execution
-- cannot be used to inspect another user's workspace membership or role.

CREATE OR REPLACE FUNCTION private.is_workspace_member(_workspace uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members
      WHERE workspace_id = _workspace
        AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION private.can_admin_workspace(_workspace uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.workspace_members
      WHERE workspace_id = _workspace
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION private.workspace_role_of(_workspace uuid, _user uuid)
RETURNS public.workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _user = auth.uid() THEN (
      SELECT role
      FROM public.workspace_members
      WHERE workspace_id = _workspace
        AND user_id = auth.uid()
      LIMIT 1
    )
    ELSE NULL::public.workspace_role
  END;
$$;

REVOKE ALL ON FUNCTION private.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_admin_workspace(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.workspace_role_of(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.is_workspace_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.can_admin_workspace(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.workspace_role_of(uuid, uuid) TO authenticated, service_role;