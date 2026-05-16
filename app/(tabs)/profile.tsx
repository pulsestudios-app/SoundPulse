import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../src/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.body}>Manage account and preferences.</Text>
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
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: colors.text,
    opacity: 0.7,
    fontSize: 16,
  },
});
