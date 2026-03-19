import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { ParsedActivity } from '../../services/gpxParser';
import { StatsBar } from './StatsBar';
import { ElevationChart } from './ElevationChart';
import { colors } from '../../utils/colors';

interface ActivityDetailProps {
  activity: ParsedActivity;
}

export function ActivityDetail({ activity }: ActivityDetailProps) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Activity Details</Text>
      
      <StatsBar
        distance_m={activity.stats.distance_m}
        duration_s={activity.stats.duration_s}
        elevation_m={activity.stats.elevation_m}
        avg_speed_ms={activity.stats.avg_speed_ms}
      />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Elevation Profile</Text>
        <ElevationChart points={activity.points} />
      </View>
      
      {/* TODO: Add speed chart */}
      {/* TODO: Add heart rate zones chart */}
    </ScrollView>
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
  section: {
    backgroundColor: colors.white,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 16,
  },
});
