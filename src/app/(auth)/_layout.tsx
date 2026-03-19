import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { getCurrentUser } from '../../services/activities';
import { useSessionStore } from '../../stores/sessionStore';
import { colors } from '../../utils/colors';

export default function AuthLayout() {
  const { user, isLoading, setSession } = useSessionStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check if we have a stored session
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        setSession({ user: currentUser, session: currentUser });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsChecking(false);
    }
  }

  // Show loading while checking auth
  if (isChecking || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        // Not authenticated → show auth screen
        <Stack.Screen name="index" />
      ) : (
        // Authenticated → redirect to tabs
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
});
