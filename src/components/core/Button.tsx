import { useMemo } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/src/theme";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  onPress?: () => void;
  disabled?: boolean;
  /** Lime shadow glow (primary only). */
  premiumGlow?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = "primary",
  onPress,
  disabled = false,
  premiumGlow = false,
  style,
}: ButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: 48,
          borderRadius: theme.radius.lg,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing.lg,
          borderWidth: 1,
        },
        disabled: {
          opacity: 0.5,
        },
        primary: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        secondary: {
          backgroundColor: "transparent",
          borderColor: theme.colors.border,
        },
        label: {
          fontSize: theme.typography.body.fontSize,
          fontWeight: "700",
        },
        labelPrimary: {
          color: "#FFFFFF",
        },
        labelSecondary: {
          color: theme.colors.textPrimary,
        },
        glow: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 8,
        },
      }),
    [theme]
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        variant === "primary" ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        variant === "primary" && premiumGlow && styles.glow,
        style,
      ]}
    >
      <Text style={[styles.label, variant === "primary" ? styles.labelPrimary : styles.labelSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}
