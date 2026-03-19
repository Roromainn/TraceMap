import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

interface StatsBarProps {
  distance_m: number;
  duration_s: number;
  elevation_m: number;
  avg_speed_ms: number;
}

export function StatsBar({
  distance_m,
  duration_s,
  elevation_m,
  avg_speed_ms,
}: StatsBarProps) {
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2) + ' km';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (ms: number) => {
    return (ms * 3.6).toFixed(1) + ' km/h';
  };

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.value}>{formatDistance(distance_m)}</Text>
        <Text style={styles.label}>Distance</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.value}>{formatDuration(duration_s)}</Text>
        <Text style={styles.label}>Duration</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.value}>{elevation_m.toFixed(0) + ' m'}</Text>
        <Text style={styles.label}>Elevation</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.value}>{formatSpeed(avg_speed_ms)}</Text>
        <Text style={styles.label}>Avg Speed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  stat: {
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  label: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
  },
});
