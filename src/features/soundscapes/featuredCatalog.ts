export type FeaturedSoundscape = {
  id: string;
  title: string;
  mood: string;
  durationSec: number;
};

export const FEATURED_SOUNDSCAPES: FeaturedSoundscape[] = [
  { id: "aurora-soft", title: "Aurora Soft Wash", mood: "Sleep", durationSec: 1920 },
  { id: "train-dusk", title: "Train Rhythm · Dusk", mood: "Urban", durationSec: 1445 },
  { id: "jungle-canopy", title: "High Canopy Cicadas", mood: "Nature", durationSec: 2100 },
  { id: "zen-bells", title: "Temple Bells Minimal", mood: "Meditation", durationSec: 900 },
  { id: "rain-nordic", title: "Nordic Rain + Boiler Room", mood: "Nature", durationSec: 1680 },
  { id: "focus-hum", title: "Low Brown Noise Hum", mood: "Focus", durationSec: 3600 },
  { id: "waves-distant", title: "Distant Ocean Swell", mood: "Sleep", durationSec: 2400 },
  { id: "city-quiet", title: "After-Hours Subway Drone", mood: "Urban", durationSec: 1320 },
];

export function pickRandomFeatured(): FeaturedSoundscape {
  const i = Math.floor(Math.random() * FEATURED_SOUNDSCAPES.length);
  return FEATURED_SOUNDSCAPES[i]!;
}
