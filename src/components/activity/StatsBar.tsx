import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';
import { useSettingsStore } from '../../stores/settingsStore';
import { formatSpeed, SPEED_UNIT_LABELS } from '../../utils/units';

interface StatsBarProps {
  distance_m: number;
  duration_s: number;
  elevation_m: number;
  avg_speed_ms: number;
}

export function StatsBar({ distance_m, duration_s, elevation_m, avg_speed_ms }: StatsBarProps) {
  const { speedUnit } = useSettingsStore();

  const formatDistance = (meters: number) => (meters / 1000).toFixed(2) + ' km';

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.value}>{formatDistance(distance_m)}</Text>
        <Text style={styles.label}>Distance</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{formatDuration(duration_s)}</Text>
        <Text style={styles.label}>Durée</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{elevation_m.toFixed(0)} m</Text>
        <Text style={styles.label}>Dénivelé ↑</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{formatSpeed(avg_speed_ms, speedUnit)}</Text>
        <Text style={styles.label}>{SPEED_UNIT_LABELS[speedUnit]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.lightGray,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
