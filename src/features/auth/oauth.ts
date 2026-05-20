import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { supabase } from "@/src/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

/** Add to Supabase Auth URL Configuration Redirect URLs. */
export const GOOGLE_OAUTH_REDIRECT_TO = "soundpulse://auth/sign-in";

function firstQueryParam(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

export function isOAuthCallbackUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  if (!lower.startsWith("soundpulse://")) {
    return false;
  }
  return (
    lower.includes("access_token=") ||
    lower.includes("refresh_token=") ||
    lower.includes("code=") ||
    (lower.includes("auth/sign-in") && lower.includes("error="))
  );
}

export async function createSessionFromOAuthUrl(url: string): Promise<{ error: Error | null }> {
  try {
    if (url.includes("code=")) {
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      return { error: error ?? null };
    }

    const parsed = Linking.parse(url);
    const accessToken = firstQueryParam(parsed.queryParams?.access_token);
    const refreshToken = firstQueryParam(parsed.queryParams?.refresh_token);
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { error: error ?? null };
    }

    return { error: new Error("No auth tokens in callback URL") };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function signInWithGoogle(): Promise<{ error: Error | null; cancelled?: boolean }> {
  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: GOOGLE_OAUTH_REDIRECT_TO,
      },
    });
    return { error: error ?? null };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: GOOGLE_OAUTH_REDIRECT_TO,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error };
  }
  if (!data?.url) {
    return { error: new Error("OAuth URL missing") };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, GOOGLE_OAUTH_REDIRECT_TO);
  if (result.type === "cancel" || result.type === "dismiss") {
    return { error: null, cancelled: true };
  }
  if (result.type !== "success") {
    return { error: new Error("Google sign-in was not completed") };
  }

  return createSessionFromOAuthUrl(result.url);
}
