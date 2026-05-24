import rateLimit from "express-rate-limit";
import type { Request } from "express";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;

export const generateRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? "anonymous",
  message: { error: "RATE_LIMIT_EXCEEDED" },
});
