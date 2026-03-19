import { supabase } from './supabase';
import { ParsedActivity } from './gpxParser';

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
  raw_file_path: string | null;
  source: 'garmin' | 'gpx_import';
  created_at: string;
}

export interface ActivityWithPoints extends Activity {
  activity_points: Array<{
    id: number;
    seq: number;
    lat: number;
    lng: number;
    altitude_m: number | null;
    speed_ms: number | null;
    heart_rate: number | null;
    timestamp: string;
  }>;
}

/**
 * Create activity from parsed GPX data.
 * Optionally upload raw GPX file to Supabase Storage.
 */
export async function createActivityFromGPX(
  userId: string,
  parsed: ParsedActivity,
  options?: {
    title?: string;
    rawGpxContent?: string;
    fileName?: string;
  }
): Promise<string> {
  // Step 1: Upload raw GPX file to Storage (optional)
  let rawFilePath: string | null = null;
  if (options?.rawGpxContent && options.fileName) {
    const fileExt = options.fileName.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gpx-files')
      .upload(fileName, options.rawGpxContent, {
        contentType: 'application/gpx+xml',
        upsert: false,
      });
    
    if (uploadError) {
      console.warn('Failed to upload GPX file:', uploadError.message);
    } else {
      rawFilePath = fileName;
    }
  }

  // Step 2: Insert activity
  const activityData = {
    user_id: userId,
    title: options?.title || `${parsed.stats.type.charAt(0).toUpperCase() + parsed.stats.type.slice(1)}`,
    type: parsed.stats.type,
    started_at: parsed.stats.started_at.toISOString(),
    duration_s: parsed.stats.duration_s,
    distance_m: parsed.stats.distance_m,
    elevation_m: parsed.stats.elevation_m,
    avg_speed_ms: parsed.stats.avg_speed_ms,
    avg_hr: parsed.stats.avg_hr,
    raw_file_path: rawFilePath,
    source: 'gpx_import' as const,
  };

  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .insert(activityData)
    .select('id')
    .single();

  if (activityError) throw activityError;

  // Step 3: Insert activity points (batch by 100 to avoid payload limits)
  const batchSize = 100;
  for (let i = 0; i < parsed.points.length; i += batchSize) {
    const batch = parsed.points.slice(i, i + batchSize).map((p, idx) => ({
      activity_id: activity.id,
      seq: i + idx,
      lat: p.lat,
      lng: p.lng,
      altitude_m: p.altitude_m,
      speed_ms: p.speed_ms,
      heart_rate: p.heart_rate,
      timestamp: p.timestamp.toISOString(),
    }));

    const { error: pointsError } = await supabase
      .from('activity_points')
      .insert(batch);

    if (pointsError) throw pointsError;
  }

  return activity.id;
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
): Promise<ActivityWithPoints[]> {
  // Fetch activities list
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (activitiesError) throw activitiesError;
  if (!activities || activities.length === 0) return [];

  // Fetch ALL points for each activity using pagination (Supabase limits to 1000 per request)
  const activitiesWithPoints = await Promise.all(
    activities.map(async (activity) => {
      const allPoints: any[] = [];
      const pageSize = 1000;
      let page = 0;
      let hasMore = true;

      // Paginate through all points (1000 per page)
      while (hasMore) {
        const { data: points, error: pointsError } = await supabase
          .from('activity_points')
          .select('*')
          .eq('activity_id', activity.id)
          .order('seq', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (pointsError) {
          console.error('Error loading points for activity', activity.id, pointsError);
          break;
        }

        if (points && points.length > 0) {
          allPoints.push(...points);
          hasMore = points.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log(`[getActivities] Activity "${activity.title}": ${allPoints.length} points loaded`);
      return { ...activity, activity_points: allPoints };
    })
  );

  return activitiesWithPoints as ActivityWithPoints[];
}

export async function getActivityById(
  activityId: string
): Promise<ActivityWithPoints | null> {
  const { data: activity, error } = await supabase
    .from('activities')
    .select('*, activity_points(*)')
    .eq('id', activityId)
    .single();

  if (error) throw error;
  return activity as ActivityWithPoints;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (!data || !data.user) {
    throw new Error('Connexion échouée: aucune donnée utilisateur');
  }
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  if (!data || !data.user) {
    throw new Error('Inscription échouée: aucune donnée utilisateur');
  }
  return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    redirectTo: 'tracemap://callback',
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
