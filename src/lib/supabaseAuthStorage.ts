/**
 * Supabase session JSON often exceeds iOS Keychain single-value limits (~2KB).
 * Store small payloads in one SecureStore key; larger sessions are chunked across keys.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/** Must match `storageKey` passed to `createClient`. */
export const SUPABASE_AUTH_STORAGE_KEY = "soundpulse-auth";

const CHUNK_SIZE = 1900;
const CHUNK_COUNT_KEY = `${SUPABASE_AUTH_STORAGE_KEY}.__n`;

async function wipeSecureAuthSlots(maxSlots: number): Promise<void> {
  await SecureStore.deleteItemAsync(SUPABASE_AUTH_STORAGE_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(CHUNK_COUNT_KEY).catch(() => undefined);
  for (let i = 0; i < maxSlots; i++) {
    await SecureStore.deleteItemAsync(`${SUPABASE_AUTH_STORAGE_KEY}.__${i}`).catch(() => undefined);
  }
}

export function createNativeSupabaseAuthStorage() {
  return {
    getItem: async (key: string): Promise<string | null> => {
      if (key !== SUPABASE_AUTH_STORAGE_KEY) {
        return AsyncStorage.getItem(key);
      }
      const single = await SecureStore.getItemAsync(SUPABASE_AUTH_STORAGE_KEY).catch(() => null);
      if (single) {
        return single;
      }
      const nRaw = await SecureStore.getItemAsync(CHUNK_COUNT_KEY).catch(() => null);
      if (!nRaw) {
        return AsyncStorage.getItem(key);
      }
      const n = Number.parseInt(nRaw, 10);
      if (!Number.isFinite(n) || n < 1 || n > 80) {
        return null;
      }
      let acc = "";
      for (let i = 0; i < n; i++) {
        const part = await SecureStore.getItemAsync(`${SUPABASE_AUTH_STORAGE_KEY}.__${i}`).catch(() => null);
        if (part == null) {
          return null;
        }
        acc += part;
      }
      return acc;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      if (key !== SUPABASE_AUTH_STORAGE_KEY) {
        await AsyncStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY).catch(() => undefined);
      if (value.length <= CHUNK_SIZE) {
        await wipeSecureAuthSlots(80);
        await SecureStore.setItemAsync(SUPABASE_AUTH_STORAGE_KEY, value);
        return;
      }
      await SecureStore.deleteItemAsync(SUPABASE_AUTH_STORAGE_KEY).catch(() => undefined);
      const n = Math.ceil(value.length / CHUNK_SIZE);
      if (n > 80) {
        await wipeSecureAuthSlots(80);
        await AsyncStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, value);
        return;
      }
      await wipeSecureAuthSlots(80);
      await SecureStore.setItemAsync(CHUNK_COUNT_KEY, String(n));
      for (let i = 0; i < n; i++) {
        await SecureStore.setItemAsync(
          `${SUPABASE_AUTH_STORAGE_KEY}.__${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        );
      }
    },
    removeItem: async (key: string): Promise<void> => {
      if (key !== SUPABASE_AUTH_STORAGE_KEY) {
        await AsyncStorage.removeItem(key);
        return;
      }
      await wipeSecureAuthSlots(80);
      await AsyncStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    },
  };
}
