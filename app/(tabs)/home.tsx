import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../src/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SoundPulse</Text>
      <Text style={styles.subtitle}>Your calm, your soundscapes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
