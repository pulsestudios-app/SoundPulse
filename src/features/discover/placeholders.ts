import { Alert } from "react-native";

import type { Ionicons } from "@expo/vector-icons";

import type { BreathingVoice } from "./breathingVoicePrefs";

export type BreathingExercise = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultVoice: BreathingVoice;
};

export type BedtimeStory = {
  id: string;
  title: string;
  duration: string;
};

export const BREATHING_EXERCISES: BreathingExercise[] = [
  {
    id: "box",
    title: "Box Breathing",
    subtitle: "4-4-4-4",
    description: "Inhale, hold, exhale, and hold for four counts each to steady your nervous system.",
    duration: "2 min",
    icon: "fitness-outline",
    defaultVoice: "female",
  },
  {
    id: "478",
    title: "4-7-8 Breathing",
    subtitle: "Calm pattern",
    description: "A classic relaxation rhythm: breathe in for 4, hold for 7, and exhale for 8.",
    duration: "2 min",
    icon: "leaf-outline",
    defaultVoice: "female",
  },
  {
    id: "deep",
    title: "Deep Relaxation",
    subtitle: "Slow & steady",
    description: "Long, gentle breaths designed to release tension from head to toe.",
    duration: "2 min",
    icon: "flower-outline",
    defaultVoice: "male",
  },
  {
    id: "sleep",
    title: "Sleep Breathing",
    subtitle: "Wind down",
    description: "Soft pacing and extended exhales to help your body prepare for rest.",
    duration: "2 min",
    icon: "moon-outline",
    defaultVoice: "female",
  },
  {
    id: "focus",
    title: "Focus Breathing",
    subtitle: "Clear mind",
    description: "Balanced breath cycles to sharpen attention before work or study.",
    duration: "2 min",
    icon: "pulse-outline",
    defaultVoice: "male",
  },
];

export const BREATHING_VOICE_OPTIONS: { key: BreathingVoice; label: string }[] = [
  { key: "female", label: "Female" },
  { key: "male", label: "Male" },
];

export const BEDTIME_STORIES: BedtimeStory[] = [
  { id: "cinderella", title: "Cinderella", duration: "5 min" },
  { id: "pigs", title: "The Three Little Pigs", duration: "5 min" },
  { id: "goldilocks", title: "Goldilocks", duration: "5 min" },
  { id: "red-riding-hood", title: "Little Red Riding Hood", duration: "5 min" },
  { id: "ugly-duckling", title: "The Ugly Duckling", duration: "5 min" },
];

export function showComingSoonAlert(title: string): void {
  Alert.alert("Coming soon", `${title} will be available in a future update.`);
}
