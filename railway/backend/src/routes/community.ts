import express, { type Request, type Response } from "express";

import { authenticateUser } from "../middleware/authenticateUser.js";
import {
  communityPulseRateLimit,
  communityReportRateLimit,
  communitySaveRateLimit,
  communityShareRateLimit,
} from "../middleware/userRateLimit.js";
import { CommunityWriteError, reportCommunitySound, shareToCommunity, toggleCommunityPulse, toggleCommunitySave } from "../services/communityWrites.js";

export const communityRouter = express.Router();

function sendCommunityError(res: Response, err: CommunityWriteError): void {
  res.status(err.status).json({ error: err.code, message: err.message });
}

function readSoundId(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }
  const soundId = (body as Record<string, unknown>).soundId;
  return typeof soundId === "string" ? soundId.trim() : "";
}

communityRouter.post("/pulse", authenticateUser, communityPulseRateLimit, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  try {
    const pulsed = await toggleCommunityPulse(userId, readSoundId(req.body));
    res.json({ ok: true, pulsed });
  } catch (err) {
    if (err instanceof CommunityWriteError) {
      sendCommunityError(res, err);
      return;
    }
    console.error("[community/pulse]", err);
    res.status(500).json({ error: "COMMUNITY_WRITE_FAILED" });
  }
});

communityRouter.post("/save", authenticateUser, communitySaveRateLimit, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  try {
    const saved = await toggleCommunitySave(userId, readSoundId(req.body));
    res.json({ ok: true, saved });
  } catch (err) {
    if (err instanceof CommunityWriteError) {
      sendCommunityError(res, err);
      return;
    }
    console.error("[community/save]", err);
    res.status(500).json({ error: "COMMUNITY_WRITE_FAILED" });
  }
});

communityRouter.post("/report", authenticateUser, communityReportRateLimit, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const reason = typeof body.reason === "string" ? body.reason : "";

  try {
    await reportCommunitySound(userId, req.user?.emailConfirmed ?? false, readSoundId(body), reason);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof CommunityWriteError) {
      sendCommunityError(res, err);
      return;
    }
    console.error("[community/report]", err);
    res.status(500).json({ error: "COMMUNITY_WRITE_FAILED" });
  }
});

communityRouter.post("/share", authenticateUser, communityShareRateLimit, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const kind = typeof body.kind === "string" ? body.kind.trim().toLowerCase() : "";

  try {
    if (kind === "audio") {
      await shareToCommunity(userId, {
        kind: "audio",
        title: typeof body.title === "string" ? body.title : "",
        prompt: typeof body.prompt === "string" ? body.prompt : "",
        audioUrl: typeof body.audioUrl === "string" ? body.audioUrl : "",
        duration: typeof body.duration === "number" ? body.duration : Number(body.duration),
        tags: body.tags,
      });
    } else if (kind === "mix") {
      await shareToCommunity(userId, {
        kind: "mix",
        name: typeof body.name === "string" ? body.name : "",
        layers: body.layers,
        savedMixId: typeof body.savedMixId === "string" ? body.savedMixId : "",
        tags: body.tags,
      });
    } else {
      res.status(400).json({ error: "INVALID_REQUEST", message: "kind must be audio or mix." });
      return;
    }

    res.json({ ok: true });
  } catch (err) {
    if (err instanceof CommunityWriteError) {
      sendCommunityError(res, err);
      return;
    }
    console.error("[community/share]", err);
    res.status(500).json({ error: "COMMUNITY_WRITE_FAILED" });
  }
});
