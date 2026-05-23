import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { Button } from "@/src/components/core/Button";
import { Card } from "@/src/components/core/Card";
import { Input } from "@/src/components/core/Input";
import { ResultsToast } from "@/src/components/core/ResultsToast";
import { Screen } from "@/src/components/core/Screen";
import { aiPreviewPlayer, formatAudioDuration } from "@/src/features/audio/aiPreviewPlayer";
import { layerMixerEngine } from "@/src/features/audio/layerMixerEngine";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import { generateSoundscape, GenerateSoundscapeError } from "@/src/features/soundscapes/generateApi";
import { saveLibrarySound } from "@/src/features/soundscapes/userLibrary";
import { useScrollContentBottomPad } from "@/src/hooks/useScrollBottomInset";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/theme";

type GenerateMode = "ai" | "mixer";

type LayerDef = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const LAYER_PRESETS: LayerDef[] = [
  { key: "rain", label: "Rain", icon: "rainy-outline" },
  { key: "ocean", label: "Ocean", icon: "water-outline" },
  { key: "wind", label: "Wind", icon: "cloud-outline" },
  { key: "fire", label: "Fireplace", icon: "flame-outline" },
  { key: "white", label: "White Noise", icon: "pulse-outline" },
  { key: "forest", label: "Forest", icon: "leaf-outline" },
];

const EXAMPLE_PROMPTS = [
  "Rainy cabin with distant thunder",
  "Coffee shop with soft jazz",
  "Ocean waves at sunset",
  "Forest birds at dawn",
];

function sanitizeTitle(text: string, maxLen: number): string {
  const t = text.trim();
  if (!t) return "Generated soundscape";
  return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`;
}

function generatedSoundName(prompt: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  return words.length > 0 ? words.join(" ") : "Generated soundscape";
}

type AiGenerationResult = {
  title: string;
  prompt: string;
  url: string;
  duration: number;
};

export default function GenerateScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const scrollBottomPad = useScrollContentBottomPad(24);
  const { session } = useAuthSession();

  const [mode, setMode] = useState<GenerateMode>("ai");
  const [prompt, setPrompt] = useState("");
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiGenerationResult | null>(null);
  const [aiPlaying, setAiPlaying] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [layers, setLayers] = useState(() =>
    LAYER_PRESETS.map(() => ({
      volume: 45,
      enabled: false,
    }))
  );
  const [mixPlaying, setMixPlaying] = useState(false);
  const [mixLoading, setMixLoading] = useState(false);
  const [mixSaved, setMixSaved] = useState(false);

  const layersRef = useRef(layers);
  layersRef.current = layers;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const layerStatesForEngine = useCallback(
    () =>
      LAYER_PRESETS.map((preset, i) => ({
        key: preset.key,
        volume: layersRef.current[i]?.volume ?? 0,
        enabled: layersRef.current[i]?.enabled ?? false,
      })),
    []
  );

  const hasEnabledLayer = layers.some((l) => l.enabled);

  const styles = useMemo(() => stylesForTheme(theme), [theme]);

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

  const saveGeneratedSound = useCallback(async (result: AiGenerationResult, userId: string) => {
    const { error } = await supabase.from("generated_sounds").insert({
      user_id: userId,
      name: generatedSoundName(result.prompt),
      url: result.url,
      duration: Math.max(0, Math.round(result.duration)),
      prompt: result.prompt,
    });

    if (error) {
      throw error;
    }
  }, []);

  const startAiGeneration = useCallback(async () => {
    const raw = prompt.trim();
    if (!raw) return;

    const userId = session?.user?.id;
    if (!userId) {
      setAiError("Sign in to generate AI soundscapes.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    setAiPlaying(false);
    setAiSaved(false);
    await aiPreviewPlayer.unload();

    try {
      const { url, duration } = await generateSoundscape(raw, userId);
      const loadedDuration = await aiPreviewPlayer.load(url);
      const resolvedDuration =
        loadedDuration > 0 ? loadedDuration : duration > 0 ? duration : 15;
      const nextResult = {
        title: sanitizeTitle(raw, 48),
        prompt: raw,
        url,
        duration: resolvedDuration,
      };
      setAiResult(nextResult);
      await saveGeneratedSound(nextResult, userId);
      setAiSaved(true);
      showToast("Sound saved to library");
    } catch (e) {
      if (e instanceof GenerateSoundscapeError) {
        if (e.code === "GENERATION_LIMIT_REACHED" || e.code === "PAID_PLAN_REQUIRED") {
          setPaywallMessage(e.message);
          setPaywallVisible(true);
        }
        setAiError(e.message);
      } else {
        setAiError(e instanceof Error ? e.message : "Generation failed");
      }
    } finally {
      setAiLoading(false);
    }
  }, [prompt, session?.user?.id, saveGeneratedSound, showToast]);

  const toggleAiPlay = useCallback(async () => {
    if (!aiResult?.url) return;
    const playing = await aiPreviewPlayer.toggle(aiResult.url);
    setAiPlaying(playing);
  }, [aiResult?.url]);

  const saveAiResult = useCallback(async () => {
    const userId = session?.user?.id;
    if (!aiResult || !userId || aiSaved) return;
    try {
      await saveGeneratedSound(aiResult, userId);
      setAiSaved(true);
      showToast("Sound saved to library");
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Could not save sound.");
    }
  }, [aiResult, aiSaved, saveGeneratedSound, session?.user?.id, showToast]);

  const toggleMixerPlay = useCallback(async () => {
    if (layerMixerEngine.isPlaying() || mixPlaying) {
      await layerMixerEngine.stopMix();
      setMixPlaying(false);
      setMixLoading(false);
      return;
    }
    if (!hasEnabledLayer) {
      return;
    }
    setMixLoading(true);
    try {
      await layerMixerEngine.playMix(layerStatesForEngine());
      setMixPlaying(layerMixerEngine.isPlaying());
    } catch (e) {
      console.error("[Generate] Mixer play failed:", e);
      setMixPlaying(false);
    } finally {
      setMixLoading(false);
    }
  }, [hasEnabledLayer, layerStatesForEngine, mixPlaying]);

  const onLayerEnabledChange = useCallback((idx: number, enabled: boolean) => {
    setLayers((prev) => {
      const next = [...prev];
      const row = { ...next[idx]!, enabled };
      next[idx] = row;
      const preset = LAYER_PRESETS[idx];
      if (preset) {
        void layerMixerEngine.applyLayerChange({
          key: preset.key,
          volume: row.volume,
          enabled: row.enabled,
        });
      }
      return next;
    });
  }, []);

  const onLayerVolumeChange = useCallback((idx: number, volume: number) => {
    const rounded = Math.round(volume);
    setLayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, volume: rounded };
      return next;
    });
    const preset = LAYER_PRESETS[idx];
    if (!preset || !layersRef.current[idx]?.enabled) return;
    void layerMixerEngine.setLayerVolume(preset.key, rounded);
  }, []);

  const saveMixer = useCallback(async () => {
    const snapshot = JSON.stringify(
      LAYER_PRESETS.map((d, i) => ({
        id: d.key,
        volume: layers[i]?.volume ?? 0,
        enabled: layers[i]?.enabled ?? false,
      }))
    );
    await saveLibrarySound({
      kind: "mix",
      title: "Layer mix",
      subtitle: "Mixer",
      payload: snapshot,
    }).catch(console.error);
    setMixSaved(true);
  }, [layers]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Generate</Text>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("ai")}
            style={[styles.modePill, mode === "ai" && styles.modePillActive]}
            android_ripple={{ color: `${theme.colors.sky}44` }}
          >
            <Text style={[styles.modeText, mode === "ai" && styles.modeTextActive]}>AI Generate</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setMode("mixer")}
            style={[styles.modePill, mode === "mixer" && styles.modePillActive]}
            android_ripple={{ color: `${theme.colors.sky}44` }}
          >
            <Text style={[styles.modeText, mode === "mixer" && styles.modeTextActive]}>Layer Mixer</Text>
          </Pressable>
        </View>

        {mode === "ai" ? (
          <>
            <Text style={styles.sectionLabel}>Prompt</Text>
            <Input
              placeholder='Describe your perfect sound…'
              placeholderTextColor={theme.colors.textSecondary}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              style={styles.promptInput}
            />

            <Text style={styles.examplesLabel}>Ideas</Text>
            <View style={styles.chipWrap}>
              {EXAMPLE_PROMPTS.map((line) => (
                <Pressable
                  key={line}
                  onPress={() => setPrompt(line)}
                  style={styles.chip}
                  android_ripple={{ color: `${theme.colors.primary}33` }}
                >
                  <Text style={styles.chipText}>{line}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ position: "relative" }}>
              {aiError ? <Text style={styles.aiError}>{aiError}</Text> : null}

              <Button
                label="Generate"
                onPress={() => void startAiGeneration()}
                disabled={aiLoading || !prompt.trim()}
                style={{ alignSelf: "stretch" }}
                premiumGlow
              />
              {aiLoading ? (
                <View style={styles.loadingCard}>
                  <ActivityIndicator color={theme.colors.sky} size="large" />
                  <Text style={styles.loadingCaption}>Generating your soundscape…</Text>
                </View>
              ) : null}
            </View>

            {aiResult ? (
              <Card>
                <Text style={styles.resultLabel}>Ready</Text>
                <Text style={styles.resultTitle}>{aiResult.title}</Text>
                <Text style={styles.durationBadge}>
                  {formatAudioDuration(aiResult.duration)} · loops
                </Text>
                <View style={styles.resultActions}>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() => void toggleAiPlay()}
                    accessibilityRole="button"
                    accessibilityLabel={aiPlaying ? "Pause generated sound" : "Play generated sound"}
                  >
                    <Ionicons name={aiPlaying ? "pause-circle" : "play-circle"} size={44} color={theme.colors.primary} />
                  </Pressable>
                  <Text style={styles.playHint}>
                    {aiPlaying ? "Playing · looped preview" : "Tap to play · looped preview"}
                  </Text>
                </View>
                <Button
                  variant="secondary"
                  label={aiSaved ? "Saved to Library" : "Save to Library"}
                  onPress={() => void saveAiResult()}
                  disabled={aiSaved}
                />
              </Card>
            ) : null}
          </>
        ) : (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Layers</Text>
              {LAYER_PRESETS.map((layer, idx) => {
                const row = layers[idx];
                const vol = row?.volume ?? 0;
                const on = row?.enabled ?? false;
                const isLastLayer = idx === LAYER_PRESETS.length - 1;
                return (
                  <View
                    key={layer.key}
                    style={[styles.layerRow, isLastLayer && { borderBottomWidth: 0, paddingBottom: 0 }]}
                  >
                    <View style={styles.layerHead}>
                      <Ionicons name={layer.icon} size={22} color={theme.colors.sky} />
                      <Text style={styles.layerLabel}>{layer.label}</Text>
                      <Switch
                        value={on}
                        onValueChange={(v) => onLayerEnabledChange(idx, v)}
                        thumbColor={on ? theme.colors.primary : "#666"}
                        trackColor={{
                          false: theme.colors.border,
                          true: `${theme.colors.primary}88`,
                        }}
                      />
                    </View>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={vol}
                      disabled={!on}
                      minimumTrackTintColor={theme.colors.primary}
                      maximumTrackTintColor={theme.colors.border}
                      thumbTintColor={theme.colors.sky}
                      onValueChange={(value) => {
                        if (!on) {
                          return;
                        }
                        onLayerVolumeChange(idx, value);
                      }}
                    />
                    <Text style={styles.sliderValue}>{on ? `${Math.round(vol)}%` : "—"}</Text>
                  </View>
                );
              })}
            </Card>

            <View style={styles.mixerBtns}>
              <Button
                label={mixLoading ? "Loading…" : mixPlaying ? "Stop" : "Play"}
                variant="secondary"
                disabled={mixLoading || (!mixPlaying && !hasEnabledLayer)}
                onPress={() => void toggleMixerPlay()}
              />
              <Button label="Save Mix" premiumGlow disabled={mixSaved} onPress={saveMixer} />
              {mixPlaying ? (
                <Text style={styles.mixPlayingHint}>Mix playing · layers loop in the background.</Text>
              ) : !hasEnabledLayer ? (
                <Text style={styles.mixPlayingHint}>Enable at least one layer to play.</Text>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={paywallVisible} transparent animationType="fade">
        <View style={styles.paywallBackdrop}>
          <Pressable style={styles.paywallBackdropFill} onPress={() => setPaywallVisible(false)} />
          <View style={styles.paywallCard}>
            <Text style={styles.paywallTitle}>Upgrade to generate</Text>
            <Text style={styles.paywallBody}>
              {paywallMessage ||
                "You've used all your AI generations this month. Upgrade to generate more."}
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
      <ResultsToast visible={toastVisible} message={toastMessage} opacityAnim={toastOpacity} theme={theme} />
    </Screen>
  );
}

function stylesForTheme(theme: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    scroll: { gap: theme.spacing.md, flexGrow: 1 },
    pageTitle: {
      ...theme.typography.header,
      color: theme.colors.textPrimary,
    },
    modeRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}44`,
      alignSelf: "stretch",
    },
    modePill: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.radius.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6,
    },
    modePillActive: {
      backgroundColor: `${theme.colors.primary}37`,
      borderWidth: 1,
      borderColor: theme.colors.sky,
    },
    modeText: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      fontWeight: "700",
      fontSize: 14,
    },
    modeTextActive: {
      color: theme.colors.textPrimary,
    },
    proBadge: {
      backgroundColor: `${theme.colors.sky}2a`,
      borderWidth: 1,
      borderColor: `${theme.colors.sky}99`,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    proBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: theme.colors.sky,
      letterSpacing: 0.5,
    },
    quotaHint: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    sectionLabel: {
      ...theme.typography.caption,
      color: theme.colors.sky,
      textTransform: "uppercase",
      letterSpacing: 0.9,
      fontWeight: "700",
    },
    promptInput: {
      minHeight: 120,
      textAlignVertical: "top",
      paddingTop: 12,
    },
    examplesLabel: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      fontWeight: "600",
      marginTop: theme.spacing.sm,
    },
    chipWrap: { gap: theme.spacing.sm, flexDirection: "column" },
    chip: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: `${theme.colors.sky}44`,
      backgroundColor: `${theme.colors.background}aa`,
      alignSelf: "stretch",
    },
    chipText: {
      ...theme.typography.body,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    loadingCard: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    loadingCaption: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
    },
    aiError: {
      ...theme.typography.caption,
      color: theme.colors.coral,
      marginBottom: theme.spacing.sm,
    },
    resultLabel: {
      ...theme.typography.caption,
      color: theme.colors.sky,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    resultTitle: {
      ...theme.typography.title,
      fontSize: 20,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.xs,
    },
    durationBadge: {
      ...theme.typography.caption,
      color: theme.colors.sky,
      marginBottom: theme.spacing.md,
      fontWeight: "600",
    },
    resultActions: {
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    iconBtn: { padding: 8 },
    playHint: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    sectionTitle: {
      ...theme.typography.title,
      marginBottom: theme.spacing.md,
      color: theme.colors.primary,
    },
    layerRow: {
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: 4,
    },
    layerHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    layerLabel: {
      ...theme.typography.body,
      color: theme.colors.textPrimary,
      fontWeight: "700",
      flex: 1,
    },
    sliderValue: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      textAlign: "right",
      marginBottom: theme.spacing.sm,
    },
    mixerBtns: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    mixPlayingHint: {
      ...theme.typography.caption,
      color: theme.colors.sky,
      textAlign: "center",
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
      marginBottom: theme.spacing.sm,
    },
  });
}
