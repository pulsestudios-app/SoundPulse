import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { createNativeSupabaseAuthStorage, SUPABASE_AUTH_STORAGE_KEY } from "./supabaseAuthStorage";

const storage = Platform.OS === "web" ? undefined : createNativeSupabaseAuthStorage();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in environment."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage,
  },
});
