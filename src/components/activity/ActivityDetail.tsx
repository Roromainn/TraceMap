import React from 'react';
import { View, ScrollView, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
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

      {/* Splits Section */}
      <View style={styles.splitsSection}>
        <Text style={styles.sectionTitle}>🏃 Km Splits</Text>
        <View style={styles.splitsHeader}>
          <Text style={styles.splitHeaderLabel}>Kilometer</Text>
          <Text style={styles.splitHeaderLabel}>Pace</Text>
          <Text style={styles.splitHeaderLabel}>Elev</Text>
          <Text style={styles.splitHeaderLabel}>HR</Text>
        </View>
        <View style={styles.splitsList}>
          {activity.points.length > 0 && Array.from({ length: Math.min(5, Math.floor(activity.stats.distance_m / 1000) || 1) }).map((_, i) => {
            const splitPoints = activity.points.slice(i * 100, (i + 1) * 100);
            const avgSpeed = splitPoints.length > 0 ? 
              (splitPoints.reduce((sum, p) => sum + (p.speed_ms || 0), 0) / splitPoints.length) : 0;
            const paceMin = avgSpeed > 0 ? Math.floor(1000 / (avgSpeed * 60)) : 0;
            const paceSec = avgSpeed > 0 ? Math.floor((1000 / (avgSpeed * 60) - paceMin) * 60) : 0;
            const paceSeconds = paceMin * 60 + paceSec;
            
            return {
              index: i,
              paceSeconds,
              paceMin,
              paceSec,
              elev: i % 2 === 0 ? '+' : '-',
              elevValue: ((i + 1) * 5).toFixed(0),
              hr: 140 + i * 5,
            };
          })
          .sort((a, b) => a.paceSeconds - b.paceSeconds) // Sort by fastest first
          .map((split, sortedIndex) => {
            const isFastest = sortedIndex === 0;
            const originalIndex = split.index;
            
            return (
              <View key={originalIndex} style={[styles.splitRow, isFastest && styles.splitRowFastest]}>
                <Text style={[styles.splitIndex, isFastest && styles.splitIndexFastest]}>{originalIndex + 1}</Text>
                <View style={styles.splitPaceContainer}>
                  <Text style={[styles.splitPace, isFastest && styles.splitPaceFastest]}>
                    {split.paceMin}:{split.paceSec.toString().padStart(2, '0')}
                  </Text>
                  {isFastest && <Text style={styles.fastestLabel}>Fastest</Text>}
                </View>
                <Text style={styles.splitElev}>{split.elev}{split.elevValue}m</Text>
                <Text style={styles.splitHR}>{split.hr}</Text>
              </View>
            );
          })}
        </View>
        <TouchableOpacity style={styles.viewAllSplits}>
          <Text style={styles.viewAllSplitsText}>View All Splits</Text>
        </TouchableOpacity>
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
  splitsSection: {
    backgroundColor: colors.surfaceContainerLowest,
    marginTop: 12,
    borderRadius: 0,
    overflow: 'hidden',
  },
  splitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  splitHeaderLabel: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  splitsList: {
    backgroundColor: colors.surfaceContainerLowest,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  splitRowFastest: {
    backgroundColor: colors.primary,
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryFixedDim,
  },
  splitIndex: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  splitIndexFastest: {
    color: colors.onPrimary,
  },
  splitPaceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  splitPace: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '800',
    fontStyle: 'italic',
    color: colors.onSurface,
  },
  splitPaceFastest: {
    color: colors.onPrimary,
  },
  fastestLabel: {
    fontSize: 8,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.primaryFixedDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  splitElev: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    flex: 1,
    textAlign: 'center',
  },
  splitHR: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    flex: 1,
    textAlign: 'center',
  },
  viewAllSplits: {
    alignItems: 'center',
    padding: 16,
  },
  viewAllSplitsText: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
