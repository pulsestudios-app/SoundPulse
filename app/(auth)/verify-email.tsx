import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { resendSignupConfirmationEmail, signOut } from "@/src/features/auth/api";
import { needsEmailVerification } from "@/src/features/auth/emailVerification";
import { useAuthSession } from "@/src/features/auth/useAuthSession";
import { Button } from "@/src/components/core/Button";
import { Screen } from "@/src/components/core/Screen";
import { useAppTheme } from "@/src/theme";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { session } = useAuthSession();
  const params = useLocalSearchParams<{ email?: string }>();
  const paramEmail = typeof params.email === "string" ? params.email.trim() : "";
  const sessionEmail = session?.user?.email?.trim() ?? "";
  const email = sessionEmail || paramEmail;

  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          gap: theme.spacing.lg,
        },
        title: {
          ...theme.typography.header,
          color: theme.colors.textPrimary,
          textAlign: "center",
        },
        body: {
          ...theme.typography.body,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 24,
        },
        emailLine: {
          ...theme.typography.body,
          color: theme.colors.sky,
          fontWeight: "700",
          textAlign: "center",
        },
        hint: {
          ...theme.typography.caption,
          color: theme.colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
        },
        message: {
          ...theme.typography.caption,
          color: theme.colors.lime,
          textAlign: "center",
        },
        err: {
          ...theme.typography.caption,
          color: theme.colors.coral,
          textAlign: "center",
        },
        link: {
          ...theme.typography.body,
          color: theme.colors.sky,
          textAlign: "center",
        },
      }),
    [theme]
  );

  const handleResend = async () => {
    if (!email) {
      setError("We don't have your email on this screen. Go back to sign up.");
      return;
    }
    setError(null);
    setMessage(null);
    setStatus("sending");
    const { error: resendErr } = await resendSignupConfirmationEmail(email);
    setStatus("idle");
    if (resendErr) {
      setError(resendErr.message);
      return;
    }
    setMessage("Confirmation email sent again. Check your inbox.");
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const verified = session?.user && !needsEmailVerification(session.user);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          Check your email and click the confirmation link to activate your account.
        </Text>
        {email ? <Text style={styles.emailLine}>{email}</Text> : null}
        <Text style={styles.hint}>
          After you confirm, return here and sign in - or open the link on this device if prompted.
        </Text>

        {verified ? (
          <Button label="Continue" onPress={() => router.replace("/(tabs)/home")} />
        ) : null}

        {error ? <Text style={styles.err}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        {status === "sending" ? (
          <ActivityIndicator color={theme.colors.sky} />
        ) : (
          <Button label="Resend confirmation email" variant="secondary" onPress={() => void handleResend()} />
        )}

        {session ? (
          <Button label="Sign out" variant="secondary" onPress={() => void handleSignOut()} />
        ) : (
          <Link href="/(auth)/sign-in" style={styles.link}>
            Back to sign in
          </Link>
        )}
      </View>
    </Screen>
  );
}
