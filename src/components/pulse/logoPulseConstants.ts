import { Easing } from "react-native";

export const LOGO_PULSE_BAR_COUNT = 20;
export const LOGO_PULSE_TICK_MS = 90;
export const LOGO_PULSE_T_INCREMENT = 0.11;
export const LOGO_PULSE_BAR_PHASE = 0.38;
export const LOGO_PULSE_MIN_BAR = 18;
export const LOGO_PULSE_TIMING_MS = 90;
export const LOGO_PULSE_EASING = Easing.out(Easing.quad);

export const LOGO_PULSE_HOME_CONTAINER_HEIGHT = 80;

export function computePulseBarHeight(wave: number, containerHeight: number): number {
  return LOGO_PULSE_MIN_BAR + wave * (containerHeight - 22);
}
