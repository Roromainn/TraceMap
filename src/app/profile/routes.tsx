import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMapStore } from '../../stores/mapStore';
import { colors } from '../../utils/colors';

export default function ProfileRoutesScreen() {
  const router = useRouter();
  const { activities } = useMapStore();
  const [filter, setFilter] = useState<'all' | 'run' | 'ride' | 'hike'>('all');

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.stats.type === filter);

  const formatDistance = (meters: number) => `${(meters / 1000).toFixed(2)} km`;
  const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric' 
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'run': return 'directions-run';
      case 'ride': return 'directions-bike';
      case 'hike': return 'hiking';
      default: return 'directions-walk';
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="arrow-back" size={24} color={colors.onSurfaceVariant} onPress={() => router.back()} />
          <Text style={styles.headerTitle}>My Routes</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'run', 'ride', 'hike'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterButton, filter === type && styles.filterButtonActive]}
            onPress={() => setFilter(type)}
          >
            <MaterialIcons 
              name={type === 'all' ? 'list' : getActivityIcon(type)} 
              size={18} 
              color={filter === type ? colors.white : colors.onSurfaceVariant} 
            />
            <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Routes List */}
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.routeCard}
            onPress={() => router.push(`/activity/${item.id}`)}
          >
            <View style={styles.routeHeader}>
              <View style={[styles.routeIcon, { backgroundColor: getActivityColor(item.stats.type) }]}>
                <MaterialIcons name={getActivityIcon(item.stats.type)} size={24} color={colors.white} />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeTitle}>{item.title}</Text>
                <Text style={styles.routeDate}>{formatDate(new Date(item.stats.started_at))}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.outline} />
            </View>
            
            <View style={styles.routeStats}>
              <View style={styles.routeStat}>
                <MaterialIcons name="straighten" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.routeStatText}>{formatDistance(item.stats.distance_m)}</Text>
              </View>
              <View style={styles.routeStat}>
                <MaterialIcons name="trending-up" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.routeStatText}>{item.stats.elevation_m?.toFixed(0) || 0}m</Text>
              </View>
              <View style={styles.routeStat}>
                <MaterialIcons name="timer" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.routeStatText}>
                  {Math.floor(item.stats.duration_s / 60)}m
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="route" size={64} color={colors.outline} />
            <Text style={styles.emptyTitle}>No routes yet</Text>
            <Text style={styles.emptyText}>Start recording activities to see your routes here</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  routeCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
  },
  routeDate: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  routeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeStatText: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  },
});
