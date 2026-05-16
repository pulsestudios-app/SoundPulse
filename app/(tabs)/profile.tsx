import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

export default function ProfileScreen() {
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
        subscription: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          padding: theme.spacing.xl,
          gap: theme.spacing.sm,
        },
        subHeading: {
          ...theme.typography.title,
          color: theme.colors.primary,
        },
        subNote: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        settings: {
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        row: {
          ...theme.typography.body,
          color: theme.colors.textPrimary,
          paddingVertical: theme.spacing.sm,
        },
        rowMuted: {
          ...theme.typography.caption,
          color: theme.colors.sky,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.intro}>Subscription status and app settings.</Text>
        </View>

        <View style={styles.subscription}>
          <Text style={styles.subHeading}>Subscription</Text>
          <Text style={styles.subNote}>
            Tier badge, renewal date, and manage / restore purchase actions will anchor this card.
          </Text>
          <Text style={styles.rowMuted}>Placeholder: Free tier</Text>
        </View>

        <View style={styles.settings}>
          <Text style={[styles.row, { fontWeight: "700", color: theme.colors.textPrimary }]}>Settings</Text>
          <Text style={styles.row}>Account · notifications · audio quality</Text>
          <Text style={styles.rowMuted}>Rows will navigate to detailed screens.</Text>
        </View>
      </View>
    </Screen>
  );
}
