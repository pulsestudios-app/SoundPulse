import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { linearFadeVolume } from "./fadeVolume";
import { retainBackgroundPlayback, releaseBackgroundPlayback } from "./backgroundPlayback";
import { registerPlaybackHandler, unregisterPlaybackHandler } from "./playbackRegistry";

const HANDLER_ID = "ai-preview";

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export { formatDuration as formatAudioDuration };

/**
 * Single looping preview for AI-generated soundscapes (remote URL).
 */
class AiPreviewPlayer {
  private sound: Audio.Sound | null = null;
  private url: string | null = null;
  private audioModeConfigured = false;
  private baseVolume = 1;
  private backgroundActive = false;

  private retainBackground(): void {
    if (!this.backgroundActive) {
      retainBackgroundPlayback("AI soundscape", "Generated preview");
      this.backgroundActive = true;
    }
  }

  private releaseBackground(): void {
    if (this.backgroundActive) {
      releaseBackgroundPlayback();
      this.backgroundActive = false;
    }
  }

  private register(): void {
    registerPlaybackHandler({
      id: HANDLER_ID,
      fadeOut: (durationMs) => this.fadeOut(durationMs),
      restoreVolume: () => this.restoreVolume(),
      stop: () => this.stop(),
    });
  }

  private unregister(): void {
    unregisterPlaybackHandler(HANDLER_ID);
  }

  private async ensureBackgroundAudioMode(): Promise<void> {
    if (this.audioModeConfigured) {
      return;
    }
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
    });
    this.audioModeConfigured = true;
  }

  async load(url: string): Promise<number> {
    await this.ensureBackgroundAudioMode();
    await this.unload();
    const { sound, status } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, isLooping: true, volume: 1 },
      undefined,
      true
    );
    this.sound = sound;
    this.url = url;
    if (status.isLoaded && typeof status.durationMillis === "number" && status.durationMillis > 0) {
      return status.durationMillis / 1000;
    }
    return 0;
  }

  async play(): Promise<void> {
    await this.ensureBackgroundAudioMode();
    await this.sound?.playAsync();
    this.register();
    this.retainBackground();
  }

  async pause(): Promise<void> {
    await this.sound?.pauseAsync();
    this.unregister();
    this.releaseBackground();
  }

  async toggle(url: string): Promise<boolean> {
    if (this.url !== url) {
      await this.load(url);
    }
    const status = await this.sound?.getStatusAsync();
    if (status?.isLoaded && status.isPlaying) {
      await this.pause();
      return false;
    }
    await this.play();
    return true;
  }

  async getDurationSeconds(): Promise<number> {
    const status = await this.sound?.getStatusAsync();
    if (status?.isLoaded && typeof status.durationMillis === "number") {
      return status.durationMillis / 1000;
    }
    return 0;
  }

  async isPlaying(): Promise<boolean> {
    const status = await this.sound?.getStatusAsync();
    return !!(status?.isLoaded && status.isPlaying);
  }

  async fadeOut(durationMs: number): Promise<void> {
    if (!this.sound) {
      return;
    }
    await linearFadeVolume(
      () => this.baseVolume,
      async (volume) => {
        await this.sound?.setVolumeAsync(volume);
      },
      durationMs
    );
  }

  async restoreVolume(): Promise<void> {
    if (!this.sound) {
      return;
    }
    try {
      await this.sound.setVolumeAsync(this.baseVolume);
    } catch {
      /* ignore */
    }
  }

  async stop(): Promise<void> {
    await this.unload();
  }

  async unload(): Promise<void> {
    this.unregister();
    this.releaseBackground();
    if (!this.sound) {
      this.url = null;
      return;
    }
    try {
      await this.sound.stopAsync();
    } catch {
      /* ignore */
    }
    try {
      await this.sound.unloadAsync();
    } catch {
      /* ignore */
    }
    this.sound = null;
    this.url = null;
    this.baseVolume = 1;
  }
}

export const aiPreviewPlayer = new AiPreviewPlayer();
