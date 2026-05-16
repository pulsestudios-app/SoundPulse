import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

/** Placeholder card for stacked sections */
function PlaceholderBlock({
  theme,
  label,
  body,
}: {
  theme: ReturnType<typeof useAppTheme>;
  label: string;
  body: string;
}) {
  const card = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}40`,
          padding: theme.spacing.lg,
          gap: theme.spacing.sm,
        },
        label: {
          ...theme.typography.caption,
          color: theme.colors.sky,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
        body: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
      }),
    [theme]
  );

  return (
    <View style={card.wrap}>
      <Text style={card.label}>{label}</Text>
      <Text style={card.body}>{body}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollGap: {
          flex: 1,
          gap: theme.spacing.xl,
        },
        head: {
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
        },
        ledge: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
        },
        sectionTitle: {
          ...theme.typography.title,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.scrollGap}>
        <View style={styles.head}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.ledge}>Featured soundscapes, curated categories, and quick entry points.</Text>
        </View>

        <Text style={styles.sectionTitle}>Featured today</Text>
        <PlaceholderBlock
          theme={theme}
          label="Featured row"
          body="Carousel of highlighted soundscapes will appear here (cover art, duration, vibe tags)."
        />

        <Text style={styles.sectionTitle}>Browse by mood</Text>
        <PlaceholderBlock
          theme={theme}
          label="Category grid"
          body="Relax · Focus · Sleep · Nature — tapping a pill filters the catalogue below."
        />
      </View>
    </Screen>
  );
}
