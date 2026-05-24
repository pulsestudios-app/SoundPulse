import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { useAppTheme } from "@/src/theme";

function initialFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.charAt(0).toUpperCase();
}

type ProfileAvatarProps = {
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ProfileAvatar({ name, size = 62, style }: ProfileAvatarProps) {
  const theme = useAppTheme();
  const radius = size / 2;
  const initial = initialFromName(name);

  return (
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
      accessibilityLabel={`${name} profile`}
    >
      <Text
        style={{
          color: theme.colors.primary,
          fontWeight: "800",
          fontSize: Math.max(16, Math.round(size * 0.42)),
        }}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
});
