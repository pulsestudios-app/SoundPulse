import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppTheme } from "@/src/theme";

type GoogleSignInButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export function GoogleSignInButton({
  onPress,
  disabled = false,
  loading = false,
  style,
}: GoogleSignInButtonProps) {
  const theme = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        button: {
          minHeight: 48,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
        },
        buttonDisabled: {
          opacity: 0.5,
        },
        label: {
          ...theme.typography.body,
          fontWeight: "700",
          color: theme.colors.textPrimary,
        },
      }),
    [theme]
  );

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        pressed && !isDisabled && { opacity: 0.88 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.textPrimary} />
      ) : (
        <>
          <GoogleLogo size={20} />
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}
