import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { linearFadeVolume } from "./fadeVolume";
import { registerPlaybackHandler, unregisterPlaybackHandler } from "./playbackRegistry";

const HANDLER_ID = "library";

/**
 * Single-track playback for saved library soundscapes.
 */
class LibraryPlayer {
  private sound: Audio.Sound | null = null;
  private activeSoundId: string | null = null;
  private baseVolume = 1;
  private audioModeConfigured = false;

  getActiveSoundId(): string | null {
    return this.activeSoundId;
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

  async isPlaying(): Promise<boolean> {
    if (!this.sound) {
      return false;
    }
    const status = await this.sound.getStatusAsync();
    return !!(status.isLoaded && status.isPlaying);
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
    const sound = this.sound;
    this.sound = null;
    this.activeSoundId = null;
    this.baseVolume = 1;
    this.unregister();
    if (!sound) {
      return;
    }
    try {
      await sound.stopAsync();
    } catch {
      /* ignore */
    }
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
  }

  async unload(): Promise<void> {
    await this.stop();
  }

  async toggle(
    soundId: string,
    url: string,
    onFinish?: () => void
  ): Promise<{ playing: boolean; loading: boolean }> {
    if (!url) {
      throw new Error("This sound does not have a playable URL yet.");
    }

    if (this.activeSoundId === soundId && this.sound) {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.sound.pauseAsync();
        this.unregister();
        return { playing: false, loading: false };
      }
      await this.ensureBackgroundAudioMode();
      await this.sound.playAsync();
      this.register();
      return { playing: true, loading: false };
    }

    await this.stop();

    await this.ensureBackgroundAudioMode();
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, isLooping: true, volume: this.baseVolume },
      (status) => {
        if (status.isLoaded && status.didJustFinish) {
          onFinish?.();
          void this.stop();
        }
      },
      true
    );
    this.sound = sound;
    this.activeSoundId = soundId;
    this.register();
    return { playing: true, loading: false };
  }
}

export const libraryPlayer = new LibraryPlayer();
