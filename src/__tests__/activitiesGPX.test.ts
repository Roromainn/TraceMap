import { createActivityFromGPX } from '../services/activities';
import { ParsedActivity } from '../services/gpxParser';

// Mock Supabase
jest.mock('../services/supabase', () => {
  const fakeFrom = (table: string) => {
    if (table === 'activities') {
      return {
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'mock-id' }, error: null }),
          }),
        }),
      };
    }
    if (table === 'activity_points') {
      return {
        insert: async () => ({ error: null }),
      };
    }
    return { insert: () => ({}) };
  };
  return { supabase: { from: fakeFrom } };
});

describe('createActivityFromGPX', () => {
  it('inserts activity and its points and returns the new activity id', async () => {
    const activity: ParsedActivity = {
      trace: { type: 'LineString', coordinates: [[0, 0], [0.1, 0.1]] },
      stats: {
        distance_m: 1000,
        elevation_m: 10,
        duration_s: 600,
        avg_speed_ms: 1.5,
        avg_hr: 140,
        started_at: new Date('2026-04-08T10:00:00Z'),
        type: 'run',
      },
      points: [
        { lat: 0, lng: 0, altitude_m: 0, speed_ms: 1, heart_rate: 140, timestamp: new Date('2026-04-08T10:00:00Z') },
        { lat: 0.001, lng: 0.001, altitude_m: 1, speed_ms: 1.2, heart_rate: 142, timestamp: new Date('2026-04-08T10:01:00Z') },
      ],
    } as any;

    const id = await (createActivityFromGPX as any)('user-123', activity, { title: 'GPX Test', fileName: 'test.gpx' });
    expect(id).toBe('mock-id');
  });
});
