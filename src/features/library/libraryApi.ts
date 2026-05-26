import { supabase } from "@/src/lib/supabase";

type GeneratedSoundOwnerRow = {
  id: string;
  user_id: string;
  url: string | null;
};

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }
  if (!user?.id) {
    throw new Error("Sign in to manage your library.");
  }
  return user.id;
}

export async function deleteGeneratedSound(soundId: string): Promise<void> {
  const trimmedSoundId = soundId.trim();
  if (!trimmedSoundId) {
    throw new Error("Choose a sound to delete.");
  }

  const userId = await getCurrentUserId();
  const { data: sound, error: lookupError } = await supabase
    .from("generated_sounds")
    .select("id,user_id,url")
    .eq("id", trimmedSoundId)
    .eq("user_id", userId)
    .maybeSingle<GeneratedSoundOwnerRow>();

  if (lookupError) {
    throw new Error(lookupError.message);
  }
  if (!sound) {
    throw new Error("This sound was not found in your library.");
  }

  const audioUrl = sound.url?.trim();
  if (audioUrl) {
    const { error: communityError } = await supabase
      .from("community_sounds")
      .delete()
      .eq("user_id", userId)
      .eq("audio_url", audioUrl);

    if (communityError) {
      throw new Error(communityError.message);
    }
  }

  const { error } = await supabase
    .from("generated_sounds")
    .delete()
    .eq("id", sound.id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function unsaveCommunitySound(soundId: string): Promise<void> {
  const trimmedSoundId = soundId.trim();
  if (!trimmedSoundId) {
    throw new Error("Choose a sound to remove from saved.");
  }

  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("sound_saves")
    .delete()
    .eq("sound_id", trimmedSoundId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function unshareCommunitySound(soundId: string): Promise<void> {
  const trimmedSoundId = soundId.trim();
  if (!trimmedSoundId) {
    throw new Error("Choose a sound to remove from the community.");
  }

  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("community_sounds")
    .delete()
    .eq("id", trimmedSoundId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("This community sound is not available.");
  }
}
