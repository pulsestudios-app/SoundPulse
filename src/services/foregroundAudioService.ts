import { LegacyEventEmitter, requireNativeModule } from "expo-modules-core";
import { NativeEventEmitter, Platform } from "react-native";

interface PulseAudioModule {
  startPlayback?: (title: string, subtitle: string) => void;
  stopPlayback?: () => void;
  startMusic?: (title: string, artist: string, url: string, durationMs: number, playbackQueueJson?: string | null) => void;
  stopMusic?: () => void;
  addListener?(eventName: string): void;
  removeListeners?(count: number): void;
}

let PulseAudio: PulseAudioModule | null = null;

try {
  PulseAudio = requireNativeModule<PulseAudioModule>("PulseAudio");
} catch (e: unknown) {
  console.warn("[ForegroundAudioService] PulseAudio native module not available:", e);
}

async function invokeNative(fn: (() => void) | undefined): Promise<void> {
  await Promise.resolve();
  fn?.();
}

let activeSessions = 0;

export const ForegroundAudioService = {
  startPlayback: (title: string, subtitle: string) =>
    invokeNative(() => {
      if (Platform.OS !== "android") {
        return;
      }
      if (PulseAudio?.startPlayback) {
        PulseAudio.startPlayback(title, subtitle);
      } else {
        PulseAudio?.startMusic?.(title, subtitle, "", 0, null);
      }
    }),

  stopPlayback: () =>
    invokeNative(() => {
      if (Platform.OS !== "android") {
        return;
      }
      if (PulseAudio?.stopPlayback) {
        PulseAudio.stopPlayback();
      } else {
        PulseAudio?.stopMusic?.();
      }
    }),

  /** Reference-counted helper for multiple simultaneous expo-av streams. */
  retainPlaybackSession: (title: string, subtitle: string) => {
    activeSessions += 1;
    if (activeSessions === 1) {
      void ForegroundAudioService.startPlayback(title, subtitle);
    }
  },

  releasePlaybackSession: () => {
    activeSessions = Math.max(0, activeSessions - 1);
    if (activeSessions === 0) {
      void ForegroundAudioService.stopPlayback();
    }
  },

  resetPlaybackSessions: () => {
    activeSessions = 0;
    void ForegroundAudioService.stopPlayback();
  },

  startMusic: (title: string, artist: string, url: string, durationMs: number, playbackQueueJson?: string) =>
    invokeNative(() => PulseAudio?.startMusic?.(title, artist, url, durationMs, playbackQueueJson ?? null)),

  stopMusic: () => invokeNative(() => PulseAudio?.stopMusic?.()),
};

export const PulseAudioEvents = (
  PulseAudio
    ? new LegacyEventEmitter(PulseAudio as unknown as ConstructorParameters<typeof LegacyEventEmitter>[0])
    : new NativeEventEmitter()
) as NativeEventEmitter;
