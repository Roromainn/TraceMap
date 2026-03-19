import React from 'react';
import { ActivityDetail } from '../../components/activity/ActivityDetail';
import { useActivity } from '../../hooks/useActivity';
import { useLocalSearchParams } from 'expo-router';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = useActivity(id);

  if (!activity) {
    return null; // TODO: Show loading or not found
  }

  return <ActivityDetail activity={activity} />;
}
