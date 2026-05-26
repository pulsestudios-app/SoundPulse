-- User-owned content deletion support for Google Play compliance.

DROP POLICY IF EXISTS "generated_sounds_delete_own" ON public.generated_sounds;
CREATE POLICY "generated_sounds_delete_own"
  ON public.generated_sounds FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sound_saves_delete_own" ON public.sound_saves;
CREATE POLICY "sound_saves_delete_own"
  ON public.sound_saves FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_sounds_delete_own" ON public.community_sounds;
CREATE POLICY "community_sounds_delete_own"
  ON public.community_sounds FOR DELETE
  USING (auth.uid() = user_id);

ALTER TABLE public.sound_likes
  DROP CONSTRAINT IF EXISTS sound_likes_sound_id_fkey;
ALTER TABLE public.sound_likes
  ADD CONSTRAINT sound_likes_sound_id_fkey
  FOREIGN KEY (sound_id) REFERENCES public.community_sounds(id) ON DELETE CASCADE;

ALTER TABLE public.sound_saves
  DROP CONSTRAINT IF EXISTS sound_saves_sound_id_fkey;
ALTER TABLE public.sound_saves
  ADD CONSTRAINT sound_saves_sound_id_fkey
  FOREIGN KEY (sound_id) REFERENCES public.community_sounds(id) ON DELETE CASCADE;

ALTER TABLE public.sound_reports
  DROP CONSTRAINT IF EXISTS sound_reports_sound_id_fkey;
ALTER TABLE public.sound_reports
  ADD CONSTRAINT sound_reports_sound_id_fkey
  FOREIGN KEY (sound_id) REFERENCES public.community_sounds(id) ON DELETE CASCADE;
