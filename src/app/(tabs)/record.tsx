import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

export default function RecordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ Record</Text>
      <Text style={styles.subtitle}>Start a new activity</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
});
