import { useMemo } from 'react';
import { useMapStore } from '../stores/mapStore';
import { ParsedActivity } from '../services/gpxParser';

// For Slice 2, activity data is stored in mapStore (in-memory)
// Slice 3 will refactor to use Supabase

export function useActivity(activityId: string | null): ParsedActivity | null {
  // TODO: Store parsed activities in mapStore and retrieve by ID
  // For now, return null - this will be implemented in Slice 2 integration
  
  return null;
}
