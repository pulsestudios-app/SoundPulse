import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PlaybackTimer } from "@/src/components/audio/PlaybackTimer";
import { CommunitySoundCard } from "@/src/components/community/CommunitySoundCard";
import { Screen } from "@/src/components/core/Screen";
import { libraryPlayer } from "@/src/features/audio/libraryPlayer";
import { onPlaybackStopped } from "@/src/features/audio/playbackRegistry";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import {
  fetchSavedCommunitySounds,
  toggleCommunitySave,
} from "@/src/features/community/communityApi";
import { isCommunityMix, type CommunitySound } from "@/src/features/community/types";
import type { SavedLayerSnapshot } from "@/src/features/mixer/layerPresets";
import { setPendingMixLoad } from "@/src/features/mixer/pendingMixLoad";
import { useIsPremium } from "@/src/features/subscription/useIsPremium";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme";

type LibraryTab = "my" | "saved";
type MySoundsSort = "recent" | "oldest" | "duration";

type GeneratedSoundRow = {
  id: string;
  user_id: string;
  name: string | null;
  url: string | null;
  duration: number | null;
  prompt: string | null;
  created_at: string | null;
};

function communityPlaybackId(soundId: string): string {
  return `community:${soundId}`;
}

function formatDuration(seconds: number | null): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const totalSeconds = Math.floor(seconds);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatCreatedAt(value: string | null): string {
  if (!value) {
    return "Unknown date";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function soundTitle(sound: GeneratedSoundRow): string {
  const name = sound.name?.trim();
  if (name) {
    return name;
  }
  const prompt = sound.prompt?.trim();
  if (!prompt) {
    return "Generated sound";
  }
  return prompt.length > 52 ? `${prompt.slice(0, 52)}...` : prompt;
}

export default function LibraryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const scrollBottomPad = useScrollContentBottomPad(28);
  const { session } = useAuthSession();
  const { isPremium } = useIsPremium();
  const userId = session?.user?.id;

  const [activeTab, setActiveTab] = useState<LibraryTab>("my");
  const [mySort, setMySort] = useState<MySoundsSort>("recent");
  const [sounds, setSounds] = useState<GeneratedSoundRow[]>([]);
  const [savedSounds, setSavedSounds] = useState<CommunitySound[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSoundId, setActiveSoundId] = useState<string | null>(null);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [loadingSoundId, setLoadingSoundId] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          flexGrow: 1,
          gap: theme.spacing.lg,
          paddingBottom: scrollBottomPad,
        },
        header: {
          gap: theme.spacing.sm,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
        },
        intro: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        tabRow: {
          flexDirection: "row",
          gap: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.sm,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}44`,
        },
        tabPill: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: theme.radius.md,
          alignItems: "center",
          justifyContent: "center",
        },
        tabPillActive: {
          backgroundColor: `${theme.colors.primary}37`,
          borderWidth: 1,
          borderColor: theme.colors.sky,
        },
        tabText: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          fontWeight: "700",
          fontSize: 14,
        },
        tabTextActive: {
          color: theme.colors.textPrimary,
        },
        sortRow: {
          flexDirection: "row",
          gap: theme.spacing.sm,
        },
        sortChip: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: theme.radius.full,
          borderWidth: 1,
        },
        sortChipLabel: {
          ...theme.typography.caption,
          fontWeight: "700",
          fontSize: 13,
        },
        list: {
          gap: theme.spacing.md,
        },
        card: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}33`,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        cardPressed: {
          opacity: 0.92,
        },
        cardText: {
          flex: 1,
          minWidth: 0,
          gap: 8,
        },
        soundName: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 18,
          lineHeight: 23,
        },
        prompt: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          lineHeight: 19,
        },
        metaRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        },
        metaPill: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}44`,
          backgroundColor: `${theme.colors.background}aa`,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        metaText: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          fontWeight: "600",
        },
        playButton: {
          width: 50,
          height: 50,
          borderRadius: 25,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          backgroundColor: `${theme.colors.primary}18`,
        },
        playButtonActive: {
          borderColor: theme.colors.sky,
          backgroundColor: `${theme.colors.sky}1f`,
        },
        centeredState: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: theme.spacing.xxl,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        emptyIconWrap: {
          width: 76,
          height: 76,
          borderRadius: 38,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}66`,
          backgroundColor: `${theme.colors.primary}1f`,
        },
        stateTitle: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          textAlign: "center",
        },
        stateBody: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          maxWidth: 320,
        },
        errorText: {
          ...theme.typography.caption,
          color: theme.colors.coral,
          textAlign: "center",
          lineHeight: 20,
        },
      }),
    [scrollBottomPad, theme]
  );

  useEffect(() => {
    return onPlaybackStopped(() => {
      setPlayingSoundId(null);
      setActiveSoundId(null);
    });
  }, []);

  useEffect(() => {
    return () => {
      void libraryPlayer.unload();
    };
  }, []);

  const loadSounds = useCallback(
    async ({ showInitialLoading }: { showInitialLoading: boolean }) => {
      if (!userId) {
        setSounds([]);
        setLoading(false);
        setErrorMessage(null);
        return;
      }

      if (showInitialLoading) {
        setLoading(true);
      }
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("generated_sounds")
        .select("id,user_id,name,url,duration,prompt,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setSounds([]);
      } else {
        setSounds((data ?? []) as GeneratedSoundRow[]);
      }

      if (showInitialLoading) {
        setLoading(false);
      }
    },
    [userId]
  );

  const loadSavedSounds = useCallback(
    async ({ showInitialLoading }: { showInitialLoading: boolean }) => {
      if (!userId) {
        setSavedSounds([]);
        setSavedLoading(false);
        return;
      }

      if (showInitialLoading) {
        setSavedLoading(true);
      }
      setErrorMessage(null);

      try {
        const rows = await fetchSavedCommunitySounds(userId);
        setSavedSounds(rows);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not load saved sounds.");
        setSavedSounds([]);
      } finally {
        if (showInitialLoading) {
          setSavedLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    if (activeTab === "my") {
      void loadSounds({ showInitialLoading: true });
    } else {
      void loadSavedSounds({ showInitialLoading: true });
    }
  }, [activeTab, loadSavedSounds, loadSounds]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const task =
      activeTab === "my"
        ? loadSounds({ showInitialLoading: false })
        : loadSavedSounds({ showInitialLoading: false });
    task.finally(() => setRefreshing(false));
  }, [activeTab, loadSavedSounds, loadSounds]);

  const playGeneratedSound = useCallback(async (sound: GeneratedSoundRow) => {
    if (!sound.url) {
      setErrorMessage("This sound does not have a playable URL yet.");
      return;
    }

    setErrorMessage(null);
    setLoadingSoundId(sound.id);

    try {
      const { playing } = await libraryPlayer.toggle(sound.id, sound.url, () => {
        setPlayingSoundId(null);
        setActiveSoundId(null);
      });
      setActiveSoundId(playing ? sound.id : libraryPlayer.getActiveSoundId());
      setPlayingSoundId(playing ? sound.id : null);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not play this sound.");
      setPlayingSoundId(null);
      setActiveSoundId(null);
    } finally {
      setLoadingSoundId(null);
    }
  }, []);

  const playCommunitySound = useCallback(
    async (sound: CommunitySound) => {
      if (isCommunityMix(sound)) {
        const layers = (sound.mix_layers ?? []) as SavedLayerSnapshot[];
        if (layers.length === 0) {
          setErrorMessage("This mix could not be loaded.");
          return;
        }
        setPendingMixLoad(layers);
        router.push("/(tabs)/generate?mode=mixer");
        return;
      }

      if (!sound.audio_url) {
        return;
      }

      setErrorMessage(null);
      setLoadingSoundId(sound.id);
      try {
        const { playing } = await libraryPlayer.toggle(
          communityPlaybackId(sound.id),
          sound.audio_url,
          () => {
            setPlayingSoundId(null);
            setActiveSoundId(null);
          }
        );
        setActiveSoundId(playing ? sound.id : libraryPlayer.getActiveSoundId());
        setPlayingSoundId(playing ? sound.id : null);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not play this sound.");
        setPlayingSoundId(null);
        setActiveSoundId(null);
      } finally {
        setLoadingSoundId(null);
      }
    },
    [router]
  );

  const onUnsaveCommunitySound = useCallback(
    async (sound: CommunitySound) => {
      if (!userId) {
        return;
      }
      try {
        const saved = await toggleCommunitySave(userId, sound);
        if (!saved) {
          setSavedSounds((prev) => prev.filter((row) => row.id !== sound.id));
        }
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not unsave sound.");
      }
    },
    [userId]
  );

  const sortedMySounds = useMemo(() => {
    const copy = [...sounds];
    if (mySort === "recent") {
      return copy.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    }
    if (mySort === "oldest") {
      return copy.sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aTime - bTime;
      });
    }
    return copy.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
  }, [mySort, sounds]);

  const renderMySounds = () => {
    if (loading) {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.stateBody}>Loading your sounds...</Text>
        </View>
      );
    }

    if (sortedMySounds.length === 0) {
      return (
        <View style={styles.centeredState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="musical-notes" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.stateTitle}>No sounds yet</Text>
          <Text style={styles.stateBody}>
            Generated soundscapes you save will appear here for replay.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ gap: theme.spacing.md }}>
        <View style={styles.sortRow}>
          {(
            [
              { key: "recent" as const, label: "Recent" },
              { key: "oldest" as const, label: "Oldest" },
              { key: "duration" as const, label: "Duration" },
            ] as const
          ).map((option) => {
            const active = mySort === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setMySort(option.key)}
                style={[
                  styles.sortChip,
                  {
                    borderColor: active ? theme.colors.sky : `${theme.colors.sky}44`,
                    backgroundColor: active ? `${theme.colors.primary}33` : theme.colors.surface,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${option.label}`}
              >
                <Text
                  style={[
                    styles.sortChipLabel,
                    { color: active ? theme.colors.textPrimary : theme.colors.textSecondary },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.list}>
        {sortedMySounds.map((sound) => {
          const isPlaying = playingSoundId === sound.id;
          const isLoadingSound = loadingSoundId === sound.id;
          const title = soundTitle(sound);
          const prompt = sound.prompt?.trim();
          return (
            <View key={sound.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.soundName} numberOfLines={2}>
                  {title}
                </Text>
                {prompt && prompt !== title ? (
                  <Text style={styles.prompt} numberOfLines={2}>
                    {prompt}
                  </Text>
                ) : null}
                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.sky} />
                    <Text style={styles.metaText}>{formatDuration(sound.duration)}</Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.sky} />
                    <Text style={styles.metaText}>{formatCreatedAt(sound.created_at)}</Text>
                  </View>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${isPlaying ? "Pause" : "Play"} ${title}`}
                onPress={() => void playGeneratedSound(sound)}
                disabled={isLoadingSound}
                style={({ pressed }) => [
                  styles.playButton,
                  isPlaying && styles.playButtonActive,
                  pressed && styles.cardPressed,
                ]}
                android_ripple={{ color: `${theme.colors.sky}33`, borderless: true }}
              >
                {isLoadingSound ? (
                  <ActivityIndicator color={theme.colors.sky} />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={25}
                    color={isPlaying ? theme.colors.sky : theme.colors.primary}
                  />
                )}
              </Pressable>
            </View>
          );
        })}
        </View>
      </View>
    );
  };

  const renderSavedSounds = () => {
    if (savedLoading) {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.stateBody}>Loading saved community sounds...</Text>
        </View>
      );
    }

    if (savedSounds.length === 0) {
      return (
        <View style={styles.centeredState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bookmark-outline" size={36} color={theme.colors.sky} />
          </View>
          <Text style={styles.stateTitle}>No saved sounds yet</Text>
          <Text style={styles.stateBody}>
            Save soundscapes from Discover to find them here.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {savedSounds.map((sound) => (
          <CommunitySoundCard
            key={sound.id}
            sound={sound}
            isPlaying={playingSoundId === sound.id}
            isLoading={loadingSoundId === sound.id}
            isPremium={isPremium}
            onPlay={() => void playCommunitySound(sound)}
            onPulse={() => router.push("/upgrade")}
            onSave={() => void onUnsaveCommunitySound(sound)}
            onUpgrade={() => router.push("/upgrade")}
            onViewProfile={() => router.push(`/creator/${sound.user_id}`)}
          />
        ))}
      </View>
    );
  };

  const intro =
    activeTab === "my"
      ? "Replay the AI soundscapes you have generated."
      : "Community soundscapes you saved from Discover.";

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
          <Text style={styles.title}>Library</Text>
          <Text style={styles.intro}>{intro}</Text>
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab("my")}
            style={[styles.tabPill, activeTab === "my" && styles.tabPillActive]}
            accessibilityRole="button"
            accessibilityLabel="My Sounds"
          >
            <Text style={[styles.tabText, activeTab === "my" && styles.tabTextActive]}>My Sounds</Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("saved")}
            style={[styles.tabPill, activeTab === "saved" && styles.tabPillActive]}
            accessibilityRole="button"
            accessibilityLabel="Saved"
          >
            <Text style={[styles.tabText, activeTab === "saved" && styles.tabTextActive]}>Saved</Text>
          </Pressable>
        </View>

        <PlaybackTimer isPlaying={!!playingSoundId} />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {activeTab === "my" ? renderMySounds() : renderSavedSounds()}
      </ScrollView>
    </Screen>
  );
}
