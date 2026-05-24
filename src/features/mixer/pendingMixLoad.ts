import type { SavedLayerSnapshot } from "./layerPresets";

let pendingLayers: SavedLayerSnapshot[] | null = null;

export function setPendingMixLoad(layers: SavedLayerSnapshot[]): void {
  pendingLayers = layers;
}

export function consumePendingMixLoad(): SavedLayerSnapshot[] | null {
  const next = pendingLayers;
  pendingLayers = null;
  return next;
}
