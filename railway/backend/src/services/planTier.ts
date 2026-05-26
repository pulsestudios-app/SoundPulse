import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export type PlanTier =
  | "free"
  | "basic"
  | "student"
  | "semester"
  | "pro"
  | "pro_weekly"
  | "yearly"
  | "unlimited"
  | "lifetime";

const ALLOWED: PlanTier[] = [
  "free",
  "basic",
  "student",
  "semester",
  "pro",
  "pro_weekly",
  "yearly",
  "unlimited",
  "lifetime",
];

function headerPlanTier(headers: Record<string, unknown> | undefined): string {
  if (!headers) {
    return "";
  }
  const raw =
    headers["x-plan-tier"] ??
    headers["X-Plan-Tier"] ??
    headers["X-PLAN-TIER"];
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && typeof raw[0] === "string") {
    return raw[0];
  }
  return "";
}

export function parsePlanTierFromRequest(req: { body?: unknown; headers?: Record<string, unknown> }): PlanTier {
  const h = headerPlanTier(req.headers);
  const body = req.body as Record<string, unknown> | undefined;
  const fromBody = typeof body?.planTier === "string" ? body.planTier : "";
  const raw = (fromBody || h || "free").trim().toLowerCase();
  return ALLOWED.includes(raw as PlanTier) ? (raw as PlanTier) : "free";
}

/** Plan tier stored on async job rows (`input_meta.planTier`). */
export function planTierFromJobMeta(inputMeta: unknown): PlanTier {
  if (!inputMeta || typeof inputMeta !== "object") {
    return "free";
  }
  const raw = (inputMeta as Record<string, unknown>).planTier;
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return ALLOWED.includes(s as PlanTier) ? (s as PlanTier) : "free";
}

export async function claudeModelForPlanWithUsage(planTier: PlanTier, userId?: string): Promise<string> {
  if (planTier !== "unlimited" && planTier !== "lifetime") {
    return claudeModelForPlan(planTier);
  }
  if (!userId) {
    return "claude-opus-4-6";
  }
  try {
    const now = new Date();
    const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("minutes_used_this_month, usage_month")
      .eq("id", userId)
      .single();
    if (error || !profile) {
      return "claude-opus-4-6";
    }
    const usedRaw = profile.minutes_used_this_month;
    const usedMinutes =
      profile.usage_month === monthKey
        ? typeof usedRaw === "number" && Number.isFinite(usedRaw)
          ? usedRaw
          : Number(usedRaw) || 0
        : 0;
    if (usedMinutes >= 800) {
      return "claude-sonnet-4-6";
    }
    return "claude-opus-4-6";
  } catch (e) {
    console.error("[planTier] Usage check failed:", e);
    return "claude-opus-4-6";
  }
}

export function claudeModelForPlan(planTier: PlanTier): string {
  switch (planTier) {
    case "free":
      return "claude-haiku-4-5-20251001";
    case "basic":
    case "student":
    case "semester":
      return "claude-haiku-4-5-20251001";
    case "pro":
    case "pro_weekly":
    case "yearly":
      return "claude-sonnet-4-6";
    case "unlimited":
    case "lifetime":
      return "claude-opus-4-6";
    default:
      return "claude-haiku-4-5-20251001";
  }
}

const FREE_TRANSCRIBE_MAX_SECONDS = 15 * 60;
const PLAN_LIMIT_MINUTES: Record<PlanTier, number> = {
  free: 15,
  basic: 100,
  student: 250,
  semester: 250,
  pro: 400,
  yearly: 400,
  pro_weekly: 100,
  unlimited: 999999,
  lifetime: 999999,
};

export function planTranscriptionLimitMinutes(planTier: PlanTier): number {
  return PLAN_LIMIT_MINUTES[planTier] ?? 15;
}

export function assertWithinFreeTranscriptionDuration(
  planTier: PlanTier,
  durationSeconds: number
): void {
  if (planTier !== "free") {
    return;
  }
  if (durationSeconds > FREE_TRANSCRIBE_MAX_SECONDS) {
    throw Object.assign(
      new Error("Transcript exceeds 15 minute limit for free plan."),
      { code: "QUOTA_EXCEEDED" }
    );
  }
}

export function durationSecondsFromSegments(
  segments: Array<{ start?: number; end?: number }>,
  fallbackSeconds?: number
): number {
  let max = 0;
  for (const s of segments) {
    const a = typeof s.start === "number" && Number.isFinite(s.start) ? s.start : 0;
    const b = typeof s.end === "number" && Number.isFinite(s.end) ? s.end : 0;
    max = Math.max(max, a, b);
  }
  if (max > 0) {
    return max;
  }
  if (typeof fallbackSeconds === "number" && Number.isFinite(fallbackSeconds) && fallbackSeconds > 0) {
    return fallbackSeconds;
  }
  return 0;
}
