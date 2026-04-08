import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Dimensions, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useMapStore } from '../../stores/mapStore';
import { useToast } from '../../contexts/ToastContext';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import ActivityFilters, { ActivityType, TimePeriod } from '../../components/activity/ActivityFilters';

export default function FeedScreen() {
  const { activities, setSelectedActivity, refresh } = useMapStore();
  const router = useRouter();
  const { showInfo } = useToast();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ActivityType>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = async () => {
    await refresh();
    showInfo('Activités actualisées');
  };

  const handleActivityPress = (id: string) => {
    setSelectedActivity(id);
    router.push(`/activity/${id}`);
  };

  const handleAddPress = () => {
    router.push('/(tabs)/record');
  };

  const formatDistance = (meters: number) => (meters / 1000).toFixed(2) + ' km';
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (ms: number) => {
    if (ms <= 0) return '--:--';
    const minPerKm = 1000 / (ms * 60);
    const min = Math.floor(minPerKm);
    const sec = Math.floor((minPerKm - min) * 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'run':
        return 'directions-run';
      case 'ride':
        return 'directions-bike';
      case 'hike':
        return 'hiking';
      default:
        return 'directions-walk';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'run': return '#F97316';
      case 'ride': return '#3B82F6';
      case 'hike': return '#10B981';
      default: return '#8B5CF6';
    }
  };

  // Stats summary
  const totalDistance = activities.reduce((sum, a) => sum + a.stats.distance_m, 0);
  const totalElevation = activities.reduce((sum, a) => (a.stats.elevation_m || 0) + sum, 0);

  if (activities.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIllustration}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptySubIcon}>📍</Text>
        </View>
        <Text style={styles.emptyTitle}>No activities yet</Text>
        <Text style={styles.emptySubtitle}>
          Import a GPX file to start tracking{'\n'}your adventures
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.emptyButtonText}>→ Go to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity>
            <MaterialIcons name="menu" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.logo}>KINETIC</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="notifications-none" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleActivityPress(item.id)}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.title.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityDate}>
                    {item.stats.started_at.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name={getActivityIcon(item.stats.type)}
                size={24}
                color={colors.primary}
              />
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatDistance(item.stats.distance_m)}</Text>
                <Text style={styles.metricLabel}>Distance</Text>
              </View>
              <View style={[styles.metric, styles.metricBorder]}>
                <Text style={styles.metricValue}>{formatDuration(item.stats.duration_s)}</Text>
                <Text style={styles.metricLabel}>Time</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{formatPace(item.stats.avg_speed_ms)}</Text>
                <Text style={styles.metricLabel}>Pace</Text>
              </View>
            </View>

            {/* Map Thumbnail - Colored gradient card */}
            <View style={[styles.mapThumbnail, { backgroundColor: getActivityColor(item.stats.type) }]}>
              <View style={styles.gradientOverlay} />
              <View style={styles.thumbnailContent}>
                <MaterialIcons name={getActivityIcon(item.stats.type)} size={48} color={colors.white} style={{ opacity: 0.3 }} />
              </View>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>{item.stats.type.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Weekly Performance</Text>
            <Text style={styles.statsSubtitle}>Activity Feed</Text>
            <View style={styles.bentoStats}>
              <View style={styles.bentoCard}>
                <MaterialIcons name="speed" size={24} color={colors.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.bentoValue}>{totalDistance > 0 ? (totalDistance / activities.length / 1000).toFixed(1) : '0'}</Text>
                <Text style={styles.bentoLabel}>Avg Pace (km)</Text>
              </View>
              <View style={styles.bentoCard}>
                <MaterialIcons name="flag" size={24} color={colors.primary} style={{ marginBottom: 12 }} />
                <Text style={styles.bentoValue}>{totalElevation.toFixed(0)}</Text>
                <Text style={styles.bentoLabel}>Elevation Gain (m)</Text>
              </View>
            </View>
          </View>
        }
      />

      {/* Floating Action Button */}
    <TouchableOpacity 
      testID="fab-add"
      style={styles.fab} 
      activeOpacity={0.8}
      onPress={handleAddPress}
    >
        <MaterialIcons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  logo: {
    fontSize: 24,
    fontFamily: 'Lexend',
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.primary,
    letterSpacing: -1,
  },
  statsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  statsTitle: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 32,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -1,
    marginBottom: 20,
  },
  bentoStats: {
    flexDirection: 'row',
    gap: 16,
  },
  bentoCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  bentoValue: {
    fontSize: 28,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 4,
  },
  bentoLabel: {
    fontSize: 9,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onPrimaryContainer,
  },
  activityTitle: {
    fontSize: 17,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 13,
    fontFamily: 'Plus Jakarta Sans',
    color: colors.onSurfaceVariant,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLowest,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.outlineVariant,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  mapThumbnail: {
    height: 192,
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  thumbnailContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.15,
  },
  badge: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 32,
  },
  emptyIllustration: {
    marginBottom: 24,
    position: 'relative',
  },
  emptyIcon: {
    fontSize: 72,
  },
  emptySubIcon: {
    fontSize: 32,
    position: 'absolute',
    bottom: -8,
    right: -8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontFamily: 'Lexend',
    fontWeight: '700',
  },
});
