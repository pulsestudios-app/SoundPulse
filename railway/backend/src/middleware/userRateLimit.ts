import rateLimit from "express-rate-limit";
import type { Request } from "express";

type UserRateLimitOptions = {
  windowMs: number;
  max: number;
  errorCode: string;
  message: string;
};

function userKey(req: Request): string {
  return req.user?.id ?? req.ip ?? "anonymous";
}

function createUserRateLimit(options: UserRateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userKey,
    message: { error: options.errorCode, message: options.message },
  });
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** POST /v1/billing/play/verify — 10 requests fully authenticated user per hour. */
export const billingVerifyRateLimit = createUserRateLimit({
  windowMs: HOUR_MS,
  max: 10,
  errorCode: "BILLING_VERIFY_RATE_LIMITED",
  message: "Too many purchase verification attempts. Try again later.",
});

/** POST /v1/billing/play/restore — 10 per fully authenticated user per hour. */
export const billingRestoreRateLimit = createUserRateLimit({
  windowMs: HOUR_MS,
  max: 10,
  errorCode: "BILLING_RESTORE_RATE_LIMITED",
  message: "Too many purchase restore attempts. Try again later.",
});

/** DELETE /v1/account — 3 per fully authenticated user per day. */
export const accountDeleteRateLimit = createUserRateLimit({
  windowMs: DAY_MS,
  max: 3,
  errorCode: "ACCOUNT_DELETE_RATE_LIMITED",
  message: "Too many account deletion attempts. Try again tomorrow.",
});

/** POST /v1/community/pulse — 60 per user per hour. */
export const communityPulseRateLimit = createUserRateLimit({
  windowMs: HOUR_MS,
  max: 60,
  errorCode: "COMMUNITY_PULSE_RATE_LIMITED",
  message: "Too many pulse actions. Try again later.",
});

/** POST /v1/community/save — 60 per user per hour. */
export const communitySaveRateLimit = createUserRateLimit({
  windowMs: HOUR_MS,
  max: 60,
  errorCode: "COMMUNITY_SAVE_RATE_LIMITED",
  message: "Too many save actions. Try again later.",
});

/** POST /v1/community/report — 5 per user per hour. */
export const communityReportRateLimit = createUserRateLimit({
  windowMs: HOUR_MS,
  max: 5,
  errorCode: "COMMUNITY_REPORT_RATE_LIMITED",
  message: "Too many reports. Try again later.",
});

/** POST /v1/community/share — 10 per user per hour. */
export const communityShareRateLimit = createUserRateLimit({
  windowMs: HOUR_MS,
  max: 10,
  errorCode: "COMMUNITY_SHARE_RATE_LIMITED",
  message: "Too many share actions. Try again later.",
});
