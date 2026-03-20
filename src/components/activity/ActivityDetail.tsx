import React from 'react';
import { View, ScrollView, Text, StyleSheet, Dimensions } from 'react-native';
import { ParsedActivity } from '../../services/gpxParser';
import { StatsBar } from './StatsBar';
import { ElevationChart } from './ElevationChart';
import { SpeedChart } from './SpeedChart';
import { HRZonesChart } from './HRZonesChart';
import { HREvolutionChart } from './HREvolutionChart';
import { TerrainMap } from '../map/TerrainMap';
import { colors } from '../../utils/colors';
import { LineString } from 'geojson';

interface ActivityDetailProps {
  activity: ParsedActivity & { title?: string };
}

export function ActivityDetail({ activity }: ActivityDetailProps) {
  const startedAt = activity.stats.started_at.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Convert trace to LineString for map
  const trace: LineString = {
    type: 'LineString',
    coordinates: activity.points.map((p) => [p.lng, p.lat, p.altitude_m]),
  };

  // Calculate bounds
  const lngs = activity.points.map((p) => p.lng);
  const lats = activity.points.map((p) => p.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const lngPadding = (maxLng - minLng) * 0.1 || 0.005;
  const latPadding = (maxLat - minLat) * 0.1 || 0.005;

  const bounds = {
    ne: [maxLng + lngPadding, maxLat + latPadding] as [number, number],
    sw: [minLng - lngPadding, minLat - latPadding] as [number, number],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Map Section - KINETIC Style */}
      <View style={styles.mapContainer}>
        <TerrainMap traces={[trace]} bounds={bounds} enable3D={false} />
      </View>

      {/* Activity Info */}
      <View style={styles.infoSection}>
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
      </View>

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
      {activity.stats.avg_hr && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💓 Zones de fréquence cardiaque</Text>
            <HRZonesChart points={activity.points} avgHeartRate={activity.stats.avg_hr} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Évolution FC</Text>
            <HREvolutionChart points={activity.points} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    paddingBottom: 32,
  },
  mapContainer: {
    height: 300,
    width: Dimensions.get('window').width,
    backgroundColor: colors.surfaceContainerLow,
  },
  infoSection: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  date: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
    flex: 1,
  },
  hr: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.hrZone4,
  },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 4,
    borderRadius: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});
