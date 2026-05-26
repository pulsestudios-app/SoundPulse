import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import PostHog from "posthog-react-native";

export type AnalyticsEvent =
  | "app_opened"
  | "signed_up"
  | "signed_in"
  | "signed_out"
  | "trial_started"
  | "email_verified"
  | "subscription_purchased"
  | "subscription_cancelled"
  | "upgrade_screen_viewed"
  | "upgrade_button_tapped"
  | "sound_generated"
  | "sound_generation_failed"
  | "sound_played"
  | "sound_saved"
  | "sound_shared"
  | "mix_saved"
  | "mix_played"
  | "mix_shared"
  | "mix_remixed"
  | "layer_added"
  | "layer_removed"
  | "discover_opened"
  | "sound_pulsed"
  | "sound_unpulsed"
  | "community_sound_played"
  | "report_submitted"
  | "sleep_timer_started"
  | "playback_speed_changed"
  | "breathing_exercise_started"
  | "feedback_submitted"
  | "search_used";

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const ANALYTICS_OPT_OUT_KEY = "soundpulse.analytics.optedOut";
const ANALYTICS_ONCE_PREFIX = "soundpulse.analytics.once";
const PLACEHOLDER_KEY_PREFIX = "phc_";

let posthogClient: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;
let optedOutMemory = false;

const FORBIDDEN_PROPERTY_KEYS = new Set([
  "email",
  "name",
  "full_name",
  "fullName",
  "phone",
  "access_token",
  "refresh_token",
  "token",
  "password",
]);

function posthogEnv(): { key?: string; host?: string } {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  return {
    key: typeof extra?.posthogKey === "string" ? extra.posthogKey : undefined,
    host: typeof extra?.posthogHost === "string" ? extra.posthogHost : undefined,
  };
}

function isConfiguredKey(value: string | undefined): value is string {
  const key = value?.trim();
  if (!key) return false;
  if (!key.startsWith(PLACEHOLDER_KEY_PREFIX)) return true;
  return !key.toLowerCase().includes("placeholder") && !key.toLowerCase().includes("your_");
}

function cleanString(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/https?:\/\/\S+/gi, "[url]")
    .slice(0, 180);
}

function cleanProperties(properties?: AnalyticsProperties): Record<string, string | number | boolean | null> {
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties ?? {})) {
    if (FORBIDDEN_PROPERTY_KEYS.has(key)) {
      continue;
    }
    if (value == null) {
      clean[key] = null;
      continue;
    }
    if (typeof value === "string") {
      clean[key] = cleanString(value);
      continue;
    }
    if (typeof value === "number") {
      clean[key] = Number.isFinite(value) ? value : null;
      continue;
    }
    if (typeof value === "boolean") {
      clean[key] = value;
    }
  }
  return clean;
}

function accountAgeDays(createdAtIso?: string | null): number {
  if (!createdAtIso) return 0;
  const created = new Date(createdAtIso).getTime();
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000)));
}

export async function initAnalytics(): Promise<PostHog | null> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    optedOutMemory = (await AsyncStorage.getItem(ANALYTICS_OPT_OUT_KEY)) === "true";
    const env = posthogEnv();
    if (!isConfiguredKey(env.key)) {
      return null;
    }
    if (!posthogClient) {
      posthogClient = new PostHog(env.key, {
        host: env.host || "https://us.i.posthog.com",
        captureAppLifecycleEvents: false,
        defaultOptIn: !optedOutMemory,
        enableSessionReplay: false,
        personProfiles: "identified_only",
        setDefaultPersonProperties: false,
      });
      await posthogClient.ready();
      if (optedOutMemory) {
        await posthogClient.optOut();
      }
    }
    return posthogClient;
  })();

  return initPromise;
}

export async function getAnalyticsOptOut(): Promise<boolean> {
  return (await AsyncStorage.getItem(ANALYTICS_OPT_OUT_KEY)) === "true";
}

export async function setAnalyticsOptOut(optedOut: boolean): Promise<void> {
  optedOutMemory = optedOut;
  await AsyncStorage.setItem(ANALYTICS_OPT_OUT_KEY, optedOut ? "true" : "false");
  const client = await initAnalytics();
  if (!client) {
    return;
  }
  if (optedOut) {
    await client.optOut();
  } else {
    await client.optIn();
  }
}

export async function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): Promise<void> {
  try {
    if (optedOutMemory || (await getAnalyticsOptOut())) {
      return;
    }
    const client = await initAnalytics();
    if (!client) {
      return;
    }
    client.capture(event, cleanProperties(properties));
  } catch (e) {
    if (__DEV__) {
      console.warn("[analytics] capture failed", e);
    }
  }
}

export async function identifyAnalyticsUser(userId: string, properties: AnalyticsProperties): Promise<void> {
  try {
    if (!userId || optedOutMemory || (await getAnalyticsOptOut())) {
      return;
    }
    const client = await initAnalytics();
    if (!client) {
      return;
    }
    const clean = cleanProperties(properties);
    client.identify(userId, clean);
    client.setPersonProperties(clean);
    client.setPersonPropertiesForFlags(clean);
  } catch (e) {
    if (__DEV__) {
      console.warn("[analytics] identify failed", e);
    }
  }
}

export async function syncAnalyticsUserProperties(input: {
  userId: string;
  planTier: string;
  trialActive: boolean;
  createdAtIso?: string | null;
}): Promise<void> {
  await identifyAnalyticsUser(input.userId, {
    plan_tier: input.planTier,
    trial_active: input.trialActive,
    account_age_days: accountAgeDays(input.createdAtIso),
  });
}

export async function trackOncePerUser(
  userId: string,
  key: string,
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): Promise<void> {
  if (!userId) return;
  const storageKey = `${ANALYTICS_ONCE_PREFIX}.${userId}.${key}`;
  const alreadyTracked = await AsyncStorage.getItem(storageKey);
  if (alreadyTracked === "true") {
    return;
  }
  await trackEvent(event, properties);
  await AsyncStorage.setItem(storageKey, "true");
}

export function sanitizedErrorReason(message?: string | null): string {
  const raw = message?.trim();
  if (!raw) return "unknown";
  return cleanString(raw).slice(0, 120);
}

