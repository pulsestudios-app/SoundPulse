import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AppThemeValue } from "@/src/theme";

export type ResultsToastProps = {
  visible: boolean;
  message: string;
  opacityAnim: Animated.Value;
  theme: AppThemeValue;
};

export function ResultsToast({ visible, message, opacityAnim, theme }: ResultsToastProps) {
  if (!visible) {
    return null;
  }
  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: opacityAnim,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.textPrimary }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "92%",
    zIndex: 9999,
    elevation: 12,
  },
  text: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
