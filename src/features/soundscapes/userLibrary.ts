import AsyncStorage from "@react-native-async-storage/async-storage";

const LIBRARY_KEY = "soundpulse_user_library_v1";

export type LibrarySoundItem = {
  id: string;
  kind: "ai" | "mix";
  title: string;
  subtitle?: string;
  createdAt: number;
  payload?: string;
};

async function readAll(): Promise<LibrarySoundItem[]> {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (x): x is LibrarySoundItem =>
        !!x &&
        typeof x === "object" &&
        typeof (x as LibrarySoundItem).id === "string" &&
        typeof (x as LibrarySoundItem).title === "string" &&
        typeof (x as LibrarySoundItem).createdAt === "number"
    );
  } catch {
    return [];
  }
}

async function writeAll(items: LibrarySoundItem[]): Promise<void> {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
}

export async function saveLibrarySound(
  item: Omit<LibrarySoundItem, "id" | "createdAt">
): Promise<LibrarySoundItem> {
  const existing = await readAll();
  const row: LibrarySoundItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  await writeAll([row, ...existing]);
  return row;
}
