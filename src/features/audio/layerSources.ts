/** Royalty-free ambience loops (StudyPulse public music bucket — same CDN pattern as focus engine). */
const MUSIC_PUBLIC_BASE =
  "https://uhfavszrclwwwnimxsbr.supabase.co/storage/v1/object/public/music/";

function musicFileUrl(fileName: string): string {
  return `${MUSIC_PUBLIC_BASE}${encodeURIComponent(fileName)}`;
}

export type LayerAudioKey = "rain" | "ocean" | "wind" | "fire" | "white" | "forest";

/** One loop per mixer layer — distinct files where possible. */
export const LAYER_AUDIO_URI: Record<LayerAudioKey, string> = {
  rain: musicFileUrl("rain ambience (1).mp3"),
  ocean: musicFileUrl("ocean waves (1).mp3"),
  wind: musicFileUrl("brown noise (2).mp3"),
  fire: musicFileUrl("cafe ambience (4).mp3"),
  white: musicFileUrl("white noise (1).mp3"),
  forest: musicFileUrl("rain ambience (5).mp3"),
};

export function getLayerAudioUri(key: string): string | null {
  if (key in LAYER_AUDIO_URI) {
    return LAYER_AUDIO_URI[key as LayerAudioKey];
  }
  return null;
}
