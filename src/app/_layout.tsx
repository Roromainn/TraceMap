import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '../contexts/ToastContext';

export default function RootLayout() {
  return (
    <ToastProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth routes - first screen users see */}
          <Stack.Screen name="(auth)" />
          
          {/* Main app tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Activity detail - nested under activity folder */}
          <Stack.Screen name="activity" options={{ headerShown: false }} />
          
          {/* Debug screen */}
          <Stack.Screen name="debug" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </ToastProvider>
  );
}
