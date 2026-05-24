import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useAppTheme } from "@/src/theme";

export function useLegalTextStyles() {
  const theme = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        h2: {
          ...theme.typography.title,
          color: theme.colors.lime,
          marginTop: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        },
        p: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.md,
          lineHeight: 24,
        },
        bullet: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.sm,
          marginLeft: theme.spacing.md,
          lineHeight: 24,
        },
        link: {
          color: theme.colors.sky,
          fontWeight: "600" as const,
        },
      }),
    [theme]
  );
}
