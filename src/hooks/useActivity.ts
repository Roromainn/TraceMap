import { useMapStore } from '../stores/mapStore';

export function useActivity(activityId: string | null | undefined) {
  const { getActivityById } = useMapStore();

  if (!activityId) return null;
  return getActivityById(activityId) ?? null;
}
