import { layerMixerEngine } from "@/src/features/audio/layerMixerEngine";
import { libraryPlayer } from "@/src/features/audio/libraryPlayer";
import {
  layerStatesForEngine,
  layerStatesFromSnapshots,
  type SavedLayerSnapshot,
} from "@/src/features/mixer/layerPresets";

export async function toggleCommunityMixPlayback(
  soundId: string,
  snapshots: SavedLayerSnapshot[],
  activeSoundId: string | null
): Promise<boolean> {
  if (activeSoundId === soundId && layerMixerEngine.isPlaying()) {
    await layerMixerEngine.stopMix();
    return false;
  }

  await libraryPlayer.stop();
  if (layerMixerEngine.isPlaying()) {
    await layerMixerEngine.stopMix();
  }

  const layers = layerStatesForEngine(layerStatesFromSnapshots(snapshots));
  if (!layers.some((layer) => layer.enabled)) {
    throw new Error("This mix has no enabled layers.");
  }

  await layerMixerEngine.playMix(layers);
  return layerMixerEngine.isPlaying();
}
