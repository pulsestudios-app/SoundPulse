import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ProfileAvatar } from "@/src/components/profile/ProfileAvatar";
import { formatPulseCount } from "@/src/features/community/formatPulses";
import { isCommunityMix, type CommunitySound } from "@/src/features/community/types";
import { useAppTheme } from "@/src/theme";

function formatDuration(seconds: number | null, isMix: boolean): string {
  if (isMix) {
    return "Mix";
  }
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type CommunitySoundCardProps = {
  sound: CommunitySound;
  isPlaying: boolean;
  isLoading: boolean;
  isPremium: boolean;
  isOwner?: boolean;
  onPlay: () => void;
  onRemix?: () => void;
  onPulse: () => void;
  onSave: () => void;
  onUpgrade?: () => void;
  onViewProfile?: () => void;
  onManageOwn?: () => void;
};

export function CommunitySoundCard({
  sound,
  isPlaying,
  isLoading,
  isPremium,
  isOwner = false,
  onPlay,
  onRemix,
  onPulse,
  onSave,
  onUpgrade,
  onViewProfile,
  onManageOwn,
}: CommunitySoundCardProps) {
  const theme = useAppTheme();
  const isMix = isCommunityMix(sound);
  const title = sound.title?.trim() || sound.prompt?.trim() || (isMix ? "Layer mix" : "Community soundscape");
  const durationLabel = formatDuration(sound.duration, isMix);
  const playIconName = isLoading
    ? null
    : isPlaying
      ? "pause"
      : isMix
        ? "layers-outline"
        : "analytics-outline";

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}44`,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: theme.spacing.md }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isMix
              ? isPlaying
                ? `Pause mix ${title}`
                : `Play mix ${title}`
              : isPlaying
                ? `Pause ${title}`
                : `Play ${title}`
          }
          onPress={onPlay}
          disabled={isLoading}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isMix
              ? isPlaying
                ? theme.colors.sky
                : `${theme.colors.sky}88`
              : isPlaying
                ? theme.colors.sky
                : `${theme.colors.primary}66`,
            backgroundColor: isMix
              ? isPlaying
                ? `${theme.colors.sky}1f`
                : `${theme.colors.sky}14`
              : isPlaying
                ? `${theme.colors.sky}1f`
                : `${theme.colors.primary}18`,
          }}
        >
          {isLoading || !playIconName ? (
            <ActivityIndicator color={isMix ? theme.colors.sky : theme.colors.primary} />
          ) : (
            <Ionicons
              name={playIconName}
              size={26}
              color={
                isMix
                  ? theme.colors.sky
                  : isPlaying
                    ? theme.colors.sky
                    : theme.colors.primary
              }
            />
          )}
        </Pressable>

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Text
                style={{ ...theme.typography.title, color: theme.colors.textPrimary, fontSize: 17 }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ProfileAvatar name={sound.creatorName} size={22} />
                <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 }}>
                  {sound.creatorName} · {durationLabel}
                </Text>
              </View>
            </View>
            {isOwner && onManageOwn ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Manage community sound"
                onPress={onManageOwn}
                hitSlop={8}
                style={styles.trashBtn}
              >
                <Ionicons name="trash-outline" size={18} color={theme.colors.coral} />
              </Pressable>
            ) : null}
          </View>
          {onViewProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${sound.creatorName} profile`}
              onPress={onViewProfile}
              hitSlop={6}
            >
              <Text
                style={{
                  ...theme.typography.caption,
                  color: theme.colors.primary,
                  fontWeight: "700",
                }}
              >
                View Profile
              </Text>
            </Pressable>
          ) : null}
          <Text style={{ ...theme.typography.caption, color: theme.colors.sky, fontWeight: "700" }}>
            {formatPulseCount(sound.pulseCount)}
            {sound.pulses24h > 0 ? ` · ${sound.pulses24h} today` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.pulseColumn}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={sound.hasPulsed ? "Remove pulse" : "Pulse"}
            onPress={() => {
              if (!isPremium) {
                onUpgrade?.();
                return;
              }
              onPulse();
            }}
            style={[
              styles.actionBtn,
              {
                borderColor: sound.hasPulsed ? theme.colors.primary : `${theme.colors.primary}55`,
                backgroundColor: sound.hasPulsed ? `${theme.colors.primary}22` : `${theme.colors.primary}10`,
              },
            ]}
          >
            <Ionicons
              name={sound.hasPulsed ? "radio" : "pulse-outline"}
              size={18}
              color={sound.hasPulsed ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={{
                ...theme.typography.caption,
                color: sound.hasPulsed ? theme.colors.primary : theme.colors.textPrimary,
                fontWeight: "700",
              }}
            >
              Pulse
            </Text>
          </Pressable>
          <Text style={[styles.pulseHint, { color: theme.colors.textSecondary }]}>Pulse to boost this sound</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sound.hasSaved ? "Unsave" : "Save"}
          onPress={() => {
            if (!isPremium) {
              onUpgrade?.();
              return;
            }
            onSave();
          }}
          style={[
            styles.actionBtn,
            {
              borderColor: sound.hasSaved ? theme.colors.sky : `${theme.colors.sky}55`,
              backgroundColor: sound.hasSaved ? `${theme.colors.sky}18` : "transparent",
            },
          ]}
        >
          <Ionicons
            name={sound.hasSaved ? "bookmark" : "bookmark-outline"}
            size={18}
            color={sound.hasSaved ? theme.colors.sky : theme.colors.textSecondary}
          />
          <Text
            style={{
              ...theme.typography.caption,
              color: sound.hasSaved ? theme.colors.sky : theme.colors.textPrimary,
              fontWeight: "700",
            }}
          >
            Save
          </Text>
        </Pressable>

        {isMix && onRemix ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remix ${title}`}
            onPress={onRemix}
            style={[
              styles.actionBtn,
              {
                borderColor: `${theme.colors.primary}66`,
                backgroundColor: `${theme.colors.primary}12`,
              },
            ]}
          >
            <Ionicons name="shuffle" size={18} color={theme.colors.primary} />
            <Text
              style={{
                ...theme.typography.caption,
                color: theme.colors.primary,
                fontWeight: "700",
              }}
            >
              Remix
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  pulseColumn: {
    gap: 4,
    maxWidth: 148,
  },
  pulseHint: {
    fontSize: 11,
    lineHeight: 14,
    marginLeft: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  trashBtn: {
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ff6f6144",
    backgroundColor: "#ff6f6114",
  },
});
