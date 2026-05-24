-- Premium-only community actions: pulse, save, share to Discover.

CREATE OR REPLACE FUNCTION auth_user_has_premium()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.user_id = auth.uid()
      AND LOWER(COALESCE(s.status, '')) IN ('active', 'trialing')
      AND LOWER(COALESCE(s.plan, '')) NOT IN ('', 'free')
      AND (s.expires_at IS NULL OR s.expires_at > now())
  )
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
      AND LOWER(COALESCE(p.plan, '')) NOT IN ('', 'free')
      AND COALESCE(p.subscription_active, false) = true
      AND LOWER(COALESCE(p.subscription_status, '')) IN ('active', 'trialing')
  );
$$;

REVOKE ALL ON FUNCTION auth_user_has_premium() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_user_has_premium() TO authenticated;

DROP POLICY IF EXISTS "sound_likes_insert_own" ON sound_likes;
CREATE POLICY "sound_likes_insert_own"
  ON sound_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth_user_has_premium());

DROP POLICY IF EXISTS "sound_saves_insert_own" ON sound_saves;
CREATE POLICY "sound_saves_insert_own"
  ON sound_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth_user_has_premium());

DROP POLICY IF EXISTS "community_sounds_insert_own" ON community_sounds;
CREATE POLICY "community_sounds_insert_own"
  ON community_sounds FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth_user_has_premium());
