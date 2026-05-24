import { resetBackgroundPlayback } from "./backgroundPlayback";

export type PlaybackHandler = {
  id: string;
  fadeOut: (durationMs: number) => Promise<void>;
  restoreVolume: () => Promise<void>;
  stop: () => Promise<void>;
};

const handlers = new Map<string, PlaybackHandler>();
const stopListeners = new Set<() => void>();

export function registerPlaybackHandler(handler: PlaybackHandler): void {
  handlers.set(handler.id, handler);
}

export function unregisterPlaybackHandler(id: string): void {
  handlers.delete(id);
}

export function onPlaybackStopped(listener: () => void): () => void {
  stopListeners.add(listener);
  return () => {
    stopListeners.delete(listener);
  };
}

function notifyPlaybackStopped(): void {
  for (const listener of stopListeners) {
    listener();
  }
}

export async function fadeOutAllPlayback(durationMs: number): Promise<void> {
  await Promise.all([...handlers.values()].map((handler) => handler.fadeOut(durationMs)));
}

export async function restoreAllPlaybackVolume(): Promise<void> {
  await Promise.all([...handlers.values()].map((handler) => handler.restoreVolume()));
}

export async function stopAllPlayback(): Promise<void> {
  const active = [...handlers.values()];
  await Promise.all(active.map((handler) => handler.stop()));
  resetBackgroundPlayback();
  notifyPlaybackStopped();
}
