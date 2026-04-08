import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMapStore } from '../../stores/mapStore';
import { getActivityWithPoints } from '../../services/activities';
import { TerrainMap } from '../../components/map/TerrainMap';
import { StatsBar } from '../../components/activity/StatsBar';
import { ElevationChart } from '../../components/activity/ElevationChart';
import { HRZonesChart } from '../../components/activity/HRZonesChart';
import { HREvolutionChart } from '../../components/activity/HREvolutionChart';
import ReplayPlayer from '../../components/activity/ReplayPlayer';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { LineString } from 'geojson';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getActivityById } = useMapStore();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      if (!id) return;
      setLoading(true);
      
      try {
        // Fetch from Supabase (primary source for saved activities)
        const result = await getActivityWithPoints(id);
        if (result && result.activity) {
          const formattedActivity = {
            ...result.activity,
            stats: {
              distance_m: result.activity.distance_m,
              elevation_m: result.activity.elevation_m,
              duration_s: result.activity.duration_s,
              avg_speed_ms: result.activity.avg_speed_ms,
              avg_hr: result.activity.avg_hr,
              started_at: new Date(result.activity.started_at),
              type: result.activity.type,
            },
            points: (result.points || []).map((p: any) => ({
              lat: p.lat,
              lng: p.lng,
              altitude_m: p.altitude_m || 0,
              speed_ms: p.speed_ms || 0,
              heart_rate: p.heart_rate || null,
              timestamp: new Date(p.timestamp),
            })),
            title: result.activity.title,
          };
          setActivity(formattedActivity);
        }
      } catch (error) {
        console.error('[ActivityDetail] Failed to load from Supabase:', error);
      }
      
      setLoading(false);
    }
    
    loadActivity();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.notFound}>
        <MaterialIcons name="error-outline" size={64} color={colors.outline} />
        <Text style={styles.notFoundTitle}>Activité introuvable</Text>
        <Text style={styles.notFoundText}>Cette activité n'existe pas ou a été supprimée.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color={colors.white} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Create map trace
  const trace: LineString = {
    type: 'LineString',
    coordinates: activity.points.map((p: any) => [p.lng, p.lat, p.altitude_m]),
  };

  // Calculate bounds
  const lngs = activity.points.map((p: any) => p.lng);
  const lats = activity.points.map((p: any) => p.lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const padding = 0.005;

  const bounds = {
    ne: [maxLng + padding, maxLat + padding] as [number, number],
    sw: [minLng - padding, minLat - padding] as [number, number],
  };

  const startedAt = activity.stats.started_at.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (ms: number) => {
    if (ms <= 0) return '--:--';
    const minPerKm = 1000 / (ms * 60);
    const min = Math.floor(minPerKm);
    const sec = Math.floor((minPerKm - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        {activity && activity.points && activity.points.length >= 2 ? (
          <TerrainMap
            traces={[{
              type: 'LineString',
              coordinates: activity.points.map((p: any) => [p.lng, p.lat, p.altitude_m || 0]),
            }]}
            bounds={{
              ne: [
                Math.max(...activity.points.map((p: any) => p.lng)) + 0.005,
                Math.max(...activity.points.map((p: any) => p.lat)) + 0.005,
              ] as [number, number],
              sw: [
                Math.min(...activity.points.map((p: any) => p.lng)) - 0.005,
                Math.min(...activity.points.map((p: any) => p.lat)) - 0.005,
              ] as [number, number],
            }}
            enable3D={false}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialIcons name="map" size={48} color={colors.outline} />
            <Text style={styles.mapPlaceholderText}>
              {activity?.points && activity.points.length === 0 ? 'No GPS points' : 'GPS data not available'}
            </Text>
          </View>
        )}
      </View>

      {/* Header Info */}
      {activity && (
        <>
          <View style={styles.headerInfo}>
            <Text style={styles.activityTitle}>{activity.title || 'Untitled Activity'}</Text>
            {activity.stats && (
              <>
                <View style={styles.dateRow}>
                  <MaterialIcons name="calendar-today" size={16} color={colors.onSurfaceVariant} />
                  <Text style={styles.dateText}>
                    {activity.stats.started_at?.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                {activity.stats.avg_hr && (
                  <View style={styles.hrRow}>
                    <MaterialIcons name="favorite" size={16} color={colors.error} />
                    <Text style={styles.hrText}>{activity.stats.avg_hr} bpm</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Stats Bar */}
          {activity.stats && (
            <View style={styles.statsSection}>
              <StatsBar
                distance_m={activity.stats.distance_m}
                duration_s={activity.stats.duration_s}
                elevation_m={activity.stats.elevation_m}
                avg_speed_ms={activity.stats.avg_speed_ms}
              />
            </View>
          )}
        </>
      )}

      {/* Additional Stats */}
      {activity && activity.stats && (
        <View style={styles.additionalStats}>
          <View style={styles.statBox}>
            <MaterialIcons name="timer" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{formatDuration(activity.stats.duration_s)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="speed" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{formatPace(activity.stats.avg_speed_ms)}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="trending-up" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{activity.stats.elevation_m?.toFixed(0) || 0}m</Text>
            <Text style={styles.statLabel}>Elevation</Text>
          </View>
        </View>
      )}

      {/* Elevation Chart */}
      {activity && activity.points && activity.points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Profil d'élévation</Text>
          <ElevationChart points={activity.points} />
        </View>
      )}

      {/* Heart Rate Zones */}
      {activity && activity.stats?.avg_hr && activity.points && activity.points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💓 Zones de fréquence cardiaque</Text>
          <HRZonesChart points={activity.points} avgHeartRate={activity.stats.avg_hr} />
        </View>
      )}

      {/* Heart Rate Evolution */}
      {activity && activity.stats?.avg_hr && activity.points && activity.points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Évolution FC</Text>
          <HREvolutionChart points={activity.points} />
        </View>
      )}

      {/* Replay Player */}
      {activity && activity.points && activity.points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎬 Replay du parcours</Text>
          <ReplayPlayer points={activity.points} />
        </View>
      )}

      {/* Splits Section */}
      {activity && activity.stats && activity.points && activity.points.length > 0 && (
        <View style={styles.splitsSection}>
          <Text style={styles.sectionTitle}>🏃 Km Splits</Text>
          <View style={styles.splitsHeader}>
            <Text style={styles.splitHeaderLabel}>Kilometer</Text>
            <Text style={styles.splitHeaderLabel}>Pace</Text>
            <Text style={styles.splitHeaderLabel}>Elev</Text>
            <Text style={styles.splitHeaderLabel}>HR</Text>
          </View>
          <View style={styles.splitsList}>
            {Array.from({ length: Math.min(5, Math.floor(activity.stats.distance_m / 1000) || 1) })
              .map((_, i) => {
                const splitPoints = activity.points.slice(i * 100, (i + 1) * 100);
                const avgSpeed =
                  splitPoints.length > 0
                    ? splitPoints.reduce((sum: number, p: any) => sum + (p.speed_ms || 0), 0) /
                      splitPoints.length
                    : 0;
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
              .sort((a, b) => a.paceSeconds - b.paceSeconds)
              .map((split, sortedIndex) => {
                const isFastest = sortedIndex === 0;
                const originalIndex = split.index;

                return (
                  <View
                    key={originalIndex}
                    style={[styles.splitRow, isFastest && styles.splitRowFastest]}
                  >
                    <Text style={[styles.splitIndex, isFastest && styles.splitIndexFastest]}>
                      {originalIndex + 1}
                    </Text>
                    <View style={styles.splitPaceContainer}>
                      <Text style={[styles.splitPace, isFastest && styles.splitPaceFastest]}>
                        {split.paceMin}:{split.paceSec.toString().padStart(2, '0')}
                      </Text>
                      {isFastest && <Text style={styles.fastestLabel}>Fastest</Text>}
                    </View>
                    <Text style={styles.splitElev}>
                      {split.elev}
                      {split.elevValue}m
                    </Text>
                    <Text style={styles.splitHR}>{split.hr}</Text>
                  </View>
                );
              })}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.onSurfaceVariant,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notFoundTitle: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 16,
  },
  notFoundText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.white,
  },
  mapContainer: {
    height: 250,
    width: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.outline,
    marginTop: 8,
  },
  headerInfo: {
    backgroundColor: colors.white,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  activityTitle: {
    fontSize: 22,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hrText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.error,
  },
  statsSection: {
    padding: 16,
  },
  additionalStats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: colors.surfaceContainerLowest,
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  splitsSection: {
    backgroundColor: colors.surfaceContainerLowest,
    marginTop: 16,
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
});
