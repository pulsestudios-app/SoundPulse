-- Route community writes through Railway backend (service_role). Client reads stay direct.

DROP POLICY IF EXISTS "sound_likes_insert_own" ON sound_likes;
DROP POLICY IF EXISTS "sound_likes_delete_own" ON sound_likes;
DROP POLICY IF EXISTS "sound_saves_insert_own" ON sound_saves;
DROP POLICY IF EXISTS "sound_saves_delete_own" ON sound_saves;
DROP POLICY IF EXISTS "sound_reports_insert_own" ON sound_reports;
DROP POLICY IF EXISTS "community_sounds_insert_own" ON community_sounds;
