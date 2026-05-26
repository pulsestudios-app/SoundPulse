-- Privacy-safe blocked user lookup with display names only.

CREATE OR REPLACE FUNCTION public.get_blocked_users_with_profiles()
RETURNS TABLE (
  blocked_id uuid,
  display_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.blocked_id, p.display_name
  FROM public.blocked_users b
  LEFT JOIN public.profiles p ON p.id = b.blocked_id
  WHERE b.blocker_id = auth.uid()
  ORDER BY b.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_blocked_users_with_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_blocked_users_with_profiles() TO authenticated;
