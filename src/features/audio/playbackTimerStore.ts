import { create } from "zustand";

import {
  fadeOutAllPlayback,
  restoreAllPlaybackVolume,
  stopAllPlayback,
} from "./playbackRegistry";

export const FADE_OUT_MS = 30_000;

export type PlaybackTimerPhase = "idle" | "running" | "fading";

export function formatTimerRemaining(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;
let fadeAbort = false;

function clearTickInterval(): void {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

type PlaybackTimerState = {
  phase: PlaybackTimerPhase;
  remainingSeconds: number;
  endsAtMs: number | null;
  pickerVisible: boolean;
  openPicker: () => void;
  closePicker: () => void;
  startTimer: (minutes: number) => void;
  cancelTimer: () => Promise<void>;
  tick: () => void;
  beginFadeOut: () => Promise<void>;
  reset: () => void;
};

export const usePlaybackTimerStore = create<PlaybackTimerState>((set, get) => ({
  phase: "idle",
  remainingSeconds: 0,
  endsAtMs: null,
  pickerVisible: false,

  openPicker: () => set({ pickerVisible: true }),

  closePicker: () => set({ pickerVisible: false }),

  startTimer: (minutes: number) => {
    const safeMinutes = Math.min(24 * 60, Math.max(1, Math.floor(minutes)));
    const endsAtMs = Date.now() + safeMinutes * 60 * 1000;
    fadeAbort = false;
    clearTickInterval();
    set({
      phase: "running",
      remainingSeconds: safeMinutes * 60,
      endsAtMs,
      pickerVisible: false,
    });
    tickInterval = setInterval(() => {
      get().tick();
    }, 1000);
  },

  cancelTimer: async () => {
    fadeAbort = true;
    clearTickInterval();
    const { phase } = get();
    if (phase === "fading") {
      await restoreAllPlaybackVolume();
    }
    get().reset();
  },

  tick: () => {
    const { phase, endsAtMs } = get();
    if (phase !== "running" || endsAtMs === null) {
      return;
    }
    const remaining = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
    set({ remainingSeconds: remaining });
    if (remaining <= 0) {
      void get().beginFadeOut();
    }
  },

  beginFadeOut: async () => {
    clearTickInterval();
    if (get().phase === "fading") {
      return;
    }
    fadeAbort = false;
    set({ phase: "fading", remainingSeconds: 0 });
    try {
      await fadeOutAllPlayback(FADE_OUT_MS);
      if (!fadeAbort) {
        await stopAllPlayback();
      }
    } catch (e) {
      console.error("[PlaybackTimer] fade/stop failed:", e);
    } finally {
      if (!fadeAbort) {
        get().reset();
      }
    }
  },

  reset: () => {
    clearTickInterval();
    fadeAbort = false;
    set({
      phase: "idle",
      remainingSeconds: 0,
      endsAtMs: null,
      pickerVisible: false,
    });
  },
}));
