import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { formatPulseCount } from "@/src/features/community/formatPulses";
import type { CommunitySound } from "@/src/features/community/types";
import { useAppTheme } from "@/src/theme";

function formatDuration(seconds: number | null): string {
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
  onPlay: () => void;
  onPulse: () => void;
  onSave: () => void;
  onUpgrade?: () => void;
};

export function CommunitySoundCard({
  sound,
  isPlaying,
  isLoading,
  isPremium,
  onPlay,
  onPulse,
  onSave,
  onUpgrade,
}: CommunitySoundCardProps) {
  const theme = useAppTheme();
  const title = sound.title?.trim() || sound.prompt?.trim() || "Community soundscape";

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
          accessibilityLabel={isPlaying ? `Pause ${title}` : `Play ${title}`}
          onPress={onPlay}
          disabled={isLoading}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isPlaying ? theme.colors.sky : `${theme.colors.primary}66`,
            backgroundColor: isPlaying ? `${theme.colors.sky}1f` : `${theme.colors.primary}18`,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.sky} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={26}
              color={isPlaying ? theme.colors.sky : theme.colors.primary}
            />
          )}
        </Pressable>

        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            style={{ ...theme.typography.title, color: theme.colors.textPrimary, fontSize: 17 }}
            numberOfLines={2}
          >
            {title}
          </Text>
          <Text style={{ ...theme.typography.caption, color: theme.colors.textSecondary }}>
            {sound.creatorName} · {formatDuration(sound.duration)}
          </Text>
          <Text style={{ ...theme.typography.caption, color: theme.colors.sky, fontWeight: "700" }}>
            {formatPulseCount(sound.pulseCount)}
            {sound.pulses24h > 0 ? ` · ${sound.pulses24h} today` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 10,
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
});
