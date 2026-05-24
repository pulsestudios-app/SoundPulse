import { sanitizeSoundTitle } from "@/src/lib/sanitize";
import { supabase } from "@/src/lib/supabase";

import type { SavedLayerSnapshot } from "./layerPresets";

export type SavedMixRow = {
  id: string;
  user_id: string;
  name: string;
  layers: SavedLayerSnapshot[];
  created_at: string | null;
};

export async function fetchUserSavedMixes(userId: string): Promise<SavedMixRow[]> {
  const { data, error } = await supabase
    .from("saved_mixes")
    .select("id,user_id,name,layers,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...row,
    layers: (row.layers ?? []) as SavedLayerSnapshot[],
  })) as SavedMixRow[];
}

export async function saveUserMix(input: {
  userId: string;
  name: string;
  layers: SavedLayerSnapshot[];
}): Promise<SavedMixRow> {
  const { data, error } = await supabase
    .from("saved_mixes")
    .insert({
      user_id: input.userId,
      name: sanitizeSoundTitle(input.name),
      layers: input.layers,
    })
    .select("id,user_id,name,layers,created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save mix.");
  }

  return {
    ...data,
    layers: (data.layers ?? []) as SavedLayerSnapshot[],
  } as SavedMixRow;
}

export async function deleteSavedMix(userId: string, mixId: string): Promise<void> {
  const { error } = await supabase.from("saved_mixes").delete().eq("id", mixId).eq("user_id", userId);
  if (error) {
    throw new Error(error.message);
  }
}
