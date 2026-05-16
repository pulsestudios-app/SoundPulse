import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Card } from "@/src/components/core/Card";
import { Screen } from "@/src/components/core/Screen";
import { HomeSoundPulseWave } from "@/src/components/pulse/HomeSoundPulseWave";
import { pickRandomFeatured, type FeaturedSoundscape } from "@/src/features/soundscapes/featuredCatalog";
import { loadRecentPlays, recordRecentPlay, type RecentPlay } from "@/src/features/soundscapes/recentPlays";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { useAppTheme } from "@/src/theme";

const MOODS = [
  { key: "sleep", emoji: "😴", label: "Sleep" },
  { key: "focus", emoji: "🎯", label: "Focus" },
  { key: "meditation", emoji: "🧘", label: "Meditation" },
  { key: "nature", emoji: "🌧", label: "Nature" },
  { key: "urban", emoji: "🏙", label: "Urban" },
] as const;

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(28);
  const greeting = greetingForHour(new Date().getHours());
  const [featured, setFeatured] = useState<FeaturedSoundscape>(() => pickRandomFeatured());
  const [recent, setRecent] = useState<RecentPlay[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecentPlays(3)
        .then(setRecent)
        .catch(() => setRecent([]));
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setFeatured(pickRandomFeatured());
    loadRecentPlays(3)
      .then(setRecent)
      .catch(() => setRecent([]))
      .finally(() => setRefreshing(false));
  }, []);

  const onPlayFeatured = useCallback(() => {
    void recordRecentPlay({
      id: featured.id,
      name: featured.title,
      durationSec: featured.durationSec,
    }).then(() => loadRecentPlays(3).then(setRecent));
  }, [featured.durationSec, featured.id, featured.title]);

  const onPlayRecent = useCallback((play: RecentPlay) => {
    void recordRecentPlay({
      id: play.id,
      name: play.name,
      durationSec: play.durationSec,
    }).then(() => loadRecentPlays(3).then(setRecent));
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          flexGrow: 1,
          gap: theme.spacing.xl,
        },
        pulseWrap: {
          width: "100%",
          marginTop: theme.spacing.xs,
        },
        wordmarkRow: {
          alignItems: "center",
          gap: theme.spacing.xs,
          marginBottom: theme.spacing.xs,
        },
        wordmark: {
          fontSize: 32,
          fontWeight: "800",
          letterSpacing: -0.5,
          color: theme.colors.textPrimary,
          textAlign: "center",
        },
        greeting: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
          marginBottom: theme.spacing.sm,
        },
        sectionHeading: {
          ...theme.typography.title,
          color: theme.colors.primary,
          marginBottom: theme.spacing.sm,
        },
        secondaryLabel: {
          ...theme.typography.caption,
          color: `${theme.colors.sky}cc`,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: theme.spacing.sm,
        },
        featuredOuter: {
          borderRadius: theme.radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
        },
        featuredGradient: {
          padding: theme.spacing.xl,
        },
        featuredRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        featuredMeta: {
          flex: 1,
          gap: 4,
        },
        featuredEyebrow: {
          ...theme.typography.caption,
          color: `${theme.colors.textPrimary}b3`,
          textTransform: "uppercase",
          letterSpacing: 1,
          fontWeight: "700",
        },
        featuredTitle: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 20,
        },
        featuredSub: {
          ...theme.typography.body,
          color: `${theme.colors.textPrimary}aa`,
          fontSize: 14,
          lineHeight: 20,
        },
        playFab: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.surface,
          borderWidth: 2,
          borderColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: theme.colors.sky,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        },
        moodScrollContent: {
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          paddingRight: theme.spacing.md,
        },
        moodChip: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}44`,
          backgroundColor: `${theme.colors.surface}ee`,
        },
        moodEmoji: {
          fontSize: 18,
        },
        moodLabel: {
          ...theme.typography.body,
          fontWeight: "700",
          color: theme.colors.textPrimary,
          fontSize: 15,
        },
        recentList: {
          gap: theme.spacing.sm,
        },
        recentRow: {
          borderWidth: 1,
          borderColor: `${theme.colors.sky}33`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        recentPressed: {
          opacity: 0.92,
        },
        recentTextWrap: {
          flex: 1,
          gap: 4,
        },
        recentName: {
          ...theme.typography.body,
          fontWeight: "700",
          color: theme.colors.textPrimary,
        },
        recentMeta: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
        },
        recentPlayBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.background}99`,
        },
        emptyRecent: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
      }),
    [theme]
  );

  const gradientColors = [
    `${theme.colors.primary}2a`,
    `${theme.colors.sky}26`,
    theme.colors.surface,
  ] as const;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary, theme.colors.sky]}
          />
        }
      >
        <View style={styles.pulseWrap}>
          <HomeSoundPulseWave />
        </View>

        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>SoundPulse</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>

        <View>
          <Text style={styles.secondaryLabel}>Quick play</Text>
          <View style={styles.featuredOuter}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredGradient}>
              <View style={styles.featuredRow}>
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredEyebrow}>Featured Today</Text>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featured.title}
                  </Text>
                  <Text style={styles.featuredSub}>
                    {featured.mood} · {formatDuration(featured.durationSec)}
                  </Text>
                </View>
                <Pressable
                  onPress={onPlayFeatured}
                  style={styles.playFab}
                  accessibilityRole="button"
                  accessibilityLabel="Play featured soundscape"
                  android_ripple={{ color: `${theme.colors.sky}44` }}
                >
                  <Ionicons name="play" size={28} color={theme.colors.primary} />
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View>
          <Text style={styles.sectionHeading}>Moods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moodScrollContent}>
            {MOODS.map((m) => (
              <Pressable
                key={m.key}
                style={styles.moodChip}
                accessibilityRole="button"
                accessibilityLabel={`${m.label} moods`}
                onPress={() => undefined}
                android_ripple={{ color: `${theme.colors.primary}33` }}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={styles.moodLabel}>{m.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Card>
          <Text style={styles.sectionHeading}>Recent sounds</Text>
          {recent.length === 0 ? (
            <Text style={styles.emptyRecent}>Nothing here yet — tap play on Featured Today to seed your recent list.</Text>
          ) : (
            <View style={styles.recentList}>
              {recent.slice(0, 3).map((play) => (
                <Pressable
                  key={`${play.id}-${play.playedAt}`}
                  onPress={() => onPlayRecent(play)}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${play.name}`}
                  style={({ pressed }) => [styles.recentRow, pressed && styles.recentPressed]}
                  android_ripple={{ color: `${theme.colors.sky}22` }}
                >
                  <View style={styles.recentTextWrap}>
                    <Text style={styles.recentName} numberOfLines={2}>
                      {play.name}
                    </Text>
                    <Text style={styles.recentMeta}>{formatDuration(play.durationSec)}</Text>
                  </View>
                  <View style={styles.recentPlayBtn} pointerEvents="none">
                    <Ionicons name="play-circle" size={32} color={theme.colors.sky} />
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
