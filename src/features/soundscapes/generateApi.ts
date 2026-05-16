import { ensureBackendUrl, backendJsonHeaders } from "@/src/lib/backend";
import { supabase } from "@/src/lib/supabase";

export type GenerateSoundscapeResult = {
  url: string;
  duration: number;
};

export class GenerateSoundscapeError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "GenerateSoundscapeError";
    this.status = status;
  }
}

export async function generateSoundscape(
  prompt: string,
  userId: string,
  durationSeconds = 15
): Promise<GenerateSoundscapeResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new GenerateSoundscapeError("Sign in to generate sounds.", 401);
  }

  const baseUrl = ensureBackendUrl();
  const res = await fetch(`${baseUrl}/v1/sounds/generate`, {
    method: "POST",
    headers: backendJsonHeaders(token),
    body: JSON.stringify({
      prompt: prompt.trim(),
      userId,
      duration_seconds: durationSeconds,
    }),
  });

  const text = await res.text();
  let parsed: { url?: string; duration?: number; error?: string } = {};
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    /* non-json */
  }

  if (!res.ok) {
    throw new GenerateSoundscapeError(
      typeof parsed.error === "string" ? parsed.error : text || `Request failed (${res.status})`,
      res.status
    );
  }

  const url = typeof parsed.url === "string" ? parsed.url.trim() : "";
  const duration = typeof parsed.duration === "number" ? parsed.duration : durationSeconds;
  if (!url) {
    throw new GenerateSoundscapeError("Server did not return an audio URL.", 502);
  }

  return { url, duration };
}
