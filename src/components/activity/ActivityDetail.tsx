import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { ParsedActivity } from '../../services/gpxParser';
import { StatsBar } from './StatsBar';
import { ElevationChart } from './ElevationChart';
import { SpeedChart } from './SpeedChart';
import { HRZonesChart } from './HRZonesChart';
import { HREvolutionChart } from './HREvolutionChart';
import { colors } from '../../utils/colors';

interface ActivityDetailProps {
  activity: ParsedActivity & { title?: string };
}

export function ActivityDetail({ activity }: ActivityDetailProps) {
  const startedAt = activity.stats.started_at.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date */}
      <View style={styles.dateRow}>
        <Text style={styles.date}>{startedAt}</Text>
        {activity.stats.avg_hr && (
          <Text style={styles.hr}>💓 {activity.stats.avg_hr} bpm</Text>
        )}
      </View>

      {/* Stats bar */}
      <StatsBar
        distance_m={activity.stats.distance_m}
        duration_s={activity.stats.duration_s}
        elevation_m={activity.stats.elevation_m}
        avg_speed_ms={activity.stats.avg_speed_ms}
      />

      {/* Élévation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Profil d'élévation</Text>
        <ElevationChart points={activity.points} />
      </View>

      {/* Vitesse */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Vitesse</Text>
        <SpeedChart points={activity.points} />
      </View>

      {/* Évolution FC */}
      {activity.points.some((p) => p.heart_rate !== null) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💓 Évolution de la FC</Text>
          <HREvolutionChart points={activity.points} />
        </View>
      )}

      {/* Zones FC */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Zones de fréquence cardiaque</Text>
        <HRZonesChart points={activity.points} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  content: {
    paddingBottom: 32,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'capitalize',
    flex: 1,
  },
  hr: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.hrZone4,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 4,
    borderRadius: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.darkGray,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
