import express, { type Request, type Response } from "express";

import { authenticateUser } from "../middleware/authenticateUser.js";
import {
  ElevenLabsConfigError,
  ElevenLabsGenerationError,
  generateSoundEffect,
} from "../services/elevenlabs.js";
import {
  assertCanGenerate,
  GenerationLimitError,
  incrementGenerationCount,
} from "../services/generationLimits.js";
import { uploadGeneratedSoundscape } from "../services/soundscapeStorage.js";

export const soundsRouter = express.Router();

const DEFAULT_DURATION_SEC = 15;
const MIN_DURATION_SEC = 0.5;
const MAX_DURATION_SEC = 30;
const MAX_PROMPT_LEN = 500;

function clampDuration(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(n)) {
    return DEFAULT_DURATION_SEC;
  }
  return Math.min(MAX_DURATION_SEC, Math.max(MIN_DURATION_SEC, n));
}

soundsRouter.post("/generate", authenticateUser, async (req: Request, res: Response) => {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const bodyUserId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (bodyUserId && bodyUserId !== authUserId) {
      return res.status(403).json({ error: "userId does not match authenticated user" });
    }

    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }
    if (prompt.length > MAX_PROMPT_LEN) {
      return res.status(400).json({ error: `prompt must be at most ${MAX_PROMPT_LEN} characters` });
    }

    const durationSeconds = clampDuration(body.duration_seconds);

    await assertCanGenerate(authUserId);

    const audioBuffer = await generateSoundEffect(prompt, durationSeconds);
    const stored = await uploadGeneratedSoundscape(authUserId, audioBuffer, durationSeconds);

    await incrementGenerationCount(authUserId);

    return res.json({
      url: stored.url,
      duration: stored.duration,
    });
  } catch (err) {
    if (err instanceof GenerationLimitError) {
      return res.status(403).json({ error: err.code });
    }
    if (err instanceof ElevenLabsConfigError) {
      return res.status(503).json({ error: err.message });
    }
    if (err instanceof ElevenLabsGenerationError) {
      const status = err.status >= 400 && err.status < 600 ? err.status : 502;
      return res.status(status).json({ error: err.message });
    }
    console.error("[sounds/generate]", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Sound generation failed",
    });
  }
});
