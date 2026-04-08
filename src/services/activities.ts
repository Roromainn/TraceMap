import { supabase } from './supabase';
import { ParsedActivity } from './gpxParser';

export interface StoredActivity {
  id: string;
  user_id: string;
  title: string;
  type: 'run' | 'ride' | 'hike' | 'other';
  started_at: string;
  duration_s: number;
  distance_m: number;
  elevation_m: number;
  avg_speed_ms: number;
  avg_hr: number | null;
  source: 'gpx_import' | 'garmin' | 'recording';
  created_at: string;
}

/**
 * Get current authenticated user (returns null if no session)
 */
export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data || !data.session) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Create a new activity in Supabase
 */
export async function createActivity(
  activity: ParsedActivity & { title?: string },
  source: 'gpx_import' | 'garmin' | 'recording' = 'gpx_import'
): Promise<StoredActivity | null> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Insert activity
    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        title: activity.title || `${activity.stats.type} - ${new Date(activity.stats.started_at).toLocaleDateString()}`,
        type: activity.stats.type,
        started_at: activity.stats.started_at.toISOString(),
        duration_s: activity.stats.duration_s,
        distance_m: activity.stats.distance_m,
        elevation_m: activity.stats.elevation_m,
        avg_speed_ms: activity.stats.avg_speed_ms,
        avg_hr: activity.stats.avg_hr,
        source,
      })
      .select()
      .single();

    if (error) {
      console.error('[Activities] Create error:', error);
      throw error;
    }

    // Insert activity points
    if (activity.points && activity.points.length > 0) {
      const pointsData = activity.points.map((p, index) => ({
        activity_id: data.id,
        seq: index,
        lat: p.lat,
        lng: p.lng,
        altitude_m: p.altitude_m || 0,
        speed_ms: p.speed_ms || 0,
        heart_rate: p.heart_rate,
        timestamp: p.timestamp.toISOString(),
      }));

      // Insert in batches of 1000 (Supabase limit)
      const batchSize = 1000;
      for (let i = 0; i < pointsData.length; i += batchSize) {
        const batch = pointsData.slice(i, i + batchSize);
        const { error: pointsError } = await supabase
          .from('activity_points')
          .insert(batch);

        if (pointsError) {
          console.error('[Activities] Points insert error:', pointsError);
        }
      }
    }

    return data;
  } catch (error: any) {
    console.error('[Activities] Create activity error:', error);
    throw error;
  }
}

/**
 * Create an activity from raw GPX data (with optional file metadata).
 * This is a wrapper around createActivity that also records GPX metadata
 * (filename/path) when available. Returns the new activity ID.
 */
export async function createActivityFromGPX(
  userId: string,
  activity: ParsedActivity,
  meta?: { title?: string; rawGpxContent?: string; fileName?: string }
): Promise<string> {
  // Ensure we have a sane title when provided via meta
  const title = meta?.title || `${activity.stats.type} - ${new Date(activity.stats.started_at).toLocaleDateString()}`;
  // Insert activity record (GPX import as default source)
  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      title,
      type: activity.stats.type,
      started_at: activity.stats.started_at.toISOString(),
      duration_s: activity.stats.duration_s,
      distance_m: activity.stats.distance_m,
      elevation_m: activity.stats.elevation_m,
      avg_speed_ms: activity.stats.avg_speed_ms,
      avg_hr: activity.stats.avg_hr,
      source: 'gpx_import',
      raw_file_path: meta?.fileName ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[Activities] createActivityFromGPX error:', error);
    throw error ?? new Error('Failed to create activity from GPX');
  }

  // Insert points if present
  if (Array.isArray(activity.points) && activity.points.length > 0) {
    const pointsData = activity.points.map((p, index) => ({
      activity_id: data.id,
      seq: index,
      lat: p.lat,
      lng: p.lng,
      altitude_m: p.altitude_m || 0,
      speed_ms: p.speed_ms || 0,
      heart_rate: p.heart_rate,
      timestamp: p.timestamp.toISOString(),
    }));

    const batchSize = 1000;
    for (let i = 0; i < pointsData.length; i += batchSize) {
      const batch = pointsData.slice(i, i + batchSize);
      const { error: pointsError } = await supabase
        .from('activity_points')
        .insert(batch);
      if (pointsError) {
        console.error('[Activities] Points insert error (GPX):', pointsError);
      }
    }
  }

  return data.id;
}

/**
 * Get all activities for current user with their points
 */
export async function getActivities(options: {
  limit?: number;
  offset?: number;
  type?: string;
  startDate?: Date;
  endDate?: Date;
} = {}): Promise<any[]> {
  try {
    const { limit = 20, offset = 0, type, startDate, endDate } = options;

    let query = supabase
      .from('activities')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (startDate) {
      query = query.gte('started_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('started_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Activities] Get error:', error);
      return [];
    }

    // Fetch points for each activity
    const activitiesWithPoints = [];
    for (const activity of data || []) {
      const { data: points } = await supabase
        .from('activity_points')
        .select('*')
        .eq('activity_id', activity.id)
        .order('seq', { ascending: true });

      activitiesWithPoints.push({
        ...activity,
        activity_points: points || [],
      });
    }

    return activitiesWithPoints;
  } catch (error) {
    console.error('[Activities] Get activities error:', error);
    return [];
  }
}

/**
 * Get single activity with points
 */
export async function getActivityWithPoints(activityId: string): Promise<{
  activity: StoredActivity | null;
  points: any[];
} | null> {
  try {
    // Get activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (activityError || !activity) {
      return null;
    }

    // Get points
    const { data: points, error: pointsError } = await supabase
      .from('activity_points')
      .select('*')
      .eq('activity_id', activityId)
      .order('seq', { ascending: true });

    if (pointsError) {
      console.error('[Activities] Get points error:', pointsError);
    }

    return {
      activity,
      points: points || [],
    };
  } catch (error) {
    console.error('[Activities] Get activity with points error:', error);
    return null;
  }
}

/**
 * Delete an activity
 */
export async function deleteActivity(activityId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('[Activities] Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Activities] Delete activity error:', error);
    return false;
  }
}
  
/**  
 * Sign up with email/password  
 */  
export async function signUpWithEmail(email: string, password: string) {  
  const { data, error } = await supabase.auth.signUp({ email, password });  
  if (error) throw error;  
  return data;  
}  
  
export async function signInWithEmail(email: string, password: string) {  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });  
  if (error) throw error;  
  return data;  
}  
  
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: 'tracemap://callback' } });
  if (error) throw error;
  return data;
}
  
export async function signOut() {  
  const { error } = await supabase.auth.signOut();  
  if (error) throw error;  
} 
