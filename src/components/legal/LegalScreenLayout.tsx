import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PropsWithChildren, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/core/Screen";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { useAppTheme } from "@/src/theme";

type LegalScreenLayoutProps = PropsWithChildren<{
  title: string;
}>;

export function LegalScreenLayout({ title, children }: LegalScreenLayoutProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(20);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        topBar: {
          marginBottom: theme.spacing.sm,
        },
        backRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        backText: {
          ...theme.typography.body,
          color: theme.colors.sky,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.xs,
        },
        updated: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.md,
        },
        scroll: {
          flex: 1,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.sky} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.updated}>Last updated: May 24, 2026</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
      >
        {children}
      </ScrollView>
    </Screen>
  );
}
