import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Screen } from "@/src/components/core/Screen";
import { BreathingVoiceToggle } from "@/src/features/discover/BreathingVoiceToggle";
import {
  loadBreathingVoices,
  setBreathingVoice,
  type BreathingVoice,
} from "@/src/features/discover/breathingVoicePrefs";
import { BREATHING_EXERCISES, showComingSoonAlert } from "@/src/features/discover/placeholders";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { useAppTheme } from "@/src/theme";

export default function BreathingScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(24);
  const [voices, setVoices] = useState<Record<string, BreathingVoice>>({});

  useEffect(() => {
    void loadBreathingVoices(BREATHING_EXERCISES.map((item) => item.id)).then(setVoices);
  }, []);

  const onVoiceChange = useCallback((exerciseId: string, voice: BreathingVoice) => {
    setVoices((prev) => ({ ...prev, [exerciseId]: voice }));
    void setBreathingVoice(exerciseId, voice);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flexGrow: 1,
          gap: theme.spacing.md,
        },
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          marginBottom: theme.spacing.sm,
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
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
          fontSize: 26,
          flex: 1,
        },
        list: {
          gap: theme.spacing.md,
        },
        cardOuter: {
          borderRadius: theme.radius.lg,
          overflow: "hidden",
        },
        cardGradient: {
          padding: 1.5,
          borderRadius: theme.radius.lg,
        },
        card: {
          borderRadius: theme.radius.lg - 1,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        cardHead: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: theme.spacing.md,
        },
        iconWrap: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.primary}22`,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}55`,
        },
        cardText: {
          flex: 1,
          gap: 6,
        },
        cardTitle: {
          ...theme.typography.title,
          color: theme.colors.textPrimary,
          fontSize: 20,
        },
        cardSubtitle: {
          ...theme.typography.caption,
          color: theme.colors.sky,
          fontWeight: "700",
        },
        cardDescription: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          lineHeight: 22,
        },
        voiceRow: {
          gap: 6,
        },
        voiceLabel: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          fontWeight: "700",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        cardFooter: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        duration: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          fontWeight: "700",
        },
        playBtn: {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${theme.colors.primary}20`,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
      }),
    [theme]
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.title}>Breathing Exercises</Text>
        </View>

        <View style={styles.list}>
          {BREATHING_EXERCISES.map((item) => {
            const voice = voices[item.id] ?? item.defaultVoice;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => showComingSoonAlert(item.title)}
              >
                <View style={styles.cardOuter}>
                  <LinearGradient
                    colors={[`${theme.colors.primary}66`, `${theme.colors.sky}44`, `${theme.colors.primary}22`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                  >
                    <View style={styles.card}>
                      <View style={styles.cardHead}>
                        <View style={styles.iconWrap}>
                          <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
                        </View>
                        <View style={styles.cardText}>
                          <Text style={styles.cardTitle}>{item.title}</Text>
                          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDescription}>{item.description}</Text>
                      <View style={styles.voiceRow}>
                        <Text style={styles.voiceLabel}>Voice</Text>
                        <BreathingVoiceToggle
                          value={voice}
                          onChange={(next) => onVoiceChange(item.id, next)}
                        />
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.duration}>{item.duration}</Text>
                        <View style={styles.playBtn} pointerEvents="none">
                          <Ionicons name="play" size={20} color={theme.colors.primary} />
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}
