/** Dark palette (default app look). SoundPulse brand. */
export const colorsDark = {
  background: "#0A0A0F",
  surface: "#12121A",
  border: "#1E1E2A",
  /** Primary CTA / accent — purple (aliases legacy `lime` slot in migrated UI components). */
  primary: "#7C3AED",
  lime: "#7C3AED",
  /** Links / highlights — cyan. */
  sky: "#06B6D4",
  /** Shorthand compatible with older `colors.secondary` usages. */
  secondary: "#06B6D4",
  /** Shorthand compatible with older `colors.text` usages (tabs). */
  text: "#FFFFFF",
  yellow: "#FFD93D",
  coral: "#FF6F61",
  textPrimary: "#FFFFFF",
  textSecondary: "#B3B3B3",
} as const;

/** Light palette — accents match brand primaries. */
export const colorsLight = {
  background: "#F5F5F5",
  surface: "#FFFFFF",
  border: "#E0E0E0",
  primary: "#7C3AED",
  lime: "#7C3AED",
  sky: "#06B6D4",
  secondary: "#06B6D4",
  text: "#1A1A1A",
  yellow: "#FFD93D",
  coral: "#FF6F61",
  textPrimary: "#1A1A1A",
  textSecondary: "#5C5C5C",
} as const;

export type ThemePalette = typeof colorsDark | typeof colorsLight;
