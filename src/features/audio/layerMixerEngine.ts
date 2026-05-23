import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

import { linearFadeVolume, sleep } from "./fadeVolume";
import { getLayerAudioUri } from "./layerSources";
import { registerPlaybackHandler, unregisterPlaybackHandler } from "./playbackRegistry";

const HANDLER_ID = "layer-mixer";

export type LayerMixerLayerState = {
  key: string;
  volume: number;
  enabled: boolean;
};

function volumeGain(percent: number): number {
  return Math.min(1, Math.max(0, percent / 100));
}

/**
 * Simultaneous looping layers — patterns from StudyPulse {@link AmbientEngine} + {@link queueEngine.ensureBackgroundPlaybackMode}.
 */
class LayerMixerEngine {
  private sounds = new Map<string, Audio.Sound>();
  private baseVolumes = new Map<string, number>();
  private audioModeConfigured = false;
  private playing = false;

  private register(): void {
    registerPlaybackHandler({
      id: HANDLER_ID,
      fadeOut: (durationMs) => this.fadeOut(durationMs),
      restoreVolume: () => this.restoreVolume(),
      stop: () => this.stopMix(),
    });
  }

  private unregister(): void {
    unregisterPlaybackHandler(HANDLER_ID);
  }

  isPlaying(): boolean {
    return this.playing;
  }

  async ensureAudioMode(): Promise<void> {
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

  private async unloadLayer(key: string): Promise<void> {
    const sound = this.sounds.get(key);
    if (!sound) {
      return;
    }
    this.sounds.delete(key);
    this.baseVolumes.delete(key);
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

  async setLayerVolume(key: string, volumePercent: number): Promise<void> {
    const sound = this.sounds.get(key);
    if (!sound) {
      return;
    }
    try {
      await sound.setVolumeAsync(volumeGain(volumePercent));
      this.baseVolumes.set(key, volumeGain(volumePercent));
    } catch {
      /* ignore */
    }
  }

  async startLayer(key: string, volumePercent: number): Promise<void> {
    const uri = getLayerAudioUri(key);
    if (!uri) {
      console.warn("[LayerMixer] No URI for layer:", key);
      return;
    }
    await this.unloadLayer(key);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          isLooping: true,
          volume: volumeGain(volumePercent),
        },
        undefined,
        true
      );
      this.sounds.set(key, sound);
      this.baseVolumes.set(key, volumeGain(volumePercent));
    } catch (e) {
      console.error("[LayerMixer] Failed to load layer:", key, e);
    }
  }

  async stopLayer(key: string): Promise<void> {
    await this.unloadLayer(key);
  }

  async playMix(layers: LayerMixerLayerState[]): Promise<void> {
    await this.ensureAudioMode();
    const enabled = layers.filter((l) => l.enabled);
    if (enabled.length === 0) {
      return;
    }
    await Promise.all(enabled.map((l) => this.startLayer(l.key, l.volume)));
    this.playing = this.sounds.size > 0;
    if (this.playing) {
      this.register();
    }
  }

  async fadeOut(durationMs: number): Promise<void> {
    const entries = [...this.sounds.entries()];
    if (entries.length === 0) {
      return;
    }
    const steps = 30;
    const stepMs = durationMs / steps;
    for (let step = steps; step >= 0; step -= 1) {
      const factor = step / steps;
      await Promise.all(
        entries.map(async ([key, sound]) => {
          const base = this.baseVolumes.get(key) ?? 1;
          try {
            await sound.setVolumeAsync(base * factor);
          } catch {
            /* ignore */
          }
        })
      );
      if (step > 0) {
        await sleep(stepMs);
      }
    }
  }

  async restoreVolume(): Promise<void> {
    await Promise.all(
      [...this.sounds.entries()].map(async ([key, sound]) => {
        const base = this.baseVolumes.get(key) ?? 1;
        try {
          await sound.setVolumeAsync(base);
        } catch {
          /* ignore */
        }
      })
    );
  }

  async stopMix(): Promise<void> {
    this.unregister();
    const keys = [...this.sounds.keys()];
    await Promise.all(keys.map((k) => this.unloadLayer(k)));
    this.playing = false;
  }

  /** While mix is playing: apply enable/volume changes for a single layer. */
  async applyLayerChange(layer: LayerMixerLayerState): Promise<void> {
    if (!this.playing) {
      return;
    }
    const loaded = this.sounds.has(layer.key);
    if (layer.enabled) {
      if (loaded) {
        await this.setLayerVolume(layer.key, layer.volume);
      } else {
        await this.startLayer(layer.key, layer.volume);
      }
    } else if (loaded) {
      await this.stopLayer(layer.key);
    }
  }
}

export const layerMixerEngine = new LayerMixerEngine();
