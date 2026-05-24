-- Profile avatars
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_lower_unique
  ON profiles (lower(trim(display_name)))
  WHERE display_name IS NOT NULL AND trim(display_name) <> '';

CREATE POLICY "Profiles public read for community"
  ON profiles FOR SELECT
  USING (true);

-- Saved layer mixes
CREATE TABLE IF NOT EXISTS saved_mixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  layers jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_mixes_user_created
  ON saved_mixes (user_id, created_at DESC);

ALTER TABLE saved_mixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_mixes_select_own"
  ON saved_mixes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "saved_mixes_insert_own"
  ON saved_mixes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_mixes_update_own"
  ON saved_mixes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "saved_mixes_delete_own"
  ON saved_mixes FOR DELETE
  USING (auth.uid() = user_id);

-- Community mix posts
ALTER TABLE community_sounds
  ALTER COLUMN audio_url DROP NOT NULL;

ALTER TABLE community_sounds
  ADD COLUMN IF NOT EXISTS kind text DEFAULT 'audio',
  ADD COLUMN IF NOT EXISTS mix_layers jsonb,
  ADD COLUMN IF NOT EXISTS saved_mix_id uuid REFERENCES saved_mixes ON DELETE SET NULL;

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
