import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "soundpulse_recent_plays_v1";

export type RecentPlay = {
  id: string;
  name: string;
  durationSec: number;
  playedAt: number;
};

export async function loadRecentPlays(max = 3): Promise<RecentPlay[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const cleaned: RecentPlay[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as RecentPlay).id === "string" &&
        typeof (item as RecentPlay).name === "string" &&
        typeof (item as RecentPlay).durationSec === "number" &&
        typeof (item as RecentPlay).playedAt === "number"
      ) {
        cleaned.push(item as RecentPlay);
      }
    }
    cleaned.sort((a, b) => b.playedAt - a.playedAt);
    return cleaned.slice(0, max);
  } catch {
    return [];
  }
}

export async function recordRecentPlay(entry: {
  id: string;
  name: string;
  durationSec: number;
}): Promise<void> {
  const prev = await loadRecentPlays(10);
  const without = prev.filter((p) => p.id !== entry.id);
  const next: RecentPlay[] = [
    { ...entry, playedAt: Date.now() },
    ...without,
  ].slice(0, 3);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
