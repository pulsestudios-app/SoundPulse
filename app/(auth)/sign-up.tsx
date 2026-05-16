import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../src/theme';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.body}>Sign-up flow lives here.</Text>
      <Link href="/sign-in" asChild>
        <TouchableOpacity style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
