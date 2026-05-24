import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/src/theme";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatar({ name, avatarUrl, size = 62, onPress, style }: ProfileAvatarProps) {
  const theme = useAppTheme();
  const radius = size / 2;
  const initials = initialsFromName(name);

  const content = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: radius }} />
  ) : (
    <Text
      style={{
        color: theme.colors.primary,
        fontWeight: "800",
        fontSize: Math.max(14, Math.round(size * 0.32)),
      }}
    >
      {initials}
    </Text>
  );

  const shell = (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: `${theme.colors.primary}26`,
          borderColor: `${theme.colors.primary}88`,
        },
        style,
      ]}
    >
      {content}
      {onPress ? (
        <View style={[styles.cameraBadge, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="camera" size={14} color={theme.colors.sky} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return shell;
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" onPress={onPress}>
      {shell}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff22",
  },
});
