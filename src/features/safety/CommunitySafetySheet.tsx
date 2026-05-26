import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/core/Button";
import { Input } from "@/src/components/core/Input";
import { ResultsToast } from "@/src/components/core/ResultsToast";
import { blockUser, formatUserDisplay, reportSound } from "@/src/features/safety/safetyApi";
import { useAppTheme } from "@/src/theme";

const REPORT_REASONS = [
  "Inappropriate content",
  "Spam or misleading",
  "Harassment or bullying",
  "Copyright violation",
  "Other",
] as const;

type SafetyMode = "actions" | "report" | "block";

export type CommunitySafetyTarget = {
  soundId: string;
  userId: string;
  creatorName: string;
};

type CommunitySafetySheetProps = {
  target: CommunitySafetyTarget | null;
  onClose: () => void;
  onReportSubmitted?: (soundId: string) => void;
  onUserBlocked?: (userId: string) => void;
};

export function CommunitySafetySheet({
  target,
  onClose,
  onReportSubmitted,
  onUserBlocked,
}: CommunitySafetySheetProps) {
  const theme = useAppTheme();
  const [mode, setMode] = useState<SafetyMode>("actions");
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const busy = submitting || blocking;
  const targetDisplayName = target
    ? formatUserDisplay(target.userId, target.creatorName)
    : "this user";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: "#000000bb",
          justifyContent: "center",
          padding: theme.spacing.lg,
        },
        card: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        title: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 20,
        },
        hint: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 21,
        },
        actionRow: {
          minHeight: 50,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: `${theme.colors.sky}44`,
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        actionText: {
          ...theme.typography.body,
          color: theme.colors.textPrimary,
          fontWeight: "700",
        },
        reasonRow: {
          minHeight: 46,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          paddingHorizontal: theme.spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.sm,
        },
        reasonText: {
          ...theme.typography.body,
          fontWeight: "700",
          flex: 1,
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.coral,
          lineHeight: 20,
        },
        buttonRow: {
          flexDirection: "row",
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  const close = useCallback(() => {
    if (busy) {
      return;
    }
    onClose();
  }, [busy, onClose]);

  const showToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setToastVisible(true);
      toastOpacity.stopAnimation();
      toastOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setToastVisible(false);
        }
      });
    },
    [toastOpacity]
  );

  useEffect(() => {
    if (!target) {
      return;
    }
    setMode("actions");
    setReason(REPORT_REASONS[0]);
    setDetails("");
    setErrorMessage(null);
    setSubmitting(false);
    setBlocking(false);
  }, [target]);

  const submitReport = useCallback(async () => {
    if (!target) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await reportSound(target.soundId, reason, details);
      onReportSubmitted?.(target.soundId);
      onClose();
      showToast("Report submitted. We'll review it shortly.");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  }, [details, onClose, onReportSubmitted, reason, showToast, target]);

  const confirmBlock = useCallback(async () => {
    if (!target) {
      return;
    }
    setBlocking(true);
    setErrorMessage(null);
    try {
      await blockUser(target.userId);
      onUserBlocked?.(target.userId);
      onClose();
      showToast("User blocked");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not block this user.");
    } finally {
      setBlocking(false);
    }
  }, [onClose, onUserBlocked, showToast, target]);

  const renderActions = () => (
    <>
      <Text style={styles.title}>Sound options</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Report this sound"
        onPress={() => setMode("report")}
        style={styles.actionRow}
      >
        <Ionicons name="flag-outline" size={20} color={theme.colors.coral} />
        <Text style={styles.actionText}>Report this sound</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Block this user"
        onPress={() => setMode("block")}
        style={styles.actionRow}
      >
        <Ionicons name="ban-outline" size={20} color={theme.colors.sky} />
        <Text style={styles.actionText}>Block {targetDisplayName}</Text>
      </Pressable>
      <Button label="Cancel" variant="secondary" onPress={close} />
    </>
  );

  const renderReport = () => (
    <>
      <Text style={styles.title}>Report this sound</Text>
      <Text style={styles.hint}>Report sound by {targetDisplayName}.</Text>
      {REPORT_REASONS.map((option) => {
        const active = reason === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => setReason(option)}
            style={[
              styles.reasonRow,
              {
                borderColor: active ? theme.colors.primary : `${theme.colors.sky}44`,
                backgroundColor: active ? `${theme.colors.primary}28` : theme.colors.background,
              },
            ]}
          >
            <Ionicons
              name={active ? "radio-button-on" : "radio-button-off"}
              size={18}
              color={active ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.reasonText,
                { color: active ? theme.colors.textPrimary : theme.colors.textSecondary },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
      <Input
        placeholder="Optional details"
        value={details}
        onChangeText={setDetails}
        multiline
        numberOfLines={4}
        maxLength={500}
        style={{ minHeight: 96, textAlignVertical: "top" }}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.buttonRow}>
        <Button
          label={submitting ? "Submitting..." : "Submit"}
          onPress={() => void submitReport()}
          disabled={submitting}
          style={{ flex: 1 }}
        />
        <Button
          label="Cancel"
          variant="secondary"
          onPress={close}
          disabled={submitting}
          style={{ flex: 1 }}
        />
      </View>
    </>
  );

  const renderBlock = () => (
    <>
      <Text style={styles.title}>Block {targetDisplayName}?</Text>
      <Text style={styles.hint}>You won't see their sounds anymore</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.buttonRow}>
        <Button
          label={blocking ? "Blocking..." : "Confirm"}
          onPress={() => void confirmBlock()}
          disabled={blocking}
          style={{ flex: 1 }}
        />
        <Button
          label="Cancel"
          variant="secondary"
          onPress={close}
          disabled={blocking}
          style={{ flex: 1 }}
        />
      </View>
    </>
  );

  return (
    <>
      <Modal visible={target !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {mode === "actions" ? renderActions() : null}
            {mode === "report" ? renderReport() : null}
            {mode === "block" ? renderBlock() : null}
            {busy ? <ActivityIndicator color={theme.colors.primary} /> : null}
          </Pressable>
        </Pressable>
      </Modal>
      <ResultsToast visible={toastVisible} message={toastMessage} opacityAnim={toastOpacity} theme={theme} />
    </>
  );
}
