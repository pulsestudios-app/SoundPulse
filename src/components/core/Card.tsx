import { PropsWithChildren, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { useAppTheme } from "@/src/theme";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: CardProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
        },
      }),
    [theme]
  );

  return <View style={[styles.card, style]}>{children}</View>;
}
