import { google } from "googleapis";
import type { androidpublisher_v3 } from "googleapis";

import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import type { PlanTier } from "./planTier.js";
import {
  isKnownPlayProductId,
  isPlayLifetimeProduct,
  isPlaySubscriptionProduct,
  playProductIdToTier,
} from "./playProducts.js";

export class PlayBillingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlayBillingConfigError";
  }
}

export class PlayPurchaseVerificationError extends Error {
  readonly refunded: boolean;

  constructor(message: string, refunded = false) {
    super(message);
    this.name = "PlayPurchaseVerificationError";
    this.refunded = refunded;
  }
}

function getPackageName(): string {
  return process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "com.soundpulseapp.android";
}

function getAndroidPublisher(): androidpublisher_v3.Androidpublisher {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new PlayBillingConfigError(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured on the server."
    );
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new PlayBillingConfigError("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  return google.androidpublisher({ version: "v3", auth });
}

const ACTIVE_SUBSCRIPTION_STATES = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
]);

async function verifySubscriptionPurchase(
  publisher: androidpublisher_v3.Androidpublisher,
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<void> {
  try {
    const { data } = await publisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
    });

    const state = data.subscriptionState ?? "";
    if (!ACTIVE_SUBSCRIPTION_STATES.has(state)) {
      throw new PlayPurchaseVerificationError(
        `Subscription is not active (state: ${state || "unknown"}).`
      );
    }

    const lineItems = data.lineItems ?? [];
    const matchingLine = lineItems.find((item) => item.productId === productId);
    if (lineItems.length > 0 && !matchingLine) {
      throw new PlayPurchaseVerificationError(
        `Purchase token does not match product ${productId}.`
      );
    }

    const testPurchase = (data as { testPurchase?: unknown }).testPurchase;
    if (
      testPurchase &&
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_PLAY_TEST_PURCHASES !== "true"
    ) {
      throw new PlayPurchaseVerificationError("Test purchases are not allowed in production.");
    }

    return;
  } catch (err) {
    if (err instanceof PlayPurchaseVerificationError) {
      throw err;
    }

    const status =
      err && typeof err === "object" && "code" in err ? Number((err as { code: unknown }).code) : 0;
    if (status !== 404) {
      throw err;
    }
  }

  const { data: legacy } = await publisher.purchases.subscriptions.get({
    packageName,
    subscriptionId: productId,
    token: purchaseToken,
  });

  const paymentState = legacy.paymentState ?? -1;
  if (paymentState !== 1 && paymentState !== 2) {
    throw new PlayPurchaseVerificationError(
      `Subscription payment not received (paymentState=${String(paymentState)}).`
    );
  }

  if (legacy.cancelReason != null && legacy.cancelReason !== 0) {
    throw new PlayPurchaseVerificationError("Subscription is canceled.");
  }
}

async function verifyOneTimeProductPurchase(
  publisher: androidpublisher_v3.Androidpublisher,
  packageName: string,
  productId: string,
  purchaseToken: string
): Promise<void> {
  const { data } = await publisher.purchases.products.get({
    packageName,
    productId,
    token: purchaseToken,
  });

  if (data.purchaseState !== 0) {
    throw new PlayPurchaseVerificationError(
      `Product purchase is not completed (purchaseState=${String(data.purchaseState)}).`
    );
  }

  if (data.productId && data.productId !== productId) {
    throw new PlayPurchaseVerificationError("Product ID mismatch.");
  }
}

function subscriptionExpiresAt(tier: PlanTier): string {
  if (tier === "lifetime") {
    return "2099-01-01T00:00:00.000Z";
  }
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 32);
  return expires.toISOString();
}

export async function applyVerifiedTierToProfile(userId: string, tier: PlanTier): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      plan: tier,
      subscription_tier: tier,
      subscription_active: true,
      subscription_status: "active",
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    plan: tier,
    status: "active",
    expires_at: subscriptionExpiresAt(tier),
  });

  if (subscriptionError) {
    throw new Error(`Failed to record subscription: ${subscriptionError.message}`);
  }

  if (tier === "lifetime") {
    const { error: lifetimeErr } = await supabaseAdmin.from("lifetime_purchases").insert({
      user_id: userId,
    });
    if (lifetimeErr) {
      console.warn("[playBilling] lifetime_purchases insert:", lifetimeErr.message);
    }
  }
}

/**
 * Revoke or refund a purchase that failed server verification.
 * Subscriptions are revoked; one-time products are refunded when orderId is available.
 */
export async function rejectUnverifiedPlayPurchase(
  productId: string,
  purchaseToken: string
): Promise<boolean> {
  let publisher: androidpublisher_v3.Androidpublisher;
  try {
    publisher = getAndroidPublisher();
  } catch (e) {
    console.error("[playBilling] reject skipped — config:", e);
    return false;
  }

  const packageName = getPackageName();

  try {
    if (isPlayLifetimeProduct(productId)) {
      const { data } = await publisher.purchases.products.get({
        packageName,
        productId,
        token: purchaseToken,
      });
      const orderId = data.orderId;
      if (orderId) {
        await publisher.orders.refund({
          packageName,
          orderId,
          revoke: true,
        });
        console.log("[playBilling] Refunded one-time order", orderId);
        return true;
      }
      console.warn("[playBilling] No orderId for one-time purchase; client must not acknowledge.");
      return false;
    }

    if (isPlaySubscriptionProduct(productId)) {
      await publisher.purchases.subscriptions.revoke({
        packageName,
        subscriptionId: productId,
        token: purchaseToken,
      });
      console.log("[playBilling] Revoked subscription", productId);
      return true;
    }
  } catch (e) {
    console.error("[playBilling] reject/refund failed:", e);
    return false;
  }

  return false;
}

/**
 * Verify purchase with Google Play Developer API, then grant entitlements in Supabase.
 */
export async function verifyAndGrantPlayPurchase(
  userId: string,
  productId: string,
  purchaseToken: string
): Promise<PlanTier> {
  if (!isKnownPlayProductId(productId)) {
    throw new PlayPurchaseVerificationError(`Unknown product ID: ${productId}`);
  }

  const tier = playProductIdToTier(productId);
  if (!tier) {
    throw new PlayPurchaseVerificationError(`No plan tier mapped for ${productId}`);
  }

  const token = purchaseToken.trim();
  if (!token) {
    throw new PlayPurchaseVerificationError("Missing purchase token.");
  }

  const publisher = getAndroidPublisher();
  const packageName = getPackageName();

  try {
    if (isPlayLifetimeProduct(productId)) {
      await verifyOneTimeProductPurchase(publisher, packageName, productId, token);
    } else if (isPlaySubscriptionProduct(productId)) {
      await verifySubscriptionPurchase(publisher, packageName, productId, token);
    } else {
      throw new PlayPurchaseVerificationError(`Unsupported product type: ${productId}`);
    }

    await applyVerifiedTierToProfile(userId, tier);
    return tier;
  } catch (err) {
    const refunded = await rejectUnverifiedPlayPurchase(productId, token);
    if (err instanceof PlayPurchaseVerificationError) {
      throw new PlayPurchaseVerificationError(err.message, refunded);
    }
    throw new PlayPurchaseVerificationError(
      err instanceof Error ? err.message : "Purchase verification failed.",
      refunded
    );
  }
}
