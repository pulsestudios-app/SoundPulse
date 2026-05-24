import AsyncStorage from "@react-native-async-storage/async-storage";

export type BreathingVoice = "female" | "male";

const STORAGE_PREFIX = "breathing_voice:";

function storageKey(exerciseId: string): string {
  return `${STORAGE_PREFIX}${exerciseId}`;
}

export async function getBreathingVoice(exerciseId: string): Promise<BreathingVoice> {
  const stored = await AsyncStorage.getItem(storageKey(exerciseId));
  return stored === "male" ? "male" : "female";
}

export async function setBreathingVoice(exerciseId: string, voice: BreathingVoice): Promise<void> {
  await AsyncStorage.setItem(storageKey(exerciseId), voice);
}

export async function loadBreathingVoices(
  exerciseIds: string[]
): Promise<Record<string, BreathingVoice>> {
  const entries = await Promise.all(
    exerciseIds.map(async (id) => [id, await getBreathingVoice(id)] as const)
  );
  return Object.fromEntries(entries);
}
