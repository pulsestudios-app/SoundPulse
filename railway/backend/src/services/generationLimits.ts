import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export type GenerationPlanBucket = "free" | "basic" | "pro" | "unlimited";

export type GenerationLimitErrorCode =
  | "GENERATION_LIMIT_REACHED"
  | "PAID_PLAN_REQUIRED"
  | "GENERATION_RESERVE_FAILED";

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
  pro: 30,
  unlimited: 50,
};

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

async function getUserPlan(userId: string): Promise<string> {
  const { data: subscriptions } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1);

  const subscription = subscriptions?.[0];
  const subPlan = typeof subscription?.plan === "string" ? subscription.plan.trim() : "";
  const status = typeof subscription?.status === "string" ? subscription.status.trim().toLowerCase() : "";
  const expiresAt =
    typeof subscription?.expires_at === "string" ? new Date(subscription.expires_at) : null;
  const stillEntitled = !expiresAt || expiresAt.getTime() > Date.now();
  if (
    subPlan &&
    stillEntitled &&
    ["active", "trialing", "in_grace_period", "canceled"].includes(status)
  ) {
    return subPlan;
  }

  return "free";
}

function limitErrorForUser(plan: string): GenerationLimitError {
  const bucket = resolveGenerationPlanBucket(plan);
  if (bucket === "free" || GENERATION_LIMITS[bucket] <= 0) {
    return new GenerationLimitError("PAID_PLAN_REQUIRED");
  }
  return new GenerationLimitError("GENERATION_LIMIT_REACHED");
}

/** Atomically reserves one generation slot before calling ElevenLabs. */
export async function reserveGenerationSlot(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc("reserve_generation_slot", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[generationLimits] reserve_generation_slot RPC failed:", error.message);
    throw new GenerationLimitError("GENERATION_RESERVE_FAILED");
  }

  if (data === true) {
    return;
  }

  const plan = await getUserPlan(userId);
  throw limitErrorForUser(plan);
}

/** Returns reserved slot if generation/upload fails after reserve. */
export async function releaseGenerationSlot(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("release_generation_slot", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[generationLimits] release_generation_slot RPC failed:", error.message);
  }
}

/**
 * Post-generation accounting check. Slot is reserved before ElevenLabs; this verifies
 * the counter advanced. On failure, callers must not return audio to the client.
 */
export async function assertGenerationSlotRecorded(userId: string): Promise<void> {
  const monthKey = currentGenerationsMonthKey();
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("generations_used_this_month, generations_month")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    console.error(
      "[generationLimits] post-generation verify failed:",
      error?.message ?? "missing profile"
    );
    throw new GenerationLimitError("GENERATION_RESERVE_FAILED");
  }

  const used =
    profile.generations_month === monthKey
      ? Number(profile.generations_used_this_month) || 0
      : 0;

  if (used < 1) {
    console.error("[generationLimits] post-generation verify: counter not incremented for", userId);
    throw new GenerationLimitError("GENERATION_RESERVE_FAILED");
  }
}

export function currentGenerationsMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}
