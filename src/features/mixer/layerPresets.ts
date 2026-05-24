import type { Ionicons } from "@expo/vector-icons";

export type LayerDef = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const LAYER_PRESETS: LayerDef[] = [
  { key: "rain", label: "Rain", icon: "rainy-outline" },
  { key: "ocean", label: "Ocean", icon: "water-outline" },
  { key: "wind", label: "Wind", icon: "cloud-outline" },
  { key: "fire", label: "Fireplace", icon: "flame-outline" },
  { key: "white", label: "White Noise", icon: "pulse-outline" },
  { key: "forest", label: "Forest", icon: "leaf-outline" },
  { key: "train", label: "Train", icon: "train-outline" },
  { key: "siren", label: "Siren", icon: "alert-outline" },
  { key: "thunder", label: "Thunder", icon: "flash-outline" },
  { key: "cricket", label: "Crickets", icon: "bug-outline" },
  { key: "howl", label: "Howl", icon: "moon-outline" },
  { key: "shishi", label: "Shishi-Odoshi", icon: "water-outline" },
];

export type LayerRowState = {
  volume: number;
  enabled: boolean;
};

export type SavedLayerSnapshot = {
  id: string;
  volume: number;
  enabled: boolean;
};

export function defaultLayerStates(): LayerRowState[] {
  return LAYER_PRESETS.map(() => ({ volume: 45, enabled: false }));
}

export function snapshotsFromLayerStates(states: LayerRowState[]): SavedLayerSnapshot[] {
  return LAYER_PRESETS.map((preset, index) => ({
    id: preset.key,
    volume: states[index]?.volume ?? 0,
    enabled: states[index]?.enabled ?? false,
  }));
}

export function layerStatesFromSnapshots(snapshots: SavedLayerSnapshot[]): LayerRowState[] {
  const byId = new Map(snapshots.map((row) => [row.id, row]));
  return LAYER_PRESETS.map((preset) => {
    const row = byId.get(preset.key);
    return {
      volume: row?.volume ?? 45,
      enabled: row?.enabled ?? false,
    };
  });
}

export function layerStatesForEngine(states: LayerRowState[]) {
  return LAYER_PRESETS.map((preset, index) => ({
    key: preset.key,
    volume: states[index]?.volume ?? 0,
    enabled: states[index]?.enabled ?? false,
  }));
}
