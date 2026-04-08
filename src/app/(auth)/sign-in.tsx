import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SignInForm } from '../../components/auth/SignInForm';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton';
import { colors } from '../../utils/colors';
import { Link } from 'expo-router';

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TraceMap</Text>
      
      <SignInForm />
      
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>OR</Text>
        <View style={styles.line} />
      </View>
      
      <GoogleSignInButton />
      
      <View style={styles.footer}>
        <Text>Don't have an account? </Text>
        <Link href="/(auth)/sign-up" style={styles.link}>
          Sign up
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.offWhite,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 32,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightGray,
  },
  or: {
    marginHorizontal: 16,
    color: colors.darkGray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
