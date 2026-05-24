-- Paranoia-pass fixes: profile INSERT guard, atomic generation quota, report trust, republish gate.

-- ---------------------------------------------------------------------------
-- Attack A: block premium fields on client profile INSERT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION profiles_force_free_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.plan := 'free';
  NEW.subscription_active := false;
  NEW.subscription_status := NULL;
  NEW.subscription_tier := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_force_free_on_insert ON profiles;
CREATE TRIGGER profiles_force_free_on_insert
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_force_free_on_insert();

-- ---------------------------------------------------------------------------
-- Attack D: atomic generation slot reserve / release (service role only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generation_limit_for_plan(plan_raw text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN plan_raw IS NULL OR trim(lower(plan_raw)) IN ('', 'free') THEN 0
    WHEN trim(lower(plan_raw)) = 'basic' THEN 10
    WHEN trim(lower(plan_raw)) IN ('student', 'semester', 'pro_weekly') THEN 10
    WHEN trim(lower(plan_raw)) IN ('pro', 'yearly') THEN 20
    WHEN trim(lower(plan_raw)) IN ('unlimited', 'lifetime') THEN 40
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION resolve_user_plan_for_generation(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_plan text;
  v_sub_plan text;
BEGIN
  SELECT NULLIF(trim(plan), '') INTO v_profile_plan
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile_plan IS NOT NULL AND lower(v_profile_plan) <> 'free' THEN
    RETURN v_profile_plan;
  END IF;

  SELECT NULLIF(trim(s.plan), '') INTO v_sub_plan
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND lower(COALESCE(s.status, '')) = 'active'
  ORDER BY s.expires_at DESC NULLS LAST
  LIMIT 1;

  RETURN COALESCE(v_sub_plan, 'free');
END;
$$;

CREATE OR REPLACE FUNCTION reserve_generation_slot(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_limit integer;
  v_month_key text;
  v_used integer;
  v_profile profiles%ROWTYPE;
BEGIN
  v_month_key := to_char(timezone('UTC', now()), 'YYYY-MM');

  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_plan := resolve_user_plan_for_generation(p_user_id);
  v_limit := generation_limit_for_plan(v_plan);

  IF v_limit <= 0 THEN
    RETURN false;
  END IF;

  IF v_profile.generations_month = v_month_key THEN
    v_used := COALESCE(v_profile.generations_used_this_month, 0);
  ELSE
    v_used := 0;
  END IF;

  IF v_used >= v_limit THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET
    generations_used_this_month = v_used + 1,
    generations_month = v_month_key
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION release_generation_slot(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_key text;
  v_used integer;
  v_profile profiles%ROWTYPE;
BEGIN
  v_month_key := to_char(timezone('UTC', now()), 'YYYY-MM');

  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_profile.generations_month IS DISTINCT FROM v_month_key THEN
    RETURN false;
  END IF;

  v_used := COALESCE(v_profile.generations_used_this_month, 0);
  IF v_used <= 0 THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET generations_used_this_month = v_used - 1
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION generation_limit_for_plan(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_user_plan_for_generation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION reserve_generation_slot(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION release_generation_slot(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_generation_slot(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION release_generation_slot(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Attack L: trusted reporters only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_user_email_verified()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.email_confirmed_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_account_age_ok_for_reports()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = auth.uid()
      AND u.created_at <= now() - interval '24 hours'
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_can_submit_report()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth_user_email_verified() AND auth_user_account_age_ok_for_reports();
$$;

REVOKE ALL ON FUNCTION auth_user_email_verified() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_user_account_age_ok_for_reports() FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_user_can_submit_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_user_email_verified() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_account_age_ok_for_reports() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_can_submit_report() TO authenticated;

DROP POLICY IF EXISTS "sound_reports_insert_own" ON sound_reports;
CREATE POLICY "sound_reports_insert_own"
  ON sound_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth_user_can_submit_report());

CREATE OR REPLACE FUNCTION handle_sound_report()
RETURNS TRIGGER AS $$
DECLARE
  distinct_trusted_reporters integer;
BEGIN
  UPDATE community_sounds
  SET report_count = report_count + 1
  WHERE id = NEW.sound_id;

  SELECT COUNT(DISTINCT sr.user_id) INTO distinct_trusted_reporters
  FROM sound_reports sr
  INNER JOIN auth.users u ON u.id = sr.user_id
  WHERE sr.sound_id = NEW.sound_id
    AND sr.status = 'pending'
    AND u.email_confirmed_at IS NOT NULL
    AND u.created_at <= now() - interval '24 hours';

  IF distinct_trusted_reporters >= 3 THEN
    UPDATE community_sounds
    SET is_hidden = true
    WHERE id = NEW.sound_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ---------------------------------------------------------------------------
-- Attack M: re-publishing to Discover requires premium
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "community_sounds_update_own" ON community_sounds;

CREATE POLICY "community_sounds_update_own"
  ON community_sounds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (NOT COALESCE(is_public, false) OR auth_user_has_premium())
  );
