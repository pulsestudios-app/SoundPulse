import { colorsDark } from "./palettes";
import { radius } from "./radius";
import { spacing } from "./spacing";
import { typography } from "./typography";

/** Static dark theme for rare non-React contexts; prefer useAppTheme() in components. */
export const theme = {
  colors: colorsDark,
  radius,
  spacing,
  typography,
} as const;

export type AppTheme = typeof theme;

/** Static dark palette alias for imports like `from "@/src/theme"`. Prefer useAppTheme() in screens. */
export { colors } from "./colors";
export { colorsDark, colorsLight } from "./palettes";
export type { ThemePalette } from "./palettes";
export { ThemePreferenceProvider, useAppTheme, useThemePreference } from "./ThemePreferenceProvider";
export type { AppThemeValue, ColorScheme } from "./ThemePreferenceProvider";
