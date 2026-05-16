import Constants from "expo-constants";

function isPlaceholder(value?: string): boolean {
  if (!value) {
    return true;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.includes("paste_your_") || normalized.includes("your_");
}

export function ensureBackendUrl(): string {
  const extra = Constants.expoConfig?.extra;
  if (!extra || typeof extra !== "object") {
    throw new Error(
      "Constants.expoConfig.extra is missing. Add app.config.js and EXPO_PUBLIC_BACKEND_URL, then restart Expo."
    );
  }
  const raw = extra as Record<string, unknown>;
  const url = typeof raw.backendUrl === "string" ? raw.backendUrl.trim().replace(/\/+$/, "") : "";
  if (!url || isPlaceholder(url)) {
    throw new Error(
      "Backend URL missing: set EXPO_PUBLIC_BACKEND_URL in .env and restart Expo (npx expo start -c)."
    );
  }
  return url;
}

export function backendAuthHeaders(): Record<string, string> {
  const extra = Constants.expoConfig?.extra;
  const raw = extra && typeof extra === "object" ? (extra as Record<string, unknown>) : null;
  const key = raw && typeof raw.appSecretKey === "string" ? raw.appSecretKey.trim() : "";
  return key ? { "x-app-key": key } : {};
}

export function backendJsonHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...backendAuthHeaders(),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}
