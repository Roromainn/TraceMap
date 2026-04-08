import { useMapStore } from '../stores/mapStore';

// Simple hook to access all stored activities
export function useActivities() {
  const { activities } = useMapStore();
  return activities;
}
