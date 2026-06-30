CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _name TEXT;
  _ws_id UUID;
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

  RETURN NEW;
END; $function$;

UPDATE public.projects
SET deleted_at = COALESCE(deleted_at, now())
WHERE name IN ('Beauty of Joseon', 'ANUA', 'Medicube')
  AND (knowledge_base IS NULL OR knowledge_base::text = '{}');