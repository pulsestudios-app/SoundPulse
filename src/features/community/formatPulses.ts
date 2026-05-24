/** Format pulse count for UI — always uses "Pulse(s)", never "Like(s)". */
export function formatPulseCount(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n >= 1_000_000) {
    const value = n / 1_000_000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, "")}M Pulses`;
  }
  if (n >= 1000) {
    const value = n / 1000;
    return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, "")}k Pulses`;
  }
  if (n === 1) {
    return "1 Pulse";
  }
  return `${n} Pulses`;
}
