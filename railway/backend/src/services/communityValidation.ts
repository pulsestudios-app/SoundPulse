const HTML_TAG_RE = /<[^>]*>/g;
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;
const DANGEROUS_CHARS_RE = /[<>'"`\\]/g;

export function sanitizePlainText(value: string, maxLength: number): string {
  return value
    .replace(HTML_TAG_RE, "")
    .replace(CONTROL_CHARS_RE, "")
    .replace(DANGEROUS_CHARS_RE, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSoundTitle(value: string): string {
  return sanitizePlainText(value, 80);
}

export function sanitizeReportReason(value: string): string {
  return sanitizePlainText(value, 500);
}

const ALLOWED_TAGS = new Set(["sleep", "focus", "relax", "nature", "urban"]);

export function sanitizeCommunityTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return ["relax"];
  }
  const tags: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") {
      continue;
    }
    const tag = item.trim().toLowerCase();
    if (ALLOWED_TAGS.has(tag) && !tags.includes(tag)) {
      tags.push(tag);
    }
    if (tags.length >= 5) {
      break;
    }
  }
  return tags.length > 0 ? tags : ["relax"];
}

export function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type MixLayerInput = {
  id: string;
  volume: number;
  enabled: boolean;
};

export function parseMixLayers(raw: unknown): MixLayerInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) {
    return null;
  }

  const layers: MixLayerInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const volume = typeof row.volume === "number" ? row.volume : Number(row.volume);
    const enabled = row.enabled === true;
    if (!id || !Number.isFinite(volume)) {
      return null;
    }
    layers.push({
      id,
      volume: Math.min(100, Math.max(0, volume)),
      enabled,
    });
  }

  return layers;
}
