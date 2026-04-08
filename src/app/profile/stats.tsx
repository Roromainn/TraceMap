import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMapStore } from '../../stores/mapStore';
import { useSessionStore } from '../../stores/sessionStore';
import { colors } from '../../utils/colors';

export default function ProfileStatsScreen() {
  const router = useRouter();
  const { user } = useSessionStore();
  const { activities } = useMapStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Calculate lifetime stats
  const totalDistance = activities.reduce((sum, a) => sum + a.stats.distance_m, 0);
  const totalElevation = activities.reduce((sum, a) => sum + (a.stats.elevation_m || 0), 0);
  const totalDuration = activities.reduce((sum, a) => sum + a.stats.duration_s, 0);
  const totalActivities = activities.length;

  // Find PRs
  const longestActivity = activities.reduce((max, a) => 
    a.stats.distance_m > max.stats.distance_m ? a : max, activities[0]);
  
  const fastestActivity = activities.reduce((min, a) => 
    a.stats.avg_speed_ms > min.stats.avg_speed_ms ? a : min, activities[0]);

  const highestElevation = activities.reduce((max, a) => 
    (a.stats.elevation_m || 0) > (max.stats.elevation_m || 0) ? a : max, activities[0]);

  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(2)} km`;
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const formatElevation = (meters: number) => `${meters.toFixed(0)} m`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurfaceVariant} onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Lifetime Stats</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <MaterialIcons name="directions-run" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{totalActivities}</Text>
          <Text style={styles.summaryLabel}>Activities</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialIcons name="straighten" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{formatDistance(totalDistance)}</Text>
          <Text style={styles.summaryLabel}>Total Distance</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialIcons name="timer" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{formatDuration(totalDuration)}</Text>
          <Text style={styles.summaryLabel}>Total Time</Text>
        </View>
        <View style={styles.summaryCard}>
          <MaterialIcons name="trending-up" size={32} color={colors.primary} />
          <Text style={styles.summaryValue}>{formatElevation(totalElevation)}</Text>
          <Text style={styles.summaryLabel}>Total Elevation</Text>
        </View>
      </View>

      {/* Personal Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Personal Records</Text>
        
        <View style={styles.prCard}>
          <View style={styles.prHeader}>
            <MaterialIcons name="straighten" size={24} color={colors.primary} />
            <Text style={styles.prTitle}>Longest Activity</Text>
          </View>
          <Text style={styles.prValue}>
            {longestActivity ? formatDistance(longestActivity.stats.distance_m) : 'N/A'}
          </Text>
          <Text style={styles.prSubtitle}>
            {longestActivity ? longestActivity.title : 'No activities yet'}
          </Text>
        </View>

        <View style={styles.prCard}>
          <View style={styles.prHeader}>
            <MaterialIcons name="speed" size={24} color={colors.primary} />
            <Text style={styles.prTitle}>Fastest Activity</Text>
          </View>
          <Text style={styles.prValue}>
            {fastestActivity ? `${(fastestActivity.stats.avg_speed_ms * 3.6).toFixed(1)} km/h` : 'N/A'}
          </Text>
          <Text style={styles.prSubtitle}>
            {fastestActivity ? fastestActivity.title : 'No activities yet'}
          </Text>
        </View>

        <View style={styles.prCard}>
          <View style={styles.prHeader}>
            <MaterialIcons name="mountain-flag" size={24} color={colors.primary} />
            <Text style={styles.prTitle}>Most Elevation</Text>
          </View>
          <Text style={styles.prValue}>
            {highestElevation ? formatElevation(highestElevation.stats.elevation_m || 0) : 'N/A'}
          </Text>
          <Text style={styles.prSubtitle}>
            {highestElevation ? highestElevation.title : 'No activities yet'}
          </Text>
        </View>
      </View>

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 16,
  },
  prCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    gap: 8,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prTitle: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
  },
  prValue: {
    fontSize: 24,
    fontFamily: 'Lexend',
    fontWeight: '900',
    color: colors.primary,
    marginLeft: 36,
  },
  prSubtitle: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginLeft: 36,
  },
});
