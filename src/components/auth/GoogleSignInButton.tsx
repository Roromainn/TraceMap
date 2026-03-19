import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSessionStore } from '../../stores/sessionStore';
import { colors } from '../../utils/colors';

export function GoogleSignInButton() {
  const { signInWithGoogle } = useSessionStore();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={signInWithGoogle}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  text: {
    color: colors.darkGray,
    fontSize: 16,
    fontWeight: '500',
  },
});
