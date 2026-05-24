-- Security hardening: subscriptions lockdown, RLS WITH CHECK, report spam, public profiles view.

-- Optional billing columns used by backend (service role)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_tier text,
  ADD COLUMN IF NOT EXISTS subscription_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_status text;

-- ---------------------------------------------------------------------------
-- profiles: own-row access only; block client edits to sensitive columns
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles public read for community" ON profiles;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION profiles_guard_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.email := OLD.email;
  NEW.plan := OLD.plan;
  NEW.generations_used_this_month := OLD.generations_used_this_month;
  NEW.generations_month := OLD.generations_month;
  NEW.subscription_tier := OLD.subscription_tier;
  NEW.subscription_active := OLD.subscription_active;
  NEW.subscription_status := OLD.subscription_status;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_guard_sensitive_columns ON profiles;
CREATE TRIGGER profiles_guard_sensitive_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_guard_sensitive_columns();

-- Public creator card fields only (no email)
CREATE OR REPLACE VIEW profiles_public AS
  SELECT id, display_name, avatar_url
  FROM profiles;

GRANT SELECT ON profiles_public TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- subscriptions: client read-only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users own subscriptions" ON subscriptions;

CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- generated_sounds: split FOR ALL + WITH CHECK
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users own sounds" ON generated_sounds;

CREATE POLICY "generated_sounds_select_own"
  ON generated_sounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "generated_sounds_insert_own"
  ON generated_sounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_sounds_update_own"
  ON generated_sounds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_sounds_delete_own"
  ON generated_sounds FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- community_sounds: add WITH CHECK on write policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "community_sounds_insert_own" ON community_sounds;
DROP POLICY IF EXISTS "community_sounds_update_own" ON community_sounds;

CREATE POLICY "community_sounds_insert_own"
  ON community_sounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_sounds_update_own"
  ON community_sounds FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sound_likes / sound_saves: WITH CHECK on insert
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "sound_likes_insert_own" ON sound_likes;
DROP POLICY IF EXISTS "sound_saves_insert_own" ON sound_saves;

CREATE POLICY "sound_likes_insert_own"
  ON sound_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sound_saves_insert_own"
  ON sound_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sound_reports: one report per user per sound; distinct reporters to auto-hide
-- ---------------------------------------------------------------------------
DELETE FROM sound_reports a
USING sound_reports b
WHERE a.ctid < b.ctid
  AND a.sound_id = b.sound_id
  AND a.user_id = b.user_id;

ALTER TABLE sound_reports
  DROP CONSTRAINT IF EXISTS sound_reports_sound_user_unique;

ALTER TABLE sound_reports
  ADD CONSTRAINT sound_reports_sound_user_unique UNIQUE (sound_id, user_id);

DROP POLICY IF EXISTS "sound_reports_insert_own" ON sound_reports;

CREATE POLICY "sound_reports_insert_own"
  ON sound_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_sound_report()
RETURNS TRIGGER AS $$
DECLARE
  distinct_pending_reporters integer;
BEGIN
  UPDATE community_sounds
  SET report_count = report_count + 1
  WHERE id = NEW.sound_id;

  SELECT COUNT(DISTINCT user_id) INTO distinct_pending_reporters
  FROM sound_reports
  WHERE sound_id = NEW.sound_id AND status = 'pending';

  IF distinct_pending_reporters >= 3 THEN
    UPDATE community_sounds
    SET is_hidden = true
    WHERE id = NEW.sound_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- saved_mixes: ensure WITH CHECK on update
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "saved_mixes_update_own" ON saved_mixes;

CREATE POLICY "saved_mixes_update_own"
  ON saved_mixes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- feedback: explicit WITH CHECK
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "feedback_insert_own" ON feedback;

CREATE POLICY "feedback_insert_own"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);
