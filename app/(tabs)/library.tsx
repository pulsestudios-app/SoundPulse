import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../src/theme';

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.body}>Browse and revisit saved soundscapes.</Text>
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
    color: colors.secondary,
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
