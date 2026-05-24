import { Pressable, StyleSheet, Text, View } from "react-native";

import { BREATHING_VOICE_OPTIONS } from "@/src/features/discover/placeholders";
import type { BreathingVoice } from "@/src/features/discover/breathingVoicePrefs";
import { useAppTheme } from "@/src/theme";

type BreathingVoiceToggleProps = {
  value: BreathingVoice;
  onChange: (voice: BreathingVoice) => void;
  compact?: boolean;
};

export function BreathingVoiceToggle({ value, onChange, compact = false }: BreathingVoiceToggleProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        compact && styles.rowCompact,
        {
          borderColor: `${theme.colors.primary}44`,
          backgroundColor: `${theme.colors.background}99`,
        },
      ]}
    >
      {BREATHING_VOICE_OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityLabel={`${option.label} voice`}
            accessibilityState={{ selected: active }}
            onPress={(e) => {
              e.stopPropagation?.();
              onChange(option.key);
            }}
            style={[
              styles.chip,
              compact && styles.chipCompact,
              active && {
                backgroundColor: `${theme.colors.primary}33`,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                { color: active ? theme.colors.textPrimary : theme.colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  rowCompact: {
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  labelCompact: {
    fontSize: 11,
  },
});
