import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { signInWithEmail } from "@/src/features/auth/api";
import { Button } from "@/src/components/core/Button";
import { Input } from "@/src/components/core/Input";
import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

export default function SignInScreen() {
  const theme = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          gap: theme.spacing.lg,
        },
        header: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
        },
        subtitle: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          marginTop: -theme.spacing.sm,
        },
        error: {
          ...theme.typography.caption,
          color: theme.colors.coral,
        },
        link: {
          ...theme.typography.body,
          color: theme.colors.sky,
          textAlign: "center",
        },
        forgotLink: {
          ...theme.typography.caption,
          color: theme.colors.sky,
          alignSelf: "flex-start",
        },
      }),
    [theme]
  );

  const handleSignIn = async () => {
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await signInWithEmail(email.trim(), password);
    setIsSubmitting(false);

    if (error) {
      const raw = error.message ?? "";
      const lower = raw.toLowerCase();
      if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
        setErrorMessage(
          "Confirm your email before signing in. Check your inbox or use Sign up to resend the link."
        );
      } else {
        setErrorMessage(raw);
      }
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue with SoundPulse.</Text>

        <Input
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.sky} />
        ) : (
          <Button label="Sign In" onPress={handleSignIn} />
        )}

        <Link href="/(auth)/sign-up" style={styles.link}>
          Create an account
        </Link>
      </View>
    </Screen>
  );
}
