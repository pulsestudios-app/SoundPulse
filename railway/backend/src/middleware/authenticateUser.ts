import type { NextFunction, Request, Response } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string };
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const raw = req.headers.authorization;
  const token =
    typeof raw === "string" && raw.startsWith("Bearer ") ? raw.slice("Bearer ".length).trim() : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = { id: data.user.id };
  next();
}
