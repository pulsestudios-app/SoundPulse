import { supabase } from "@/src/lib/supabase";

import type { SavedLayerSnapshot } from "@/src/features/mixer/layerPresets";

import type { CommunityCategoryKey } from "./categories";
import type {
  CommunitySound,
  CommunitySoundRow,
  CreatorProfile,
  ShareCommunitySoundInput,
} from "./types";

const PAGE_SIZE = 10;

type PulseRow = { sound_id: string; created_at: string | null };
type PublicProfileRow = { id: string; display_name: string | null; avatar_url: string | null };

function twentyFourHoursAgoIso(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

function startOfCurrentWeekIso(): string {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - daysFromMonday);
  return monday.toISOString();
}

function fallbackCreatorName(profile: PublicProfileRow | undefined, userId: string): string {
  const display = profile?.display_name?.trim();
  if (display) {
    return display;
  }
  return `Creator ${userId.slice(0, 6)}`;
}

async function fetchPulseStats(soundIds: string[]): Promise<{
  pulseCounts: Map<string, number>;
  pulses24h: Map<string, number>;
}> {
  const pulseCounts = new Map<string, number>();
  const pulses24h = new Map<string, number>();
  if (soundIds.length === 0) {
    return { pulseCounts, pulses24h };
  }

  const since = twentyFourHoursAgoIso();
  const { data, error } = await supabase
    .from("sound_likes")
    .select("sound_id, created_at")
    .in("sound_id", soundIds);

  if (error) {
    return { pulseCounts, pulses24h };
  }

  for (const row of (data ?? []) as PulseRow[]) {
    pulseCounts.set(row.sound_id, (pulseCounts.get(row.sound_id) ?? 0) + 1);
    if (row.created_at && row.created_at >= since) {
      pulses24h.set(row.sound_id, (pulses24h.get(row.sound_id) ?? 0) + 1);
    }
  }

  return { pulseCounts, pulses24h };
}

async function fetchUserPulseSaveState(
  userId: string | undefined,
  soundIds: string[]
): Promise<{ pulsed: Set<string>; saved: Set<string> }> {
  const pulsed = new Set<string>();
  const saved = new Set<string>();
  if (!userId || soundIds.length === 0) {
    return { pulsed, saved };
  }

  const [likesResult, savesResult] = await Promise.all([
    supabase.from("sound_likes").select("sound_id").eq("user_id", userId).in("sound_id", soundIds),
    supabase.from("sound_saves").select("sound_id").eq("user_id", userId).in("sound_id", soundIds),
  ]);

  for (const row of likesResult.data ?? []) {
    if (typeof row.sound_id === "string") {
      pulsed.add(row.sound_id);
    }
  }
  for (const row of savesResult.data ?? []) {
    if (typeof row.sound_id === "string") {
      saved.add(row.sound_id);
    }
  }

  return { pulsed, saved };
}

async function enrichCommunitySounds(
  rows: CommunitySoundRow[],
  userId: string | undefined
): Promise<CommunitySound[]> {
  const soundIds = rows.map((r) => r.id);
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const [{ pulseCounts, pulses24h }, { pulsed, saved }, profilesResult] = await Promise.all([
    fetchPulseStats(soundIds),
    fetchUserPulseSaveState(userId, soundIds),
    supabase.from("profiles_public").select("id, display_name, avatar_url").in("id", userIds),
  ]);

  const profileMap = new Map<string, PublicProfileRow>();
  for (const profile of (profilesResult.data ?? []) as PublicProfileRow[]) {
    profileMap.set(profile.id, profile);
  }

  return rows.map((row) => ({
    ...row,
    creatorName: fallbackCreatorName(profileMap.get(row.user_id), row.user_id),
    creatorAvatarUrl: profileMap.get(row.user_id)?.avatar_url?.trim() || null,
    pulseCount: pulseCounts.get(row.id) ?? 0,
    pulses24h: pulses24h.get(row.id) ?? 0,
    hasPulsed: pulsed.has(row.id),
    hasSaved: saved.has(row.id),
  }));
}

function baseCommunityQuery(category: CommunityCategoryKey | null) {
  let query = supabase
    .from("community_sounds")
    .select("*")
    .eq("is_public", true)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.contains("tags", [category]);
  }

  return query;
}

export async function fetchCommunityFeedPage(options: {
  userId?: string;
  category: CommunityCategoryKey | null;
  page: number;
  trending24h?: boolean;
}): Promise<CommunitySound[]> {
  const from = options.page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await baseCommunityQuery(options.category).range(from, to);
  if (error) {
    throw new Error(error.message);
  }

  let sounds = await enrichCommunitySounds((data ?? []) as CommunitySoundRow[], options.userId);

  if (options.trending24h) {
    sounds = [...sounds].sort((a, b) => b.pulses24h - a.pulses24h || b.pulseCount - a.pulseCount);
  }

  return sounds;
}

export async function fetchCommunitySoundsNewToday(userId?: string): Promise<CommunitySound[]> {
  const since = twentyFourHoursAgoIso();
  const { data, error } = await supabase
    .from("community_sounds")
    .select("*")
    .eq("is_public", true)
    .eq("is_hidden", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return enrichCommunitySounds((data ?? []) as CommunitySoundRow[], userId);
}

export async function fetchFeaturedCommunitySound(userId?: string): Promise<CommunitySound | null> {
  const since = startOfCurrentWeekIso();
  const { data: recentPulses, error: pulseError } = await supabase
    .from("sound_likes")
    .select("sound_id")
    .gte("created_at", since);

  if (pulseError) {
    throw new Error(pulseError.message);
  }

  const counts = new Map<string, number>();
  for (const row of recentPulses ?? []) {
    if (typeof row.sound_id === "string") {
      counts.set(row.sound_id, (counts.get(row.sound_id) ?? 0) + 1);
    }
  }

  let featuredId: string | null = null;
  let max = 0;
  for (const [id, count] of counts) {
    if (count > max) {
      max = count;
      featuredId = id;
    }
  }

  if (!featuredId) {
    const { data: fallback, error } = await baseCommunityQuery(null).limit(1);
    if (error || !fallback?.length) {
      return null;
    }
    const enriched = await enrichCommunitySounds(fallback as CommunitySoundRow[], userId);
    return enriched[0] ?? null;
  }

  const { data: sound, error: soundError } = await supabase
    .from("community_sounds")
    .select("*")
    .eq("id", featuredId)
    .eq("is_public", true)
    .eq("is_hidden", false)
    .maybeSingle();

  if (soundError || !sound) {
    return null;
  }

  const enriched = await enrichCommunitySounds([sound as CommunitySoundRow], userId);
  return enriched[0] ?? null;
}

export async function shareMixToCommunity(input: {
  userId: string;
  name: string;
  layers: SavedLayerSnapshot[];
  savedMixId: string;
  tags?: CommunityCategoryKey[];
}): Promise<void> {
  const { error } = await supabase.from("community_sounds").insert({
    user_id: input.userId,
    title: input.name,
    prompt: `Layer mix · ${input.name}`,
    kind: "mix",
    mix_layers: input.layers,
    saved_mix_id: input.savedMixId,
    tags: input.tags ?? ["relax"],
    is_public: true,
    duration: 0,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeCommunitySoundFromDiscover(userId: string, soundId: string): Promise<void> {
  const { error } = await supabase
    .from("community_sounds")
    .update({ is_public: false })
    .eq("id", soundId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function deleteCommunitySoundRelations(soundId: string): Promise<void> {
  await supabase.from("sound_likes").delete().eq("sound_id", soundId);
  await supabase.from("sound_saves").delete().eq("sound_id", soundId);
  await supabase.from("sound_reports").delete().eq("sound_id", soundId);
}

export async function deleteCommunitySoundCompletely(userId: string, soundId: string): Promise<void> {
  await deleteCommunitySoundRelations(soundId);
  const { error } = await supabase
    .from("community_sounds")
    .delete()
    .eq("id", soundId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function shareSoundToCommunity(input: ShareCommunitySoundInput): Promise<void> {
  const { error } = await supabase.from("community_sounds").insert({
    user_id: input.userId,
    title: input.title,
    prompt: input.prompt,
    audio_url: input.audioUrl,
    duration: Math.max(0, Math.round(input.duration)),
    tags: input.tags,
    is_public: true,
    kind: "audio",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleCommunityPulse(userId: string, sound: CommunitySound): Promise<boolean> {
  if (sound.hasPulsed) {
    const { error } = await supabase
      .from("sound_likes")
      .delete()
      .eq("sound_id", sound.id)
      .eq("user_id", userId);
    if (error) {
      throw new Error(error.message);
    }
    return false;
  }

  const { error } = await supabase.from("sound_likes").insert({
    sound_id: sound.id,
    user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function toggleCommunitySave(userId: string, sound: CommunitySound): Promise<boolean> {
  if (sound.hasSaved) {
    const { error } = await supabase
      .from("sound_saves")
      .delete()
      .eq("sound_id", sound.id)
      .eq("user_id", userId);
    if (error) {
      throw new Error(error.message);
    }
    return false;
  }

  const { error } = await supabase.from("sound_saves").insert({
    sound_id: sound.id,
    user_id: userId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export async function reportCommunitySound(
  userId: string,
  soundId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase.from("sound_reports").insert({
    sound_id: soundId,
    user_id: userId,
    reason: reason.trim() || "Community report",
    status: "pending",
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchSavedCommunitySounds(userId: string): Promise<CommunitySound[]> {
  const { data: saves, error: savesError } = await supabase
    .from("sound_saves")
    .select("sound_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (savesError) {
    throw new Error(savesError.message);
  }

  const soundIds: string[] = [];
  for (const row of saves ?? []) {
    if (typeof row.sound_id === "string") {
      soundIds.push(row.sound_id);
    }
  }

  if (soundIds.length === 0) {
    return [];
  }

  const { data: sounds, error: soundsError } = await supabase
    .from("community_sounds")
    .select("*")
    .in("id", soundIds)
    .eq("is_public", true)
    .eq("is_hidden", false);

  if (soundsError) {
    throw new Error(soundsError.message);
  }

  const orderMap = new Map(soundIds.map((id, index) => [id, index]));
  const rows = ((sounds ?? []) as CommunitySoundRow[]).sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
  );

  const enriched = await enrichCommunitySounds(rows, userId);
  return enriched.map((sound) => ({ ...sound, hasSaved: true }));
}

export async function fetchCreatorProfile(
  creatorId: string,
  viewerId?: string
): Promise<CreatorProfile> {
  const [profileResult, soundsResult] = await Promise.all([
    supabase
      .from("profiles_public")
      .select("id, display_name, avatar_url")
      .eq("id", creatorId)
      .maybeSingle(),
    supabase
      .from("community_sounds")
      .select("*")
      .eq("user_id", creatorId)
      .eq("is_public", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
  if (soundsResult.error) {
    throw new Error(soundsResult.error.message);
  }

  const profile = profileResult.data as PublicProfileRow | null;
  const soundRows = (soundsResult.data ?? []) as CommunitySoundRow[];
  const soundIds = soundRows.map((row) => row.id);

  let totalPulses = 0;
  if (soundIds.length > 0) {
    const { count, error } = await supabase
      .from("sound_likes")
      .select("id", { count: "exact", head: true })
      .in("sound_id", soundIds);
    if (error) {
      throw new Error(error.message);
    }
    totalPulses = count ?? 0;
  }

  const sounds = await enrichCommunitySounds(soundRows, viewerId);

  return {
    userId: creatorId,
    displayName: fallbackCreatorName(profile ?? undefined, creatorId),
    email: null,
    avatarUrl: profile?.avatar_url?.trim() || null,
    soundsShared: soundRows.length,
    totalPulses,
    sounds,
  };
}

export { PAGE_SIZE as COMMUNITY_PAGE_SIZE };
