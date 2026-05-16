import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

export default function GenerateScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
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
        mixer: {
          flex: 1,
          minHeight: 180,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          padding: theme.spacing.xl,
          justifyContent: "center",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        mixerLabel: {
          ...theme.typography.caption,
          color: theme.colors.sky,
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        mixerHint: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
        },
        promptPlaceholder: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          textAlign: "center",
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}33`,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.title}>Generate</Text>
          <Text style={styles.intro}>Describe an ambience — then blend stems with the layer mixer.</Text>
        </View>

        <Text style={styles.promptPlaceholder}>
          AI prompt … (e.g. “gentle rain on a tent + distant thunder, lo-fi hiss”)
        </Text>

        <View style={styles.mixer}>
          <Text style={styles.mixerLabel}>Layer mixer</Text>
          <Text style={styles.mixerHint}>Volume faders · mute/solo · per-layer FX — UI shell only for now.</Text>
        </View>
      </View>
    </Screen>
  );
}
