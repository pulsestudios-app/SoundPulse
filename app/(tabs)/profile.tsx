import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/core/Button";
import { Card } from "@/src/components/core/Card";
import { Screen } from "@/src/components/core/Screen";
import { signOut } from "@/src/features/auth/api";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import { FREE_AI_GENERATIONS_PER_MONTH } from "@/src/features/generate/entitlementsStore";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme";

type ProfileRow = {
  display_name: string | null;
  email: string | null;
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  expires_at: string | null;
};

type ProfileData = {
  displayName: string;
  email: string;
  subscription: SubscriptionRow | null;
  generatedThisMonth: number;
};

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return {
    startIso: start.toISOString(),
    nextIso: next.toISOString(),
  };
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function subscriptionLabel(row: SubscriptionRow | null): "Free" | "Premium" {
  if (!row) {
    return "Free";
  }
  const status = row.status?.toLowerCase() ?? "";
  const plan = row.plan?.toLowerCase() ?? "";
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const stillActive = !expiresAt || expiresAt.getTime() > Date.now();
  const paidStatus = status === "active" || status === "trialing";
  return paidStatus && stillActive && plan !== "free" ? "Premium" : "Free";
}

function subscriptionDetail(row: SubscriptionRow | null): string {
  if (!row) {
    return "Free plan";
  }
  const plan = row.plan?.trim() ? titleCase(row.plan) : "Free";
  const status = row.status?.trim() ? titleCase(row.status) : "Unknown";
  if (!row.expires_at) {
    return `${plan} · ${status}`;
  }
  const expiresAt = new Date(row.expires_at);
  if (Number.isNaN(expiresAt.getTime())) {
    return `${plan} · ${status}`;
  }
  const date = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(expiresAt);
  return `${plan} · ${status} · Renews ${date}`;
}

function fallbackDisplayName(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  return localPart ? titleCase(localPart) : "SoundPulse listener";
}

function subscriptionManagementUrl(): string {
  if (Platform.OS === "ios") {
    return "https://apps.apple.com/account/subscriptions";
  }
  return "https://play.google.com/store/account/subscriptions";
}

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(24);
  const { session } = useAuthSession();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          flexGrow: 1,
          gap: theme.spacing.lg,
          paddingBottom: scrollBottomPad,
        },
        header: {
          gap: theme.spacing.sm,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
        },
        intro: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        profileCard: {
          borderColor: `${theme.colors.primary}55`,
          gap: theme.spacing.md,
        },
        avatar: {
          width: 62,
          height: 62,
          borderRadius: 31,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.primary}26`,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}88`,
        },
        profileTop: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        identity: {
          flex: 1,
          minWidth: 0,
          gap: 4,
        },
        name: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 22,
        },
        email: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          fontSize: 14,
        },
        sectionLabel: {
          ...theme.typography.caption,
          color: `${theme.colors.sky}cc`,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: "800",
        },
        planRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing.md,
        },
        planLeft: {
          flex: 1,
          minWidth: 0,
          gap: 5,
        },
        cardTitle: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 19,
        },
        muted: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 21,
        },
        badge: {
          borderRadius: theme.radius.full,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderWidth: 1,
          alignSelf: "flex-start",
        },
        badgeText: {
          ...theme.typography.caption,
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: 0.7,
        },
        statsGrid: {
          flexDirection: "row",
          gap: theme.spacing.md,
        },
        statTile: {
          flex: 1,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}33`,
          backgroundColor: `${theme.colors.background}80`,
          padding: theme.spacing.md,
          gap: 8,
        },
        statIcon: {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.sky}1f`,
        },
        statValue: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 24,
        },
        statLabel: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          lineHeight: 18,
        },
        settingsCard: {
          gap: theme.spacing.md,
        },
        buttonStack: {
          gap: theme.spacing.sm,
        },
        errorText: {
          ...theme.typography.caption,
          color: theme.colors.coral,
          lineHeight: 20,
        },
        loadingState: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.xxl,
        },
      }),
    [scrollBottomPad, theme]
  );

  const loadProfile = useCallback(
    async ({ initial }: { initial: boolean }) => {
      const user = session?.user;
      if (!user) {
        setProfileData(null);
        setLoading(false);
        setErrorMessage(null);
        return;
      }

      if (initial) {
        setLoading(true);
      }
      setErrorMessage(null);

      const { startIso, nextIso } = currentMonthRange();

      const [profileResult, subscriptionResult, soundsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name,email")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>(),
        supabase
          .from("subscriptions")
          .select("plan,status,expires_at")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1),
        supabase
          .from("generated_sounds")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startIso)
          .lt("created_at", nextIso),
      ]);

      const errors = [profileResult.error, subscriptionResult.error, soundsResult.error].filter(Boolean);
      if (errors.length > 0) {
        setErrorMessage(errors[0]?.message ?? "Could not load profile.");
      }

      const profile = profileResult.data;
      const email = profile?.email?.trim() || user.email?.trim() || "Not signed in";
      const displayName = profile?.display_name?.trim() || fallbackDisplayName(email);
      const subscription = ((subscriptionResult.data ?? [])[0] as SubscriptionRow | undefined) ?? null;

      setProfileData({
        displayName,
        email,
        subscription,
        generatedThisMonth: soundsResult.count ?? 0,
      });

      if (initial) {
        setLoading(false);
      }
    },
    [session?.user]
  );

  useFocusEffect(
    useCallback(() => {
      void loadProfile({ initial: true });
    }, [loadProfile])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile({ initial: false }).finally(() => setRefreshing(false));
  }, [loadProfile]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    const { error } = await signOut();
    setSigningOut(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.replace("/(auth)/sign-in");
  }, [router]);

  const handleManageSubscription = useCallback(() => {
    const url = subscriptionManagementUrl();
    Linking.openURL(url).catch(() => {
      Alert.alert("Manage subscription", "Open your app store account subscriptions to manage SoundPulse.");
    });
  }, []);

  const planLabel = subscriptionLabel(profileData?.subscription ?? null);
  const isPremium = planLabel === "Premium";
  const usageLimitLabel = isPremium ? "Unlimited" : FREE_AI_GENERATIONS_PER_MONTH.toString();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary, theme.colors.sky]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.intro}>Account, subscription, and generation usage.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.muted}>Loading your profile...</Text>
          </View>
        ) : (
          <>
            <Card style={styles.profileCard}>
              <View style={styles.profileTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color={theme.colors.primary} />
                </View>
                <View style={styles.identity}>
                  <Text style={styles.name} numberOfLines={1}>
                    {profileData?.displayName ?? "SoundPulse listener"}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {profileData?.email ?? "Not signed in"}
                  </Text>
                </View>
              </View>
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </Card>

            <Card style={styles.profileCard}>
              <Text style={styles.sectionLabel}>Subscription</Text>
              <View style={styles.planRow}>
                <View style={styles.planLeft}>
                  <Text style={styles.cardTitle}>{planLabel}</Text>
                  <Text style={styles.muted}>{subscriptionDetail(profileData?.subscription ?? null)}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isPremium ? `${theme.colors.primary}26` : `${theme.colors.sky}1f`,
                      borderColor: isPremium ? theme.colors.primary : `${theme.colors.sky}66`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isPremium ? theme.colors.primary : theme.colors.sky },
                    ]}
                  >
                    {planLabel}
                  </Text>
                </View>
              </View>
            </Card>

            <View>
              <Text style={styles.sectionLabel}>Usage</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <View style={styles.statIcon}>
                  <Ionicons name="sparkles" size={18} color={theme.colors.sky} />
                </View>
                <Text style={styles.statValue}>{profileData?.generatedThisMonth ?? 0}</Text>
                <Text style={styles.statLabel}>Sounds generated this month</Text>
              </View>
              <View style={styles.statTile}>
                <View style={styles.statIcon}>
                  <Ionicons name="infinite" size={18} color={theme.colors.sky} />
                </View>
                <Text style={styles.statValue}>{usageLimitLabel}</Text>
                <Text style={styles.statLabel}>{isPremium ? "Premium generation access" : "Free monthly limit"}</Text>
              </View>
            </View>

            <Card style={styles.settingsCard}>
              <Text style={styles.sectionLabel}>Settings</Text>
              <View style={styles.buttonStack}>
                <Button label="Manage subscription" variant="secondary" onPress={handleManageSubscription} />
                <Button
                  label={signingOut ? "Signing out..." : "Sign out"}
                  variant="secondary"
                  disabled={signingOut}
                  onPress={() => void handleSignOut()}
                />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
