import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useMapStore } from '../../stores/mapStore';
import { useToast } from '../../contexts/ToastContext';
import { colors } from '../../utils/colors';

export default function ActivitiesScreen() {
  const { activities, setSelectedActivity, refresh } = useMapStore();
  const router = useRouter();
  const { showInfo } = useToast();

  const handleRefresh = async () => {
    await refresh();
    showInfo('Activités actualisées');
  };

  const handleActivityPress = (id: string) => {
    setSelectedActivity(id);
    router.push(`/activity/${id}`);
  };

  const formatDistance = (meters: number) => (meters / 1000).toFixed(2) + ' km';
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };
  const formatSpeed = (ms: number) => {
    const kmh = (ms * 3.6).toFixed(1);
    return `${kmh} km/h`;
  };

  if (activities.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIllustration}>
          <Text style={styles.emptyIcon}>🗺️</Text>
          <Text style={styles.emptySubIcon}>📍</Text>
        </View>
        <Text style={styles.emptyTitle}>Aucune activité</Text>
        <Text style={styles.emptySubtitle}>
          Importez un fichier GPX depuis l'onglet {'\n'}Carte pour voir vos activités
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.emptyButtonText}>→ Aller sur la carte</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activités ({activities.length})</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleActivityPress(item.id)}>
            <View style={styles.cardHeader}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityType}>{item.stats.type}</Text>
            </View>
            <View style={styles.stats}>
              <Text style={styles.stat}>{formatDistance(item.stats.distance_m)}</Text>
              <Text style={styles.statSep}>·</Text>
              <Text style={styles.stat}>{formatDuration(item.stats.duration_s)}</Text>
              {item.stats.elevation_m > 0 && (
                <>
                  <Text style={styles.statSep}>·</Text>
                  <Text style={styles.stat}>↑ {item.stats.elevation_m.toFixed(0)} m</Text>
                </>
              )}
            </View>
            {item.stats.avg_hr && (
              <View style={styles.hrRow}>
                <Text style={styles.hrIcon}>💓</Text>
                <Text style={styles.hrText}>{item.stats.avg_hr} bpm moy.</Text>
              </View>
            )}
            <Text style={styles.date}>{item.stats.started_at.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.darkGray,
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.darkGray,
    flex: 1,
  },
  activityType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stat: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '500',
  },
  statSep: {
    fontSize: 14,
    color: colors.lightGray,
    marginHorizontal: 6,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  hrIcon: {
    fontSize: 14,
  },
  hrText: {
    fontSize: 13,
    color: colors.hrZone4,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
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
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
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
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
