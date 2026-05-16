import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../src/theme';

export default function GenerateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generate</Text>
      <Text style={styles.body}>Craft new ambient layers here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: colors.text,
    opacity: 0.85,
    fontSize: 16,
  },
});
