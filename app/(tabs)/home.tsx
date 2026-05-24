import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PlaybackTimer } from "@/src/components/audio/PlaybackTimer";
import { Button } from "@/src/components/core/Button";
import { CommunitySoundCard } from "@/src/components/community/CommunitySoundCard";
import { Screen } from "@/src/components/core/Screen";
import { libraryPlayer } from "@/src/features/audio/libraryPlayer";
import { onPlaybackStopped } from "@/src/features/audio/playbackRegistry";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import {
  COMMUNITY_PAGE_SIZE,
  fetchCommunityFeedPage,
  fetchFeaturedCommunitySound,
  toggleCommunityPulse,
  toggleCommunitySave,
} from "@/src/features/community/communityApi";
import { COMMUNITY_CATEGORIES, type CommunityCategoryKey } from "@/src/features/community/categories";
import { formatPulseCount } from "@/src/features/community/formatPulses";
import type { CommunitySound } from "@/src/features/community/types";
import { useIsPremium } from "@/src/features/subscription/useIsPremium";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { useAppTheme } from "@/src/theme";

function communityPlaybackId(soundId: string): string {
  return `community:${soundId}`;
}

function formatDuration(seconds: number | null): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function patchSound(
  sounds: CommunitySound[],
  id: string,
  patch: Partial<CommunitySound>
): CommunitySound[] {
  return sounds.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const scrollBottomPad = useScrollContentBottomPad(28);
  const { session } = useAuthSession();
  const { isPremium } = useIsPremium();
  const userId = session?.user?.id;

  const [featured, setFeatured] = useState<CommunitySound | null>(null);
  const [feed, setFeed] = useState<CommunitySound[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CommunityCategoryKey | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [loadingSoundId, setLoadingSoundId] = useState<string | null>(null);

  useEffect(() => {
    return onPlaybackStopped(() => {
      setPlayingSoundId(null);
    });
  }, []);

  const loadFeedPage = useCallback(
    async (nextPage: number, category: CommunityCategoryKey | null, replace: boolean) => {
      const rows = await fetchCommunityFeedPage({
        userId,
        category,
        page: nextPage,
        trending24h: true,
      });

      setFeed((prev) => (replace ? rows : [...prev, ...rows]));
      setHasMore(rows.length >= COMMUNITY_PAGE_SIZE);
      setPage(nextPage);
    },
    [userId]
  );

  const loadDiscover = useCallback(
    async (category: CommunityCategoryKey | null, replaceFeed: boolean) => {
      setErrorMessage(null);
      const [featuredSound] = await Promise.all([
        fetchFeaturedCommunitySound(userId),
        loadFeedPage(0, category, replaceFeed),
      ]);
      setFeatured(featuredSound);
    },
    [loadFeedPage, userId]
  );

  useFocusEffect(
    useCallback(() => {
      setLoadingInitial(true);
      void loadDiscover(selectedCategory, true)
        .catch((e) => {
          setErrorMessage(e instanceof Error ? e.message : "Could not load community sounds.");
          setFeatured(null);
          setFeed([]);
        })
        .finally(() => setLoadingInitial(false));
    }, [loadDiscover, selectedCategory])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadDiscover(selectedCategory, true)
      .catch((e) => {
        setErrorMessage(e instanceof Error ? e.message : "Could not refresh feed.");
      })
      .finally(() => setRefreshing(false));
  }, [loadDiscover, selectedCategory]);

  const onCategoryPress = useCallback(
    (category: CommunityCategoryKey) => {
      const next = selectedCategory === category ? null : category;
      setSelectedCategory(next);
      setLoadingInitial(true);
      void loadDiscover(next, true)
        .catch((e) => {
          setErrorMessage(e instanceof Error ? e.message : "Could not filter by category.");
        })
        .finally(() => setLoadingInitial(false));
    },
    [loadDiscover, selectedCategory]
  );

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || loadingInitial) {
      return;
    }
    setLoadingMore(true);
    void loadFeedPage(page + 1, selectedCategory, false)
      .catch((e) => {
        setErrorMessage(e instanceof Error ? e.message : "Could not load more sounds.");
      })
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadFeedPage, loadingInitial, loadingMore, page, selectedCategory]);

  const onPlay = useCallback(async (sound: CommunitySound) => {
    if (!sound.audio_url) {
      return;
    }
    const playbackId = communityPlaybackId(sound.id);
    setLoadingSoundId(sound.id);
    try {
      const { playing } = await libraryPlayer.toggle(playbackId, sound.audio_url, () => {
        setPlayingSoundId(null);
      });
      setPlayingSoundId(playing ? sound.id : null);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Playback failed.");
    } finally {
      setLoadingSoundId(null);
    }
  }, []);

  const onPulse = useCallback(
    async (sound: CommunitySound) => {
      if (!userId) {
        setPaywallVisible(true);
        return;
      }
      try {
        const pulsed = await toggleCommunityPulse(userId, sound);
        const delta = pulsed ? 1 : -1;
        const patch = {
          hasPulsed: pulsed,
          pulseCount: Math.max(0, sound.pulseCount + delta),
          pulses24h: Math.max(0, sound.pulses24h + delta),
        };
        setFeed((prev) => patchSound(prev, sound.id, patch));
        setFeatured((prev) => (prev?.id === sound.id ? { ...prev, ...patch } : prev));
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not pulse sound.");
      }
    },
    [userId]
  );

  const onSave = useCallback(
    async (sound: CommunitySound) => {
      if (!userId) {
        setPaywallVisible(true);
        return;
      }
      try {
        const saved = await toggleCommunitySave(userId, sound);
        const patch = { hasSaved: saved };
        setFeed((prev) => patchSound(prev, sound.id, patch));
        setFeatured((prev) => (prev?.id === sound.id ? { ...prev, ...patch } : prev));
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not save sound.");
      }
    },
    [userId]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          flexGrow: 1,
          gap: theme.spacing.xl,
        },
        header: {
          gap: theme.spacing.xs,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
        },
        subtitle: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        sectionLabel: {
          ...theme.typography.caption,
          color: `${theme.colors.sky}cc`,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: "700",
        },
        featuredOuter: {
          borderRadius: theme.radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
        },
        featuredGradient: {
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
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
          fontSize: 22,
        },
        featuredMeta: {
          ...theme.typography.body,
          color: `${theme.colors.textPrimary}aa`,
          fontSize: 14,
        },
        featuredPulse: {
          ...theme.typography.caption,
          color: theme.colors.sky,
          fontWeight: "700",
        },
        featuredActions: {
          flexDirection: "row",
          gap: 10,
          marginTop: theme.spacing.sm,
        },
        featuredActionBtn: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
        },
        featuredPlayBtn: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.surface,
          borderWidth: 2,
          borderColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
          marginTop: theme.spacing.sm,
        },
        categoryScroll: {
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          paddingRight: theme.spacing.md,
        },
        categoryChip: {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: theme.radius.full,
          borderWidth: 1,
        },
        categoryLabel: {
          ...theme.typography.body,
          fontWeight: "700",
          fontSize: 15,
        },
        feed: {
          gap: theme.spacing.md,
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.coral,
        },
        empty: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
          textAlign: "center",
          paddingVertical: theme.spacing.xl,
        },
        loadMoreWrap: {
          alignItems: "center",
          paddingVertical: theme.spacing.sm,
        },
        paywallBackdrop: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: theme.spacing.lg,
        },
        paywallBackdropFill: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "rgba(10,10,15,0.88)",
        },
        paywallCard: {
          width: "100%",
          borderRadius: theme.radius.lg,
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.sky,
          maxWidth: 400,
          alignSelf: "center",
          zIndex: 1,
        },
        paywallTitle: {
          ...theme.typography.title,
          fontSize: 22,
          color: theme.colors.textPrimary,
          textAlign: "center",
        },
        paywallBody: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
        },
      }),
    [scrollBottomPad, theme]
  );

  const gradientColors = [
    `${theme.colors.primary}2a`,
    `${theme.colors.sky}26`,
    theme.colors.surface,
  ] as const;

  const featuredTitle =
    featured?.title?.trim() || featured?.prompt?.trim() || "Community soundscape";

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
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            Browse community soundscapes. Free to listen — pulse and save with Premium.
          </Text>
        </View>

        <PlaybackTimer isPlaying={playingSoundId !== null} />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {loadingInitial && feed.length === 0 ? (
          <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 24 }} />
        ) : null}

        {featured ? (
          <View>
            <Text style={styles.sectionLabel}>Featured today</Text>
            <View style={styles.featuredOuter}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featuredGradient}
              >
                <Text style={styles.featuredEyebrow}>Most pulsed · 24h</Text>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {featuredTitle}
                </Text>
                <Text style={styles.featuredMeta}>
                  {featured.creatorName} · {formatDuration(featured.duration)}
                </Text>
                <Text style={styles.featuredPulse}>{formatPulseCount(featured.pulseCount)}</Text>
                <Pressable
                  onPress={() => void onPlay(featured)}
                  style={styles.featuredPlayBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${featuredTitle}`}
                >
                  {loadingSoundId === featured.id ? (
                    <ActivityIndicator color={theme.colors.primary} />
                  ) : (
                    <Ionicons
                      name={playingSoundId === featured.id ? "pause" : "play"}
                      size={28}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
                <View style={styles.featuredActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={featured.hasPulsed ? "Remove pulse" : "Pulse"}
                    onPress={() => {
                      if (!isPremium) {
                        setPaywallVisible(true);
                        return;
                      }
                      void onPulse(featured);
                    }}
                    style={[
                      styles.featuredActionBtn,
                      {
                        borderColor: featured.hasPulsed ? theme.colors.primary : `${theme.colors.primary}55`,
                        backgroundColor: featured.hasPulsed ? `${theme.colors.primary}22` : `${theme.colors.primary}10`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={featured.hasPulsed ? "radio" : "pulse-outline"}
                      size={18}
                      color={featured.hasPulsed ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={{
                        ...theme.typography.caption,
                        color: featured.hasPulsed ? theme.colors.primary : theme.colors.textPrimary,
                        fontWeight: "700",
                      }}
                    >
                      Pulse
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={featured.hasSaved ? "Unsave" : "Save"}
                    onPress={() => {
                      if (!isPremium) {
                        setPaywallVisible(true);
                        return;
                      }
                      void onSave(featured);
                    }}
                    style={[
                      styles.featuredActionBtn,
                      {
                        borderColor: featured.hasSaved ? theme.colors.sky : `${theme.colors.sky}55`,
                        backgroundColor: featured.hasSaved ? `${theme.colors.sky}18` : "transparent",
                      },
                    ]}
                  >
                    <Ionicons
                      name={featured.hasSaved ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={featured.hasSaved ? theme.colors.sky : theme.colors.textSecondary}
                    />
                    <Text
                      style={{
                        ...theme.typography.caption,
                        color: featured.hasSaved ? theme.colors.sky : theme.colors.textPrimary,
                        fontWeight: "700",
                      }}
                    >
                      Save
                    </Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </View>
        ) : !loadingInitial ? (
          <Text style={styles.empty}>No featured sound yet — be the first to share from Generate.</Text>
        ) : null}

        <View>
          <Text style={styles.sectionLabel}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {COMMUNITY_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => onCategoryPress(cat.key)}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: active ? theme.colors.sky : `${theme.colors.sky}44`,
                      backgroundColor: active ? `${theme.colors.primary}33` : `${theme.colors.surface}ee`,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.label} category`}
                >
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: active ? theme.colors.textPrimary : theme.colors.textSecondary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Trending · last 24 hours</Text>
          <View style={styles.feed}>
            {feed.map((sound) => (
              <CommunitySoundCard
                key={sound.id}
                sound={sound}
                isPlaying={playingSoundId === sound.id}
                isLoading={loadingSoundId === sound.id}
                isPremium={isPremium}
                onPlay={() => void onPlay(sound)}
                onPulse={() => void onPulse(sound)}
                onSave={() => void onSave(sound)}
                onUpgrade={() => setPaywallVisible(true)}
              />
            ))}
          </View>
          {!loadingInitial && feed.length === 0 ? (
            <Text style={styles.empty}>No community sounds in this category yet.</Text>
          ) : null}
          {hasMore && feed.length > 0 ? (
            <View style={styles.loadMoreWrap}>
              <Button
                variant="secondary"
                label={loadingMore ? "Loading…" : "Load more"}
                disabled={loadingMore}
                onPress={onLoadMore}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={paywallVisible} transparent animationType="fade">
        <View style={styles.paywallBackdrop}>
          <Pressable style={styles.paywallBackdropFill} onPress={() => setPaywallVisible(false)} />
          <View style={styles.paywallCard}>
            <Text style={styles.paywallTitle}>Premium feature</Text>
            <Text style={styles.paywallBody}>
              Pulse and save community sounds with a Premium plan. Browsing and playback are free for everyone.
            </Text>
            <Button
              label="View plans · Profile"
              onPress={() => {
                setPaywallVisible(false);
                router.push("/profile");
              }}
              style={{ alignSelf: "stretch" }}
            />
            <Button variant="secondary" label="Maybe later" onPress={() => setPaywallVisible(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
