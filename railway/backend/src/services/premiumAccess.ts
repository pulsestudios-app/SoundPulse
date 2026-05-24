import { supabaseAdmin } from "../lib/supabaseAdmin.js";

/** Mirrors Supabase `auth_user_has_premium()` for service-role writes. */
export async function userHasPremium(userId: string): Promise<boolean> {
  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(5);

  for (const row of subscriptions ?? []) {
    const plan = typeof row.plan === "string" ? row.plan.trim().toLowerCase() : "";
    const status = typeof row.status === "string" ? row.status.trim().toLowerCase() : "";
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
    const stillActive = !expiresAt || expiresAt.getTime() > Date.now();
    if (stillActive && (status === "active" || status === "trialing") && plan && plan !== "free") {
      return true;
    }
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan, subscription_active, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return false;
  }

  const plan = typeof profile.plan === "string" ? profile.plan.trim().toLowerCase() : "";
  const subStatus =
    typeof profile.subscription_status === "string" ? profile.subscription_status.trim().toLowerCase() : "";
  const subActive = profile.subscription_active === true;

  return (
    subActive &&
    (subStatus === "active" || subStatus === "trialing") &&
    Boolean(plan) &&
    plan !== "free"
  );
}

export async function userCanSubmitReport(userId: string, emailConfirmed: boolean): Promise<boolean> {
  if (!emailConfirmed) {
    return false;
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.created_at) {
    return false;
  }

  const createdAt = new Date(data.user.created_at).getTime();
  if (!Number.isFinite(createdAt)) {
    return false;
  }

  return Date.now() - createdAt >= 24 * 60 * 60 * 1000;
}
