
-- 1. Lock down SECURITY DEFINER helper functions: revoke EXECUTE from public/anon/authenticated.
--    These are only needed for use inside RLS policies (which run as the policy owner), not for
--    direct API calls. handle_new_user runs as an auth trigger, so PUBLIC execute is also unnecessary.
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_admin_workspace(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Restrict workspace_members SELECT so member emails are only readable by workspace admins/owners.
--    Members can still see their own row.
DROP POLICY IF EXISTS "Members: members read" ON public.workspace_members;

CREATE POLICY "Members: self read"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Members: admins read"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (public.can_admin_workspace(workspace_id, auth.uid()));

-- 3. Prevent role escalation on INSERT: an admin cannot create an owner; only an owner can create an owner.
DROP POLICY IF EXISTS "Members: admins insert" ON public.workspace_members;

CREATE POLICY "Members: admins insert"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_admin_workspace(workspace_id, auth.uid())
  AND (
    role <> 'owner'::workspace_role
    OR public.workspace_role_of(workspace_id, auth.uid()) = 'owner'
  )
);

-- 4. Same guard on UPDATE: prevent promoting anyone to owner unless caller is owner.
DROP POLICY IF EXISTS "Members: admins update" ON public.workspace_members;

CREATE POLICY "Members: admins update"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (public.can_admin_workspace(workspace_id, auth.uid()))
WITH CHECK (
  public.can_admin_workspace(workspace_id, auth.uid())
  AND (
    role <> 'owner'::workspace_role
    OR public.workspace_role_of(workspace_id, auth.uid()) = 'owner'
  )
);
