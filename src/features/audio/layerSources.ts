/**
 * Layer Mixer audio — remote loops loaded at runtime from jsDelivr (see /sounds/ in repo).
 * To add or update a sound: push MP3 to /sounds/ and add an entry here. No app rebuild needed.
 */
const BASE = "https://cdn.jsdelivr.net/gh/pulsestudios-app/SoundPulse@main/sounds/";

function layerUrl(fileName: string): string {
  return `${BASE}${encodeURIComponent(fileName)}`;
}

export type LayerAudioKey =
  | "rain"
  | "ocean"
  | "wind"
  | "fire"
  | "white"
  | "forest"
  | "train"
  | "siren"
  | "thunder"
  | "cricket"
  | "howl"
  | "shishi";

/** One loop per mixer layer — distinct files, label-accurate ambience. */
export const LAYER_AUDIO_URI: Record<LayerAudioKey, string> = {
  rain: layerUrl("rain.mp3"),
  ocean: layerUrl("ocean.mp3"),
  wind: layerUrl("wind.mp3"),
  fire: layerUrl("fire.mp3"),
  white: layerUrl("white.mp3"),
  forest: layerUrl("forest.mp3"),
  train: layerUrl("train.mp3"),
  siren: layerUrl("siren.mp3"),
  thunder: layerUrl("thunder.mp3"),
  cricket: layerUrl("cricket.mp3"),
  howl: layerUrl("howl.mp3"),
  shishi: layerUrl("shishi.mp3"),
};

export function getLayerAudioUri(key: string): string | null {
  if (key in LAYER_AUDIO_URI) {
    return LAYER_AUDIO_URI[key as LayerAudioKey];
  }
  return null;
}
