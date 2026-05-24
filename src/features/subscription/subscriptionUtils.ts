export type SubscriptionRow = {
  plan: string | null;
  status: string | null;
  expires_at: string | null;
};

export function isPremiumSubscription(row: SubscriptionRow | null | undefined): boolean {
  if (!row) {
    return false;
  }
  const plan = row.plan?.toLowerCase() ?? "";
  const status = row.status?.toLowerCase() ?? "";
  const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
  const stillActive = !expiresAt || expiresAt.getTime() > Date.now();
  const paidStatus = status === "active" || status === "trialing";
  return paidStatus && stillActive && plan !== "free" && plan !== "";
}
