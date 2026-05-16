import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { radius } from "@/src/theme/radius";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";
import { colorsDark, colorsLight, type ThemePalette } from "@/src/theme/palettes";

const STORAGE_KEY = "soundpulse-theme-mode";
/** Legacy / human-readable mirror for profile & tooling (`"true"` = dark). */
const DARK_MODE_MIRROR_KEY = "darkMode";

export type ColorScheme = "light" | "dark";

export type AppThemeValue = {
  colors: ThemePalette;
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
};

type ThemePreferenceContextValue = {
  mode: ColorScheme;
  setMode: (mode: ColorScheme) => void;
  toggleColorScheme: () => void;
  theme: AppThemeValue;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ColorScheme>("dark");

  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
          setModeState(stored);
          return;
        }
        const legacyDark = await AsyncStorage.getItem(DARK_MODE_MIRROR_KEY);
        if (legacyDark === "true") {
          setModeState("dark");
        } else if (legacyDark === "false") {
          setModeState("light");
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const setMode = useCallback((next: ColorScheme) => {
    setModeState(next);
    void AsyncStorage.multiSet([
      [STORAGE_KEY, next],
      [DARK_MODE_MIRROR_KEY, next === "dark" ? "true" : "false"],
    ]).catch(() => undefined);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setModeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      void AsyncStorage.multiSet([
        [STORAGE_KEY, next],
        [DARK_MODE_MIRROR_KEY, next === "dark" ? "true" : "false"],
      ]).catch(() => undefined);
      return next;
    });
  }, []);

  const theme = useMemo<AppThemeValue>(
    () => ({
      colors: mode === "light" ? colorsLight : colorsDark,
      radius,
      spacing,
      typography,
    }),
    [mode]
  );

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleColorScheme,
      theme,
    }),
    [mode, setMode, theme, toggleColorScheme]
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference(): ThemePreferenceContextValue {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error("useThemePreference must be used within ThemePreferenceProvider");
  }
  return ctx;
}

/** Convenience: current resolved theme object (colors, spacing, typography). */
export function useAppTheme(): AppThemeValue {
  return useThemePreference().theme;
}
