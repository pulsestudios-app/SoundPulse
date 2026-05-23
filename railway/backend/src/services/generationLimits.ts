import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export type GenerationPlanBucket = "free" | "basic" | "pro" | "unlimited";

export type GenerationLimitErrorCode = "GENERATION_LIMIT_REACHED" | "PAID_PLAN_REQUIRED";

export class GenerationLimitError extends Error {
  readonly code: GenerationLimitErrorCode;

  constructor(code: GenerationLimitErrorCode) {
    super(code);
    this.name = "GenerationLimitError";
    this.code = code;
  }
}

const GENERATION_LIMITS: Record<GenerationPlanBucket, number> = {
  free: 0,
  basic: 10,
  pro: 20,
  unlimited: 40,
};

export function currentGenerationsMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function resolveGenerationPlanBucket(planRaw: string | null | undefined): GenerationPlanBucket {
  const plan = (planRaw ?? "free").trim().toLowerCase();
  if (!plan || plan === "free") {
    return "free";
  }
  if (plan === "basic") {
    return "basic";
  }
  if (plan === "student" || plan === "semester" || plan === "pro_weekly") {
    return "basic";
  }
  if (plan === "pro" || plan === "yearly") {
    return "pro";
  }
  if (plan === "unlimited" || plan === "lifetime") {
    return "unlimited";
  }
  return "free";
}

export function generationLimitForPlan(planRaw: string | null | undefined): number {
  return GENERATION_LIMITS[resolveGenerationPlanBucket(planRaw)];
}

async function getUserPlan(userId: string): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const profilePlan = typeof profile?.plan === "string" ? profile.plan.trim() : "";
  if (profilePlan) {
    return profilePlan;
  }

  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1);

  const subscription = subscriptions?.[0];
  const subPlan = typeof subscription?.plan === "string" ? subscription.plan.trim() : "";
  const status = typeof subscription?.status === "string" ? subscription.status.trim().toLowerCase() : "";
  if (subPlan && status === "active") {
    return subPlan;
  }

  return "free";
}

export async function assertCanGenerate(userId: string): Promise<void> {
  const plan = await getUserPlan(userId);
  const bucket = resolveGenerationPlanBucket(plan);
  const limit = GENERATION_LIMITS[bucket];

  if (bucket === "free" || limit <= 0) {
    throw new GenerationLimitError("PAID_PLAN_REQUIRED");
  }

  const monthKey = currentGenerationsMonthKey();
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("generations_used_this_month, generations_month")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new GenerationLimitError("GENERATION_LIMIT_REACHED");
  }

  const used =
    profile.generations_month === monthKey
      ? typeof profile.generations_used_this_month === "number" &&
        Number.isFinite(profile.generations_used_this_month)
        ? profile.generations_used_this_month
        : Number(profile.generations_used_this_month) || 0
      : 0;

  if (used >= limit) {
    throw new GenerationLimitError("GENERATION_LIMIT_REACHED");
  }
}

export async function incrementGenerationCount(userId: string): Promise<void> {
  const monthKey = currentGenerationsMonthKey();
  const { data: profile, error: readError } = await supabaseAdmin
    .from("profiles")
    .select("generations_used_this_month, generations_month")
    .eq("id", userId)
    .single();

  if (readError || !profile) {
    console.error("[generationLimits] increment read failed:", readError?.message ?? "missing profile");
    return;
  }

  const used =
    profile.generations_month === monthKey
      ? typeof profile.generations_used_this_month === "number" &&
        Number.isFinite(profile.generations_used_this_month)
        ? profile.generations_used_this_month
        : Number(profile.generations_used_this_month) || 0
      : 0;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      generations_used_this_month: used + 1,
      generations_month: monthKey,
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[generationLimits] increment update failed:", updateError.message);
  }
}
