import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

// TODO: Replace with actual data from Supabase
const MOCK_ACTIVITIES = [
  { id: '1', title: 'Morning Run', distance_m: 5000, duration_s: 1800, type: 'run' as const },
  { id: '2', title: 'Evening Ride', distance_m: 25000, duration_s: 3600, type: 'ride' as const },
];

export default function ActivitiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activities</Text>
      
      <FlatList
        data={MOCK_ACTIVITIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text>{(item.distance_m / 1000).toFixed(2)} km</Text>
            <Text>{Math.floor(item.duration_s / 60)} min</Text>
          </View>
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkGray,
    padding: 16,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 8,
  },
});
