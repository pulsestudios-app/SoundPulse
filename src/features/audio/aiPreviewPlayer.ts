import { Audio } from "expo-av";

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

  async load(url: string): Promise<number> {
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
    await this.sound?.playAsync();
  }

  async pause(): Promise<void> {
    await this.sound?.pauseAsync();
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

  async unload(): Promise<void> {
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
  }
}

export const aiPreviewPlayer = new AiPreviewPlayer();
