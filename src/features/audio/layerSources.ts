/**
 * Layer Mixer audio — royalty-free loops that match each layer label.
 * Files live in assets/sounds/layers/ (see ATTRIBUTION.md).
 *
 * Served via jsDelivr from this repo. To self-host on SoundPulse Supabase instead:
 * upload MP3s to a public bucket (e.g. `soundscapes/layers/`) and point URLs there.
 */
const LAYER_CDN_BASE =
  "https://cdn.jsdelivr.net/gh/florianbelice4-bit/SoundPulse@master/assets/sounds/layers";

function layerUrl(fileName: string): string {
  return `${LAYER_CDN_BASE}/${encodeURIComponent(fileName)}`;
}

export type LayerAudioKey = "rain" | "ocean" | "wind" | "fire" | "white" | "forest";

/** One loop per mixer layer — distinct files, label-accurate ambience. */
export const LAYER_AUDIO_URI: Record<LayerAudioKey, string> = {
  rain: layerUrl("rain.mp3"),
  ocean: layerUrl("ocean.mp3"),
  wind: layerUrl("wind.mp3"),
  fire: layerUrl("fire.mp3"),
  white: layerUrl("white.mp3"),
  forest: layerUrl("forest.mp3"),
};

export function getLayerAudioUri(key: string): string | null {
  if (key in LAYER_AUDIO_URI) {
    return LAYER_AUDIO_URI[key as LayerAudioKey];
  }
  return null;
}
