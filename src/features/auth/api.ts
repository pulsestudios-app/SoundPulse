import * as Linking from "expo-linking";

import { supabase } from "@/src/lib/supabase";

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/** Redirect URL for Supabase email confirmation (add to Auth URL Configuration in dashboard). */
export function getAuthEmailRedirectUrl(): string {
  return Linking.createURL("/(auth)/sign-in");
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthEmailRedirectUrl(),
    },
  });
}

export async function resendSignupConfirmationEmail(email: string) {
  return supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: getAuthEmailRedirectUrl(),
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut({ scope: "global" });
}

export async function sendPasswordResetEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim());
}
