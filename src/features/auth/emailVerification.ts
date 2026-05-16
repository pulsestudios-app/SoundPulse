import type { User } from "@supabase/supabase-js";

/**
 * Email/password accounts must confirm via Supabase before using the app.
 * OAuth providers (e.g. Google) typically set `email_confirmed_at` immediately.
 */
export function needsEmailVerification(user: User | null | undefined): boolean {
  if (!user?.email) {
    return false;
  }
  return user.email_confirmed_at == null;
}
