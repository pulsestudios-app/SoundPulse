import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useAppTheme } from "@/src/theme";
import {
  LOGO_PULSE_BAR_COUNT,
  LOGO_PULSE_BAR_PHASE,
  LOGO_PULSE_EASING,
  LOGO_PULSE_HOME_CONTAINER_HEIGHT,
  LOGO_PULSE_T_INCREMENT,
  LOGO_PULSE_TICK_MS,
  LOGO_PULSE_TIMING_MS,
  computePulseBarHeight,
} from "./logoPulseConstants";

function mixHex(cyanHex: string, purpleHex: string, t: number): string {
  const a = cyanHex.replace("#", "");
  const b = purpleHex.replace("#", "");
  const ai = parseInt(a, 16);
  const bi = parseInt(b, 16);
  const ar = (ai >> 16) & 0xff;
  const ag = (ai >> 8) & 0xff;
  const ab = ai & 0xff;
  const br = (bi >> 16) & 0xff;
  const bg = (bi >> 8) & 0xff;
  const bb = bi & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Animated waveform bars — same timing as StudyPulse HomeLogoPulse, cyan → purple gradient.
 */
export type HomeSoundPulseWaveProps = {
  animated?: boolean;
  isActive?: boolean;
};

export function HomeSoundPulseWave({ animated = true, isActive = false }: HomeSoundPulseWaveProps) {
  const theme = useAppTheme();
  const bars = useRef(
    Array.from({ length: LOGO_PULSE_BAR_COUNT }, () => new Animated.Value(28))
  ).current;
  const tRef = useRef(0);

  const barColors = useMemo(
    () =>
      Array.from({ length: LOGO_PULSE_BAR_COUNT }, (_, i) =>
        mixHex(
          theme.colors.sky,
          theme.colors.primary,
          LOGO_PULSE_BAR_COUNT <= 1 ? 0 : i / (LOGO_PULSE_BAR_COUNT - 1)
        )
      ),
    [theme.colors.sky, theme.colors.primary]
  );

  useEffect(() => {
    if (!animated) {
      bars.forEach((bar) => bar.setValue(28));
      return;
    }
    const tickMs = isActive ? 52 : LOGO_PULSE_TICK_MS;
    const id = setInterval(() => {
      tRef.current += isActive ? LOGO_PULSE_T_INCREMENT * 1.15 : LOGO_PULSE_T_INCREMENT * 0.62;
      const t = tRef.current;
      const extraWaveRange = isActive ? 12 : 3;
      bars.forEach((bar, idx) => {
        let wave = Math.sin(t + idx * LOGO_PULSE_BAR_PHASE) * 0.5 + 0.5;
        wave = Math.min(1, Math.max(0, wave));
        const height = computePulseBarHeight(wave, LOGO_PULSE_HOME_CONTAINER_HEIGHT + extraWaveRange);
        Animated.timing(bar, {
          toValue: height,
          duration: LOGO_PULSE_TIMING_MS,
          easing: LOGO_PULSE_EASING,
          useNativeDriver: false,
        }).start();
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [animated, isActive, bars]);

  return (
    <View style={[styles.wrap, { height: LOGO_PULSE_HOME_CONTAINER_HEIGHT }]}>
      <View style={styles.row}>
        {bars.map((bar, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.bar,
              {
                height: bar,
                backgroundColor: barColors[idx],
                opacity: isActive ? 0.92 : 0.85,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    justifyContent: "flex-end",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    gap: 3,
    paddingHorizontal: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 9999,
    minHeight: 12,
  },
});
