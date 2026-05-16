import { PropsWithChildren, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/theme";

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function Screen({ children, padded = true }: ScreenProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        content: {
          flex: 1,
        },
        padded: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
        },
      }),
    [theme]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="light" />
      <View style={[styles.content, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}
