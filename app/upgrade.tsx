import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/core/Button";
import { Screen } from "@/src/components/core/Screen";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/src/features/subscription/plans";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { trackEvent } from "@/src/lib/analytics";
import { useAppTheme } from "@/src/theme";

export default function UpgradeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(24);
  const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlanId | null>(null);

  const onSubscribe = useCallback((planId: SubscriptionPlanId, planName: string) => {
    setSubscribingPlan(planId);
    void trackEvent("upgrade_button_tapped", { plan: planId });
    Alert.alert(
      "Coming soon",
      `${planName} subscriptions will be available in the next app update.`,
      [{ text: "OK", onPress: () => setSubscribingPlan(null) }]
    );
  }, []);

  useEffect(() => {
    void trackEvent("upgrade_screen_viewed");
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 1,
          gap: theme.spacing.lg,
        },
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          backgroundColor: `${theme.colors.primary}14`,
        },
        header: {
          flex: 1,
          gap: 6,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
          fontSize: 28,
        },
        subtitle: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        plans: {
          gap: theme.spacing.md,
        },
        planOuter: {
          borderRadius: theme.radius.lg,
          overflow: "hidden",
        },
        planGradient: {
          padding: 2,
          borderRadius: theme.radius.lg,
        },
        planCard: {
          borderRadius: theme.radius.lg - 2,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}33`,
        },
        planCardGlow: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 10,
        },
        planHead: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: theme.spacing.sm,
        },
        planName: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 22,
        },
        planPrice: {
          ...theme.typography.title,
          color: theme.colors.sky,
          fontSize: 20,
        },
        badge: {
          borderRadius: theme.radius.full,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          alignSelf: "flex-start",
        },
        badgePopular: {
          backgroundColor: `${theme.colors.primary}28`,
          borderColor: theme.colors.primary,
        },
        badgeValue: {
          backgroundColor: `${theme.colors.sky}22`,
          borderColor: theme.colors.sky,
        },
        badgeText: {
          ...theme.typography.caption,
          fontWeight: "900",
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
        featureList: {
          gap: 10,
        },
        featureRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
        },
        featureText: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          flex: 1,
          lineHeight: 21,
          fontSize: 15,
        },
        maybeLater: {
          minHeight: 48,
          borderRadius: theme.radius.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.border}88`,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginTop: theme.spacing.sm,
        },
        maybeLaterText: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          fontWeight: "700",
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
          </Pressable>
          <View style={styles.header}>
            <Text style={styles.title}>Upgrade</Text>
            <Text style={styles.subtitle}>
              Unlock AI generation, community sharing, pulses, and more with SoundPulse Premium.
            </Text>
          </View>
        </View>

        <View style={styles.plans}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const card = (
              <View style={[styles.planCard, plan.glow && styles.planCardGlow]}>
                {plan.badge ? (
                  <View
                    style={[
                      styles.badge,
                      plan.badge === "Most Popular" ? styles.badgePopular : styles.badgeValue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: plan.badge === "Most Popular" ? theme.colors.primary : theme.colors.sky,
                        },
                      ]}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.planHead}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <Button
                  label={subscribingPlan === plan.id ? "Processing…" : `Subscribe · ${plan.name}`}
                  premiumGlow={plan.glow}
                  disabled={subscribingPlan !== null}
                  onPress={() => onSubscribe(plan.id, plan.name)}
                  style={{ alignSelf: "stretch" }}
                />
              </View>
            );

            if (plan.glow) {
              return (
                <View key={plan.id} style={styles.planOuter}>
                  <LinearGradient
                    colors={[`${theme.colors.primary}88`, `${theme.colors.sky}66`, `${theme.colors.primary}44`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planGradient}
                  >
                    {card}
                  </LinearGradient>
                </View>
              );
            }

            return (
              <View key={plan.id} style={styles.planOuter}>
                {card}
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
          onPress={() => router.back()}
          style={styles.maybeLater}
        >
          <Text style={styles.maybeLaterText}>Maybe Later</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
