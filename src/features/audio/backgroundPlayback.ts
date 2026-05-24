import { ForegroundAudioService } from "@/src/services/foregroundAudioService";

export function retainBackgroundPlayback(title: string, subtitle = "Playing in SoundPulse"): void {
  ForegroundAudioService.retainPlaybackSession(title, subtitle);
}

export function releaseBackgroundPlayback(): void {
  ForegroundAudioService.releasePlaybackSession();
}

export function resetBackgroundPlayback(): void {
  ForegroundAudioService.resetPlaybackSessions();
}
