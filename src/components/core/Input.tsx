import { useMemo } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

import { useAppTheme } from "@/src/theme";

export function Input({ style, ...props }: TextInputProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        input: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          color: theme.colors.textPrimary,
          paddingHorizontal: theme.spacing.lg,
          minHeight: 48,
        },
      }),
    [theme]
  );

  return (
    <TextInput
      placeholderTextColor={theme.colors.textSecondary}
      style={[styles.input, style]}
      {...props}
    />
  );
}
