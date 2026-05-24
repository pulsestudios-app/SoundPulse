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
