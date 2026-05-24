import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PlaybackTimer } from "@/src/components/audio/PlaybackTimer";
import { CommunitySoundCard } from "@/src/components/community/CommunitySoundCard";
import { Button } from "@/src/components/core/Button";
import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { Screen } from "@/src/components/core/Screen";
import { libraryPlayer } from "@/src/features/audio/libraryPlayer";
import { onPlaybackStopped } from "@/src/features/audio/playbackRegistry";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import {
  deleteCommunitySoundCompletely,
  fetchCreatorProfile,
  removeCommunitySoundFromDiscover,
  toggleCommunityPulse,
  toggleCommunitySave,
} from "@/src/features/community/communityApi";
import { isCommunityMix, type CommunitySound, CreatorProfile } from "@/src/features/community/types";
import type { SavedLayerSnapshot } from "@/src/features/mixer/layerPresets";
import { setPendingMixLoad } from "@/src/features/mixer/pendingMixLoad";
import { useIsPremium } from "@/src/features/subscription/useIsPremium";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { useAppTheme } from "@/src/theme";

function communityPlaybackId(soundId: string): string {
  return `community:${soundId}`;
}

function patchSound(
  sounds: CommunitySound[],
  id: string,
  patch: Partial<CommunitySound>
): CommunitySound[] {
  return sounds.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

export default function CreatorProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const scrollBottomPad = useScrollContentBottomPad(24);
  const { userId: rawUserId } = useLocalSearchParams<{ userId: string }>();
  const creatorId = typeof rawUserId === "string" ? rawUserId : "";
  const { session } = useAuthSession();
  const viewerId = session?.user?.id;
  const { isPremium } = useIsPremium();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);

  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [loadingSoundId, setLoadingSoundId] = useState<string | null>(null);

  useEffect(() => {
    return onPlaybackStopped(() => setPlayingSoundId(null));
  }, []);

  const loadProfile = useCallback(async () => {
    if (!creatorId) {
      setErrorMessage("Creator not found.");
      setProfile(null);
      return;
    }
    setErrorMessage(null);
    const data = await fetchCreatorProfile(creatorId, viewerId);
    setProfile(data);
  }, [creatorId, viewerId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadProfile()
        .catch((e) => {
          setErrorMessage(e instanceof Error ? e.message : "Could not load creator profile.");
          setProfile(null);
        })
        .finally(() => setLoading(false));
    }, [loadProfile])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadProfile()
      .catch((e) => {
        setErrorMessage(e instanceof Error ? e.message : "Could not refresh profile.");
      })
      .finally(() => setRefreshing(false));
  }, [loadProfile]);

  const onPlay = useCallback(
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
      setLoadingSoundId(sound.id);
      try {
        const { playing } = await libraryPlayer.toggle(
          communityPlaybackId(sound.id),
          sound.audio_url,
          () => setPlayingSoundId(null)
        );
        setPlayingSoundId(playing ? sound.id : null);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Playback failed.");
      } finally {
        setLoadingSoundId(null);
      }
    },
    [router]
  );

  const onManageOwnSound = useCallback(
    (sound: CommunitySound) => {
      if (!viewerId || sound.user_id !== viewerId) {
        return;
      }

      Alert.alert("Manage sound", "Choose what to do with this community post.", [
        {
          text: "Remove from Discover",
          onPress: () => {
            void removeCommunitySoundFromDiscover(viewerId, sound.id)
              .then(() => {
                setProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        soundsShared: Math.max(0, prev.soundsShared - 1),
                        sounds: prev.sounds.filter((row) => row.id !== sound.id),
                      }
                    : prev
                );
              })
              .catch((e) => {
                setErrorMessage(e instanceof Error ? e.message : "Could not remove sound.");
              });
          },
        },
        {
          text: "Delete completely",
          style: "destructive",
          onPress: () => {
            void deleteCommunitySoundCompletely(viewerId, sound.id)
              .then(() => {
                setProfile((prev) =>
                  prev
                    ? {
                        ...prev,
                        soundsShared: Math.max(0, prev.soundsShared - 1),
                        totalPulses: Math.max(0, prev.totalPulses - sound.pulseCount),
                        sounds: prev.sounds.filter((row) => row.id !== sound.id),
                      }
                    : prev
                );
              })
              .catch((e) => {
                setErrorMessage(e instanceof Error ? e.message : "Could not delete sound.");
              });
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [viewerId]
  );

  const onPulse = useCallback(
    async (sound: CommunitySound) => {
      if (!viewerId) {
        router.push("/upgrade");
        return;
      }
      if (!isPremium) {
        router.push("/upgrade");
        return;
      }
      try {
        const pulsed = await toggleCommunityPulse(viewerId, sound);
        const delta = pulsed ? 1 : -1;
        const patch = {
          hasPulsed: pulsed,
          pulseCount: Math.max(0, sound.pulseCount + delta),
          pulses24h: Math.max(0, sound.pulses24h + delta),
        };
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                totalPulses: Math.max(0, prev.totalPulses + delta),
                sounds: patchSound(prev.sounds, sound.id, patch),
              }
            : prev
        );
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not pulse sound.");
      }
    },
    [isPremium, router, viewerId]
  );

  const onSave = useCallback(
    async (sound: CommunitySound) => {
      if (!viewerId) {
        router.push("/upgrade");
        return;
      }
      if (!isPremium) {
        router.push("/upgrade");
        return;
      }
      try {
        const saved = await toggleCommunitySave(viewerId, sound);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                sounds: patchSound(prev.sounds, sound.id, { hasSaved: saved }),
              }
            : prev
        );
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Could not save sound.");
      }
    },
    [isPremium, router, viewerId]
  );

  const onFollow = useCallback(() => {
    setFollowing((prev) => !prev);
    Alert.alert("Coming soon", "Following creators will be available in a future update.");
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 1,
          gap: theme.spacing.lg,
        },
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          backgroundColor: `${theme.colors.primary}14`,
        },
        hero: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.xl,
          gap: theme.spacing.md,
          alignItems: "center",
        },
        name: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 24,
          textAlign: "center",
        },
        email: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
        },
        statsRow: {
          flexDirection: "row",
          gap: theme.spacing.md,
          width: "100%",
        },
        statTile: {
          flex: 1,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}33`,
          backgroundColor: `${theme.colors.background}80`,
          padding: theme.spacing.md,
          gap: 6,
          alignItems: "center",
        },
        statValue: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 22,
        },
        statLabel: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          textAlign: "center",
        },
        sectionLabel: {
          ...theme.typography.caption,
          color: `${theme.colors.sky}cc`,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontWeight: "700",
        },
        sounds: {
          gap: theme.spacing.md,
        },
        empty: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          paddingVertical: theme.spacing.lg,
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.coral,
        },
        loading: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: theme.spacing.xxl,
          gap: theme.spacing.md,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
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
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
          </Pressable>
          <Text style={{ ...theme.typography.title, color: theme.colors.textPrimary, flex: 1 }}>
            Creator Profile
          </Text>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.email}>Loading creator…</Text>
          </View>
        ) : profile ? (
          <>
            <View style={styles.hero}>
              <ProfileAvatar
                name={profile.displayName}
                avatarUrl={profile.avatarUrl}
                size={72}
              />
              <Text style={styles.name}>{profile.displayName}</Text>
              {profile.email ? <Text style={styles.email}>{profile.email}</Text> : null}

              <View style={styles.statsRow}>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{profile.soundsShared}</Text>
                  <Text style={styles.statLabel}>Sounds shared</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{profile.totalPulses}</Text>
                  <Text style={styles.statLabel}>Total pulses</Text>
                </View>
              </View>

              <Button
                label={following ? "Following" : "Follow"}
                variant={following ? "secondary" : "primary"}
                premiumGlow={!following}
                onPress={onFollow}
                style={{ alignSelf: "stretch" }}
              />
            </View>

            <PlaybackTimer isPlaying={playingSoundId !== null} />

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <Text style={styles.sectionLabel}>Community sounds</Text>
            <View style={styles.sounds}>
              {profile.sounds.length === 0 ? (
                <Text style={styles.empty}>This creator has not shared any sounds yet.</Text>
              ) : (
                profile.sounds.map((sound) => (
                  <CommunitySoundCard
                    key={sound.id}
                    sound={sound}
                    isPlaying={playingSoundId === sound.id}
                    isLoading={loadingSoundId === sound.id}
                    isPremium={isPremium}
                    isOwner={!!viewerId && sound.user_id === viewerId}
                    onPlay={() => void onPlay(sound)}
                    onPulse={() => void onPulse(sound)}
                    onSave={() => void onSave(sound)}
                    onUpgrade={() => router.push("/upgrade")}
                    onManageOwn={() => onManageOwnSound(sound)}
                  />
                ))
              )}
            </View>
          </>
        ) : (
          <Text style={styles.empty}>{errorMessage ?? "Creator not found."}</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
