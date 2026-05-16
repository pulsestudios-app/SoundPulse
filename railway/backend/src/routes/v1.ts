import express, { type Request, type Response } from "express";

import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { authenticateUser } from "../middleware/authenticateUser.js";
import { billingRouter } from "./billing.js";
import { soundsRouter } from "./sounds.js";

export const v1Router = express.Router();

v1Router.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "soundpulse-backend",
    timestamp: new Date().toISOString(),
  });
});

v1Router.use("/billing", billingRouter);
v1Router.use("/sounds", soundsRouter);

v1Router.delete("/account", authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("[DELETE ACCOUNT] Error:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[DELETE ACCOUNT] Error:", error);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});
