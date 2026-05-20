import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { signUpWithEmail } from "@/src/features/auth/api";
import { signInWithGoogle } from "@/src/features/auth/oauth";
import { GoogleSignInButton } from "@/src/components/auth/GoogleSignInButton";
import { needsEmailVerification } from "@/src/features/auth/emailVerification";
import { seedNewUserProfile } from "@/src/features/auth/signupProfile";
import { Button } from "@/src/components/core/Button";
import { Input } from "@/src/components/core/Input";
import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

export default function SignUpScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        success: {
          ...theme.typography.caption,
          color: theme.colors.lime,
        },
        link: {
          ...theme.typography.body,
          color: theme.colors.sky,
          textAlign: "center",
        },
        agreeIntro: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
          marginTop: -theme.spacing.sm,
        },
        dividerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        dividerLine: {
          flex: 1,
          height: 1,
          backgroundColor: theme.colors.border,
        },
        dividerText: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
        },
      }),
    [theme]
  );

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);
    const { error, cancelled } = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (cancelled) {
      return;
    }
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await signUpWithEmail(email.trim(), password);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const user = data.user;
    if (user?.id && data.session && !needsEmailVerification(user)) {
      try {
        await seedNewUserProfile(user.id);
      } catch (trialError) {
        console.error("[sign-up] Failed to seed profile", trialError);
      }
    }

    const mustVerify = user && (needsEmailVerification(user) || !data.session);
    if (mustVerify) {
      const em = email.trim();
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(em)}` as never);
      return;
    }

    if (user?.id) {
      router.replace("/(tabs)/home");
      return;
    }

    setSuccessMessage("Account created. You can sign in.");
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subtitle}>Start using SoundPulse with your email.</Text>

        <GoogleSignInButton
          onPress={handleGoogleSignIn}
          loading={isGoogleLoading}
          disabled={isSubmitting}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

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
          autoComplete="new-password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Input
          autoCapitalize="none"
          autoComplete="password"
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.sky} />
        ) : (
          <Button label="Sign Up" onPress={handleSignUp} disabled={isGoogleLoading} />
        )}

        <Text style={styles.agreeIntro}>
          By signing up you agree to the Terms of Service and Privacy Policy for SoundPulse.
        </Text>

        <Link href="/(auth)/sign-in" style={styles.link}>
          Already have an account? Sign in
        </Link>
      </View>
    </Screen>
  );
}
