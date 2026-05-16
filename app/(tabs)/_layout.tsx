import { Tabs } from 'expo-router';

import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8B8B9E',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: '#1E1E2A',
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="generate" options={{ title: 'Generate' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
