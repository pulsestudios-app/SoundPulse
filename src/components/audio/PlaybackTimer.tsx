import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/core/Button";
import { Input } from "@/src/components/core/Input";
import { formatTimerRemaining, usePlaybackTimerStore } from "@/src/features/audio/playbackTimerStore";
import { useAppTheme } from "@/src/theme";

const PRESET_MINUTES = [15, 30, 60, 90] as const;

type PlaybackTimerProps = {
  isPlaying: boolean;
};

export function PlaybackTimer({ isPlaying }: PlaybackTimerProps) {
  const theme = useAppTheme();
  const phase = usePlaybackTimerStore((s) => s.phase);
  const remainingSeconds = usePlaybackTimerStore((s) => s.remainingSeconds);
  const pickerVisible = usePlaybackTimerStore((s) => s.pickerVisible);
  const openPicker = usePlaybackTimerStore((s) => s.openPicker);
  const closePicker = usePlaybackTimerStore((s) => s.closePicker);
  const startTimer = usePlaybackTimerStore((s) => s.startTimer);
  const cancelTimer = usePlaybackTimerStore((s) => s.cancelTimer);

  const [customMinutes, setCustomMinutes] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const styles = useMemo(() => stylesForTheme(theme), [theme]);

  const timerActive = phase === "running" || phase === "fading";
  const showTimerButton = isPlaying && phase === "idle";
  const showCountdown = timerActive;

  const onSelectPreset = useCallback(
    (minutes: number) => {
      startTimer(minutes);
      setCustomMinutes("");
      setCustomError(null);
    },
    [startTimer]
  );

  const onStartCustom = useCallback(() => {
    const parsed = Number.parseInt(customMinutes.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setCustomError("Enter at least 1 minute.");
      return;
    }
    if (parsed > 24 * 60) {
      setCustomError("Maximum is 1440 minutes (24 hours).");
      return;
    }
    startTimer(parsed);
    setCustomMinutes("");
    setCustomError(null);
  }, [customMinutes, startTimer]);

  const onCancel = useCallback(() => {
    void cancelTimer();
  }, [cancelTimer]);

  if (!showTimerButton && !showCountdown) {
    return null;
  }

  return (
    <>
      {showTimerButton ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Set playback timer"
          onPress={openPicker}
          style={({ pressed }) => [styles.timerButton, pressed && styles.pressed]}
          android_ripple={{ color: `${theme.colors.sky}33` }}
        >
          <Ionicons name="timer-outline" size={20} color={theme.colors.sky} />
          <Text style={styles.timerButtonLabel}>Timer</Text>
        </Pressable>
      ) : null}

      {showCountdown ? (
        <View style={styles.countdownRow}>
          <View style={styles.countdownLeft}>
            <Ionicons name="timer" size={18} color={theme.colors.primary} />
            <Text style={styles.countdownLabel}>Timer</Text>
            <Text style={styles.countdownTime}>
              {phase === "fading" ? "Fading out…" : formatTimerRemaining(remainingSeconds)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel timer"
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            android_ripple={{ color: `${theme.colors.coral}33` }}
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropFill} onPress={closePicker} accessibilityLabel="Close timer picker" />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timer</Text>
            <Text style={styles.cardBody}>
              Stop playback after a set time. Great for focus, relaxation, meditation, or sleep.
            </Text>

            <View style={styles.presetGrid}>
              {PRESET_MINUTES.map((minutes) => (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  accessibilityLabel={`${minutes} minutes`}
                  onPress={() => onSelectPreset(minutes)}
                  style={({ pressed }) => [styles.presetButton, pressed && styles.pressed]}
                  android_ripple={{ color: `${theme.colors.primary}33` }}
                >
                  <Text style={styles.presetLabel}>{minutes} min</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.customLabel}>Custom</Text>
            <Input
              value={customMinutes}
              onChangeText={(text) => {
                setCustomMinutes(text.replace(/[^\d]/g, ""));
                setCustomError(null);
              }}
              placeholder="Minutes"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={onStartCustom}
            />
            {customError ? <Text style={styles.customError}>{customError}</Text> : null}
            <Button label="Start custom timer" variant="secondary" onPress={onStartCustom} style={{ alignSelf: "stretch" }} />
            <Button label="Close" variant="secondary" onPress={closePicker} style={{ alignSelf: "stretch" }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function stylesForTheme(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    timerButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      alignSelf: "flex-start",
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: `${theme.colors.sky}66`,
      backgroundColor: `${theme.colors.sky}14`,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    timerButtonLabel: {
      ...theme.typography.caption,
      color: theme.colors.sky,
      fontWeight: "700",
    },
    countdownRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}55`,
      backgroundColor: `${theme.colors.primary}12`,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 10,
    },
    countdownLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    countdownLabel: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: "700",
    },
    countdownTime: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontWeight: "700",
    },
    cancelButton: {
      borderRadius: theme.radius.full,
      borderWidth: 1,
      borderColor: `${theme.colors.coral}66`,
      backgroundColor: `${theme.colors.coral}14`,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    cancelLabel: {
      ...theme.typography.caption,
      color: theme.colors.coral,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.88,
    },
    backdrop: {
      flex: 1,
      justifyContent: "center",
      padding: theme.spacing.lg,
      backgroundColor: "rgba(0,0,0,0.72)",
    },
    backdropFill: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}55`,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    cardTitle: {
      ...theme.typography.title,
      color: theme.colors.textPrimary,
      fontSize: 20,
    },
    cardBody: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    presetGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    presetButton: {
      minWidth: "47%",
      flexGrow: 1,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}55`,
      backgroundColor: `${theme.colors.primary}14`,
      paddingVertical: 14,
      alignItems: "center",
    },
    presetLabel: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontWeight: "700",
    },
    customLabel: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    customError: {
      ...theme.typography.caption,
      color: theme.colors.coral,
    },
  });
}
