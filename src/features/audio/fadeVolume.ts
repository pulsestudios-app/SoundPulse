export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function linearFadeVolume(
  getBaseVolume: () => number,
  setVolume: (volume: number) => Promise<void>,
  durationMs: number,
  steps = 30
): Promise<void> {
  const base = getBaseVolume();
  if (base <= 0) {
    return;
  }
  const stepMs = durationMs / steps;
  for (let step = steps; step >= 0; step -= 1) {
    await setVolume(base * (step / steps));
    if (step > 0) {
      await sleep(stepMs);
    }
  }
}
