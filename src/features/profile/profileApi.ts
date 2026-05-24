import { supabase } from "@/src/lib/supabase";

const DISPLAY_NAME_MIN = 2;
const DISPLAY_NAME_MAX = 32;

export function normalizeDisplayName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(value: string): string | null {
  const normalized = normalizeDisplayName(value);
  if (normalized.length < DISPLAY_NAME_MIN) {
    return `Name must be at least ${DISPLAY_NAME_MIN} characters.`;
  }
  if (normalized.length > DISPLAY_NAME_MAX) {
    return `Name must be ${DISPLAY_NAME_MAX} characters or fewer.`;
  }
  return null;
}

export async function isDisplayNameTaken(name: string, userId: string): Promise<boolean> {
  const normalized = normalizeDisplayName(name);
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .ilike("display_name", normalized)
    .neq("id", userId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).length > 0;
}

export async function updateProfileDisplayName(userId: string, name: string): Promise<void> {
  const normalized = normalizeDisplayName(name);
  const validationError = validateDisplayName(normalized);
  if (validationError) {
    throw new Error(validationError);
  }

  if (await isDisplayNameTaken(normalized, userId)) {
    throw new Error("That display name is already taken.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: normalized })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That display name is already taken.");
    }
    throw new Error(error.message);
  }
}

function guessContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/jpeg";
}

export async function uploadProfileAvatar(userId: string, localUri: string): Promise<string> {
  const extension = guessContentType(localUri) === "image/png" ? "png" : "jpg";
  const filePath = `${userId}/avatar.${extension}`;
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, {
    upsert: true,
    contentType: guessContentType(localUri),
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return avatarUrl;
}
