import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/core/Button";
import { ResultsToast } from "@/src/components/core/ResultsToast";
import { Screen } from "@/src/components/core/Screen";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/src/features/subscription/plans";
import {
  billingErrorMessage,
  getAvailableProducts,
  getCurrentSubscription,
  isActiveSubscription,
  purchaseSubscription,
  restorePurchases,
  subscribeToPurchaseUpdates,
  type BillingProduct,
  type BillingSubscriptionRow,
} from "@/src/features/subscriptions/billingService";
import { planForProductId } from "@/src/features/subscriptions/billingConfig";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { trackEvent } from "@/src/lib/analytics";
import { useAppTheme } from "@/src/theme";

function priceLabel(product: BillingProduct | undefined): string {
  return (
    product?.subscriptionOffers?.find((offer) => offer.displayPrice)?.displayPrice ||
    product?.displayPrice ||
    "Loading price..."
  );
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function currentPlanId(subscription: BillingSubscriptionRow | null): SubscriptionPlanId | null {
  if (!isActiveSubscription(subscription)) {
    return null;
  }
  const plan = subscription?.plan?.trim().toLowerCase();
  return plan === "basic" || plan === "pro" || plan === "unlimited" ? plan : null;
}

function manageSubscriptions(): void {
  Linking.openURL("https://play.google.com/store/account/subscriptions").catch(() => {
    Alert.alert("Manage subscription", "Open Google Play Store > Payments & subscriptions > Subscriptions.");
  });
}

export default function UpgradeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(24);
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<BillingSubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingPlan, setPurchasingPlan] = useState<SubscriptionPlanId | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 1,
          gap: theme.spacing.lg,
          paddingBottom: scrollBottomPad,
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
        stateBox: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}44`,
          backgroundColor: `${theme.colors.surface}dd`,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        stateText: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 21,
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.coral,
          lineHeight: 20,
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
        planCardActive: {
          borderColor: theme.colors.sky,
          backgroundColor: `${theme.colors.sky}12`,
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
          textAlign: "right",
        },
        badge: {
          borderRadius: theme.radius.full,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          alignSelf: "flex-start",
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
        buttonRow: {
          flexDirection: "row",
          gap: theme.spacing.sm,
        },
        secondaryAction: {
          minHeight: 48,
          borderRadius: theme.radius.lg,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.border}88`,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginTop: theme.spacing.sm,
        },
        secondaryText: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          fontWeight: "700",
        },
      }),
    [scrollBottomPad, theme]
  );

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setToastVisible(true);
      toastOpacity.stopAnimation();
      toastOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setToastVisible(false);
        }
      });
    },
    [toastOpacity]
  );

  const productByPlan = useMemo(() => {
    const map = new Map<SubscriptionPlanId, BillingProduct>();
    for (const product of products) {
      const plan = planForProductId(product.id);
      if (plan) {
        map.set(plan, product);
      }
    }
    return map;
  }, [products]);

  const activePlan = currentPlanId(currentSubscription);

  const loadBilling = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (Platform.OS !== "android") {
        setLoading(false);
        setErrorMessage("Google Play Billing is available in the Android app build.");
        return;
      }

      if (!quiet) {
        setLoading(true);
      }
      setErrorMessage(null);
      try {
        const [nextProducts, nextSubscription] = await Promise.all([
          getAvailableProducts(),
          getCurrentSubscription(),
        ]);
        setProducts(nextProducts);
        setCurrentSubscription(nextSubscription);
      } catch (error) {
        setErrorMessage(billingErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void trackEvent("upgrade_screen_viewed");
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }
    return subscribeToPurchaseUpdates({
      onPending: () => {
        setInfoMessage("Purchase is pending. Google Play will finish it when payment completes.");
        setPurchasingPlan(null);
      },
      onSuccess: (result) => {
        setCurrentSubscription({
          plan: result.plan,
          status: result.status,
          expires_at: result.expiresAt,
          product_id: result.productId,
        });
        setPurchasingPlan(null);
        setInfoMessage(null);
        showToast("Subscription active");
        router.back();
      },
      onError: (error) => {
        setPurchasingPlan(null);
        setErrorMessage(billingErrorMessage(error));
      },
    });
  }, [router, showToast]);

  const onSubscribe = useCallback(
    async (planId: SubscriptionPlanId) => {
      if (activePlan) {
        setErrorMessage(`You are already subscribed to ${titleCase(activePlan)}.`);
        return;
      }

      const product = productByPlan.get(planId);
      if (!product) {
        setErrorMessage("Google Play price is still loading. Try again in a moment.");
        return;
      }

      setErrorMessage(null);
      setInfoMessage(null);
      setPurchasingPlan(planId);
      void trackEvent("upgrade_button_tapped", { plan: planId });

      try {
        await purchaseSubscription(product.id);
        setInfoMessage("Complete your purchase in Google Play.");
      } catch (error) {
        setPurchasingPlan(null);
        setErrorMessage(billingErrorMessage(error));
      }
    },
    [activePlan, productByPlan]
  );

  const onRestore = useCallback(async () => {
    setRestoring(true);
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      const results = await restorePurchases();
      if (results.length === 0) {
        setInfoMessage("No active Google Play subscription was found for this account.");
      } else {
        const result = results[0];
        setCurrentSubscription({
          plan: result.plan,
          status: result.status,
          expires_at: result.expiresAt,
          product_id: result.productId,
        });
        showToast("Subscription restored");
      }
    } catch (error) {
      setErrorMessage(billingErrorMessage(error));
    } finally {
      setRestoring(false);
    }
  }, [showToast]);

  const onRetry = useCallback(() => {
    setRefreshing(true);
    loadBilling({ quiet: true }).finally(() => setRefreshing(false));
  }, [loadBilling]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
              Unlock AI generation, community sharing, pulses, and richer layer mixing.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.stateText}>Loading Google Play subscriptions...</Text>
          </View>
        ) : null}

        {activePlan ? (
          <View style={styles.stateBox}>
            <Text style={[styles.stateText, { color: theme.colors.textPrimary, fontWeight: "800" }]}>
              Current plan: {titleCase(activePlan)}
            </Text>
            <Text style={styles.stateText}>
              Manage plan changes and cancellations through Google Play.
            </Text>
            <Button label="Manage Subscription" variant="secondary" onPress={manageSubscriptions} />
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.error}>{errorMessage}</Text>
            <Button
              label={refreshing ? "Retrying..." : "Retry"}
              variant="secondary"
              disabled={refreshing}
              onPress={onRetry}
            />
          </View>
        ) : null}

        {infoMessage ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>{infoMessage}</Text>
          </View>
        ) : null}

        <View style={styles.plans}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const product = productByPlan.get(plan.id);
            const isCurrent = activePlan === plan.id;
            const disabled = loading || Boolean(activePlan) || !product || purchasingPlan !== null || restoring;
            const card = (
              <View
                style={[
                  styles.planCard,
                  plan.glow && styles.planCardGlow,
                  isCurrent && styles.planCardActive,
                ]}
              >
                {plan.badge || isCurrent ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: `${isCurrent ? theme.colors.sky : theme.colors.primary}22`,
                        borderColor: isCurrent ? theme.colors.sky : theme.colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isCurrent ? theme.colors.sky : theme.colors.primary },
                      ]}
                    >
                      {isCurrent ? "Current Plan" : plan.badge}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.planHead}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{priceLabel(product)}</Text>
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
                  label={
                    purchasingPlan === plan.id
                      ? "Opening Google Play..."
                      : isCurrent
                        ? "Current Plan"
                        : `Subscribe - ${plan.name}`
                  }
                  premiumGlow={plan.glow && !disabled}
                  disabled={disabled}
                  onPress={() => void onSubscribe(plan.id)}
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

        <View style={styles.buttonRow}>
          <Button
            label={restoring ? "Restoring..." : "Restore Purchase"}
            variant="secondary"
            disabled={restoring || purchasingPlan !== null}
            onPress={() => void onRestore()}
            style={{ flex: 1 }}
          />
          <Button
            label="Manage"
            variant="secondary"
            onPress={manageSubscriptions}
            style={{ flex: 1 }}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
          onPress={() => router.back()}
          style={styles.secondaryAction}
        >
          <Text style={styles.secondaryText}>Maybe Later</Text>
        </Pressable>
      </ScrollView>
      <ResultsToast visible={toastVisible} message={toastMessage} opacityAnim={toastOpacity} theme={theme} />
    </Screen>
  );
}
