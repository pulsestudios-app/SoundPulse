import "react-native-reanimated";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import * as Linking from "expo-linking";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { seedNewUserProfile } from "@/src/features/auth/signupProfile";
import { needsEmailVerification } from "@/src/features/auth/emailVerification";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import { ThemePreferenceProvider, useThemePreference } from "@/src/theme";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (typeof sentryDsn === "string" && sentryDsn.length > 0) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: !__DEV__,
    sendDefaultPii: true,
  });
}

function useProtectedNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading } = useAuthSession();
  const { theme, mode } = useThemePreference();

  const navigationTheme = useMemo(() => {
    const base = mode === "light" ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        border: theme.colors.border,
        primary: theme.colors.primary,
        text: theme.colors.textPrimary,
      },
    };
  }, [mode, theme]);

  const shouldRedirectEmptyDeepLink = useCallback((url?: string | null) => {
    if (!url) {
      return false;
    }
    if (url === "soundpulse://" || url === "soundpulse:///") {
      return true;
    }
    try {
      const parsed = Linking.parse(url);
      const path = typeof parsed.path === "string" ? parsed.path.trim() : "";
      return (parsed.scheme ?? "").toLowerCase() === "soundpulse" && path.length === 0;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const handleURL = ({ url }: { url: string }) => {
      if (shouldRedirectEmptyDeepLink(url)) {
        router.replace("/home");
      }
    };
    const sub = Linking.addEventListener("url", handleURL);
    return () => sub.remove();
  }, [router, shouldRedirectEmptyDeepLink]);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (shouldRedirectEmptyDeepLink(url)) {
        router.replace("/home");
      }
    });
  }, [router, shouldRedirectEmptyDeepLink]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const segList = segments as unknown as string[];

    if (session) {
      if (needsEmailVerification(session.user)) {
        const authChild = segList.length > 1 ? segList[1] : "";
        const onVerifyEmail = segments[0] === "(auth)" && authChild === "verify-email";
        if (!onVerifyEmail) {
          const em = session.user.email?.trim() ?? "";
          const qs = em ? `?email=${encodeURIComponent(em)}` : "";
          router.replace(`/(auth)/verify-email${qs}` as never);
        }
        return;
      }

      void seedNewUserProfile(session.user.id).catch(console.error);

      if (inAuthGroup) {
        router.replace("/home");
      }
      return;
    }

    if (!inAuthGroup) {
      router.replace("/sign-in");
    }
  }, [isLoading, router, segments, session]);

  return { navigationTheme };
}

function RootLayoutInner() {
  const { navigationTheme } = useProtectedNavigation();

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <RootLayoutInner />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
