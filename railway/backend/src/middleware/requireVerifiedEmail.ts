import type { NextFunction, Request, Response } from "express";

export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.emailConfirmed) {
    res.status(403).json({
      error: "EMAIL_NOT_VERIFIED",
      message: "Verify your email before generating AI soundscapes.",
    });
    return;
  }

  next();
}
