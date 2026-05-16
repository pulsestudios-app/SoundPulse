import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '../src/theme';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (typeof sentryDsn === 'string' && sentryDsn.length > 0) {
  Sentry.init({
    dsn: sentryDsn,
    enabled: !__DEV__,
    sendDefaultPii: true,
  });
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}
