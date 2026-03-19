import { supabase } from './supabase';

export interface Activity {
  id: string;
  user_id: string;
  title: string | null;
  type: 'run' | 'ride' | 'hike' | 'other';
  started_at: string;
  duration_s: number;
  distance_m: number;
  elevation_m: number | null;
  avg_speed_ms: number;
  avg_hr: number | null;
  created_at: string;
}

export async function createActivity(
  activity: Omit<Activity, 'id' | 'created_at'>,
  points: Array<{
    seq: number;
    lat: number;
    lng: number;
    altitude_m: number | null;
    speed_ms: number | null;
    heart_rate: number | null;
    timestamp: string;
  }>
): Promise<string> {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select('id')
    .single();

  if (error) throw error;

  // Insert activity points
  if (points.length > 0) {
    const pointsWithActivityId = points.map((p) => ({
      ...p,
      activity_id: data.id,
    }));

    const { error: pointsError } = await supabase
      .from('activity_points')
      .insert(pointsWithActivityId);

    if (pointsError) throw pointsError;
  }

  return data.id;
}

export async function getActivities(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<Activity[]> {
  let query = supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (dateRange) {
    query = query
      .gte('started_at', dateRange.start.toISOString())
      .lte('started_at', dateRange.end.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getActivityById(
  activityId: string
): Promise<(Activity & { points: any[] }) | null> {
  const { data: activity, error } = await supabase
    .from('activities')
    .select('*, activity_points(*)')
    .eq('id', activityId)
    .single();

  if (error) throw error;
  return activity;
}
