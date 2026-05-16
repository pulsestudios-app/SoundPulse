import type { PlanTier } from "./planTier.js";

export const PLAY_LIFETIME_PRODUCT_ID = "soundpulse_lifetime";

export const PLAY_SUBSCRIPTION_PRODUCT_IDS = [
  "soundpulse_weekly_pass",
  "soundpulse_student_monthly",
  "soundpulse_pro_monthly",
  "soundpulse_unlimited_monthly",
  "soundpulse_semester_plan",
  "soundpulse_yearly_plan",
] as const;

export type PlayProductId =
  | (typeof PLAY_SUBSCRIPTION_PRODUCT_IDS)[number]
  | typeof PLAY_LIFETIME_PRODUCT_ID;

const PLAY_PRODUCT_ID_TO_TIER: Record<string, PlanTier> = {
  soundpulse_weekly_pass: "pro_weekly",
  soundpulse_student_monthly: "student",
  soundpulse_pro_monthly: "pro",
  soundpulse_unlimited_monthly: "unlimited",
  soundpulse_semester_plan: "semester",
  soundpulse_yearly_plan: "yearly",
  [PLAY_LIFETIME_PRODUCT_ID]: "lifetime",
};

const ALL_PLAY_PRODUCT_IDS = new Set<string>([
  ...PLAY_SUBSCRIPTION_PRODUCT_IDS,
  PLAY_LIFETIME_PRODUCT_ID,
]);

export function isKnownPlayProductId(productId: string): boolean {
  return ALL_PLAY_PRODUCT_IDS.has(productId);
}

export function playProductIdToTier(productId: string): PlanTier | null {
  return PLAY_PRODUCT_ID_TO_TIER[productId] ?? null;
}

export function isPlayLifetimeProduct(productId: string): boolean {
  return productId === PLAY_LIFETIME_PRODUCT_ID;
}

export function isPlaySubscriptionProduct(productId: string): boolean {
  return PLAY_SUBSCRIPTION_PRODUCT_IDS.includes(productId as (typeof PLAY_SUBSCRIPTION_PRODUCT_IDS)[number]);
}
