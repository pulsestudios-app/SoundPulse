import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

export default function LibraryScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          gap: theme.spacing.xl,
        },
        head: {
          gap: theme.spacing.sm,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
        },
        intro: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
        },
        listHint: {
          flex: 1,
          justifyContent: "center",
          paddingVertical: theme.spacing.xxl,
          paddingHorizontal: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}44`,
          gap: theme.spacing.md,
        },
        listTitle: {
          ...theme.typography.title,
          color: theme.colors.sky,
          textAlign: "center",
        },
        listBody: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.intro}>Your saved renders, presets, and downloaded layers.</Text>
        </View>

        <View style={styles.listHint}>
          <Text style={styles.listTitle}>Saved sounds</Text>
          <Text style={styles.listBody}>
            This area will host a searchable list / grid with play controls and overflow actions (rename,
            duplicate, export).
          </Text>
        </View>
      </View>
    </Screen>
  );
}
