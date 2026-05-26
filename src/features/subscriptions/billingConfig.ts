export const BILLING_PRODUCT_IDS = {
  basic: "basic_monthly",
  pro: "pro_monthly",
  unlimited: "unlimited_monthly",
} as const;

export type BillingPlanId = keyof typeof BILLING_PRODUCT_IDS;

export const BILLING_PRODUCT_ID_LIST = Object.values(BILLING_PRODUCT_IDS);

export const PRODUCT_TO_PLAN: Record<string, BillingPlanId> = {
  basic_monthly: "basic",
  pro_monthly: "pro",
  unlimited_monthly: "unlimited",
};

export function planForProductId(productId: string): BillingPlanId | null {
  return PRODUCT_TO_PLAN[productId] ?? null;
}

export function productIdForPlan(plan: BillingPlanId): string {
  return BILLING_PRODUCT_IDS[plan];
}
