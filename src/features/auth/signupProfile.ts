import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/src/lib/supabase";

const SEEDED_KEY_PREFIX = "signup_profile_seeded_v1_";

/**
 * Lightweight first-login seed — no referrals or library coupling.
 */
export async function seedNewUserProfile(userId: string): Promise<void> {
  const key = `${SEEDED_KEY_PREFIX}${userId}`;
  const done = await AsyncStorage.getItem(key);
  if (done === "true") {
    return;
  }

  try {
    const { error } = await supabase.from("profiles").upsert(
      { id: userId },
      {
        onConflict: "id",
        ignoreDuplicates: true,
      }
    );

    if (error) {
      console.warn("[signupProfile] Profile upsert skipped:", error.message);
    }

    await AsyncStorage.setItem(key, "true");
  } catch (e) {
    console.error("[signupProfile] seed failed:", e);
    throw e;
  }
}
