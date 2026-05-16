import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../src/theme';

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.body}>Sign-in flow lives here.</Text>
      <Link href="/sign-up" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Need an account? Sign up</Text>
        </TouchableOpacity>
      </Link>
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
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    color: colors.text,
    opacity: 0.75,
    fontSize: 16,
    marginBottom: 24,
  },
  link: {
    paddingVertical: 12,
  },
  linkText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
