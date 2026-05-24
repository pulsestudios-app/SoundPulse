CREATE TABLE IF NOT EXISTS community_sounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text,
  prompt text,
  audio_url text NOT NULL,
  duration integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  report_count integer DEFAULT 0,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sound_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sound_id uuid REFERENCES community_sounds NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sound_id, user_id)
);

CREATE TABLE IF NOT EXISTS sound_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sound_id uuid REFERENCES community_sounds NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sound_id, user_id)
);

CREATE TABLE IF NOT EXISTS sound_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sound_id uuid REFERENCES community_sounds NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_community_sounds_feed
  ON community_sounds (created_at DESC)
  WHERE is_public = true AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_community_sounds_tags
  ON community_sounds USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_sound_likes_sound_created
  ON sound_likes (sound_id, created_at DESC);

ALTER TABLE community_sounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_reports ENABLE ROW LEVEL SECURITY;

-- community_sounds: owners manage their rows; everyone reads public visible sounds
CREATE POLICY "community_sounds_select_public"
  ON community_sounds FOR SELECT
  USING (is_public = true AND is_hidden = false);

CREATE POLICY "community_sounds_select_own"
  ON community_sounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "community_sounds_insert_own"
  ON community_sounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_sounds_update_own"
  ON community_sounds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "community_sounds_delete_own"
  ON community_sounds FOR DELETE
  USING (auth.uid() = user_id);

-- sound_likes (pulses): readable for counts; users manage their own pulses
CREATE POLICY "sound_likes_select_all"
  ON sound_likes FOR SELECT
  USING (true);

CREATE POLICY "sound_likes_insert_own"
  ON sound_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sound_likes_delete_own"
  ON sound_likes FOR DELETE
  USING (auth.uid() = user_id);

-- sound_saves: users manage their own saves; read own saves
CREATE POLICY "sound_saves_select_own"
  ON sound_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sound_saves_insert_own"
  ON sound_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sound_saves_delete_own"
  ON sound_saves FOR DELETE
  USING (auth.uid() = user_id);

-- sound_reports: users file and read their own reports
CREATE POLICY "sound_reports_select_own"
  ON sound_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sound_reports_insert_own"
  ON sound_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-hide sounds with 3+ pending reports
CREATE OR REPLACE FUNCTION handle_sound_report()
RETURNS TRIGGER AS $$
DECLARE
  pending_count integer;
BEGIN
  UPDATE community_sounds
  SET report_count = report_count + 1
  WHERE id = NEW.sound_id;

  SELECT COUNT(*) INTO pending_count
  FROM sound_reports
  WHERE sound_id = NEW.sound_id AND status = 'pending';

  IF pending_count >= 3 THEN
    UPDATE community_sounds
    SET is_hidden = true
    WHERE id = NEW.sound_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sound_reports_auto_hide ON sound_reports;
CREATE TRIGGER sound_reports_auto_hide
  AFTER INSERT ON sound_reports
  FOR EACH ROW
  EXECUTE FUNCTION handle_sound_report();
