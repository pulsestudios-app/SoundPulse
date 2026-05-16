export const typography = {
  header: {
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  mono: {
    fontSize: 13,
    fontWeight: "500" as const,
    fontFamily: "monospace",
  },
} as const;
