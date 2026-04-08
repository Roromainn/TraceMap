import { FIT } from '@garmin/fitsdk';
import { ParsedActivity } from './gpxParser';

export interface FITPoint {
  lat: number;
  lng: number;
  altitude_m: number;
  speed_ms: number;
  heart_rate: number | null;
  timestamp: Date;
  cadence?: number | null;
  power?: number | null;
}

export class FITParser {
  /**
   * Parse a FIT file and return activity data
   */
  async parse(fileContent: ArrayBuffer): Promise<{
    activities: ParsedActivity[];
    metadata: any;
  }> {
    try {
      // Create FIT SDK instance
      const fit = new FIT();
      
      // Parse the file
      const data = fit.parse(fileContent);
      
      if (!data || !data.records) {
        throw new Error('Invalid FIT file: no records found');
      }

      // Extract records
      const records = data.records;
      
      // Find session records for metadata
      const sessionRecords = records.filter((r: any) => r.session);
      const lapRecords = records.filter((r: any) => r.lap);
      const recordRecords = records.filter((r: any) => r.record);

      // Parse session data
      const sessions = sessionRecords.map((session: any) => this.parseSession(session));
      
      // Parse record data (trackpoints)
      const points = this.parseRecords(recordRecords);

      // Build activities
      const activities: ParsedActivity[] = sessions.map((session: any, index: number) => ({
        trace: {
          type: 'LineString' as const,
          coordinates: points.map((p: FITPoint) => [p.lng, p.lat, p.altitude_m]),
        },
        stats: {
          distance_m: session.total_distance || 0,
          elevation_m: session.total_ascent || 0,
          duration_s: session.total_elapsed_time || 0,
          avg_speed_ms: session.avg_speed || 0,
          avg_hr: session.avg_heart_rate || null,
          started_at: session.start_time || new Date(),
          type: this.mapActivityType(session.sport),
        },
        points: points.map((p: FITPoint) => ({
          lat: p.lat,
          lng: p.lng,
          altitude_m: p.altitude_m,
          speed_ms: p.speed_ms,
          heart_rate: p.heart_rate,
          timestamp: p.timestamp,
        })),
      }));

      return {
        activities,
        metadata: {
          file_id: data.file_id,
          sessions_count: sessions.length,
          records_count: recordRecords.length,
          laps_count: lapRecords.length,
        },
      };
    } catch (error: any) {
      console.error('[FITParser] Parse error:', error);
      throw new Error(`FIT parse failed: ${error.message}`);
    }
  }

  /**
   * Parse session record
   */
  private parseSession(session: any) {
    const data = session.session;
    
    return {
      start_time: data.start_time ? new Date(data.start_time) : new Date(),
      total_elapsed_time: data.total_elapsed_time || 0,
      total_distance: data.total_distance || 0,
      total_ascent: data.total_ascent || 0,
      total_descent: data.total_descent || 0,
      total_calories: data.total_calories || 0,
      avg_speed: data.avg_speed || 0,
      max_speed: data.max_speed || 0,
      avg_heart_rate: data.avg_heart_rate || null,
      max_heart_rate: data.max_heart_rate || null,
      sport: data.sport || 'other',
      sub_sport: data.sub_sport || null,
    };
  }

  /**
   * Parse record (trackpoint) records
   */
  private parseRecords(records: any[]): FITPoint[] {
    const points: FITPoint[] = [];

    for (const record of records) {
      const rec = record.record;
      
      if (!rec || !rec.position_lat || !rec.position_long) {
        continue;
      }

      const point: FITPoint = {
        lat: this.semicycleToDegrees(rec.position_lat, 'lat'),
        lng: this.semicycleToDegrees(rec.position_long, 'lng'),
        altitude_m: rec.altitude ? rec.altitude : 0,
        speed_ms: rec.speed ? rec.speed : 0,
        heart_rate: rec.heart_rate || null,
        timestamp: rec.timestamp ? new Date(rec.timestamp) : new Date(),
        cadence: rec.cadence || null,
        power: rec.power || null,
      };

      points.push(point);
    }

    return points;
  }

  /**
   * Convert FIT semicircles to degrees
   */
  private semicycleToDegrees(semicircles: number, type: 'lat' | 'lng'): number {
    const SEMICIRCLES_MAX = 2147483648; // 2^31
    return (semicircles / SEMICIRCLES_MAX) * 180;
  }

  /**
   * Map FIT sport type to our activity type
   */
  private mapActivityType(sport: string): 'run' | 'ride' | 'hike' | 'other' {
    const sportMap: Record<string, 'run' | 'ride' | 'hike' | 'other'> = {
      running: 'run',
      trail_running: 'run',
      cycling: 'ride',
      mountain_biking: 'ride',
      road_biking: 'ride',
      hiking: 'hike',
      walking: 'hike',
      lap_skiing: 'other',
      cross_country_skiing: 'other',
      swimming: 'other',
      gym_workout: 'other',
      strength_training: 'other',
    };

    return sportMap[sport?.toLowerCase()] || 'other';
  }
}

// Singleton instance
export const fitParser = new FITParser();
