import { XMLParser } from 'fast-xml-parser';
import { calculateDistance } from '../utils/geo';

export interface ParsedActivity {
  trace: GeoJSON.LineString;
  stats: {
    distance_m: number;
    elevation_m: number;
    duration_s: number;
    avg_speed_ms: number;
    avg_hr: number | null;
    started_at: Date;
    type: 'run' | 'ride' | 'hike' | 'other';
  };
  points: Array<{
    lat: number;
    lng: number;
    altitude_m: number;
    speed_ms: number;
    heart_rate: number | null;
    timestamp: Date;
  }>;
}

/**
 * Extract heart rate from GPX track point extensions.
 * Supports: Garmin (ns3:hr in TrackPointExtension), gpxtpx:hr, and flat <hr> tags.
 */
function extractHeartRate(pt: any): number | null {
  const ext = pt.extensions;
  if (!ext) return null;

  // Garmin format: extensions > TrackPointExtension > ns3:hr
  const tpe = ext['TrackPointExtension'];
  if (tpe) {
    // Try all possible HR tag names
    const hr = tpe['ns3:hr'] ?? tpe['gpxtpx:hr'] ?? tpe['hr'];
    if (hr != null) return parseInt(String(hr), 10);
  }

  // Direct in extensions (some formats)
  const hr = ext['ns3:hr'] ?? ext['gpxtpx:hr'] ?? ext['hr'];
  if (hr != null) return parseInt(String(hr), 10);

  return null;
}

export async function parseGPX(gpxContent: string): Promise<ParsedActivity> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'trkpt' || name === 'trkseg',
  });

  const result = parser.parse(gpxContent);

  // Support multiple trksegs
  const trk = result.gpx?.trk;
  if (!trk) throw new Error('Invalid GPX: No track found');

  const trksegs = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];
  const allTrackPoints: any[] = [];
  for (const seg of trksegs) {
    if (seg?.trkpt) {
      const pts = Array.isArray(seg.trkpt) ? seg.trkpt : [seg.trkpt];
      allTrackPoints.push(...pts);
    }
  }

  if (allTrackPoints.length === 0) {
    throw new Error('Invalid GPX: No track points found');
  }

  // Base points (without speed yet)
  const rawPoints = allTrackPoints.map((pt: any) => ({
    lat: parseFloat(pt['@_lat']),
    lng: parseFloat(pt['@_lon']),
    altitude_m: pt.ele != null ? parseFloat(pt.ele) : 0,
    heart_rate: extractHeartRate(pt),
    timestamp: pt.time ? new Date(pt.time) : new Date(),
  }));

  // Calculate speed per point from consecutive positions
  const points = rawPoints.map((p, i) => {
    if (i === 0) return { ...p, speed_ms: 0 };
    const prev = rawPoints[i - 1];
    const dist = calculateDistance(prev.lat, prev.lng, p.lat, p.lng);
    const dt = (p.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
    const speed_ms = dt > 0 ? dist / dt : 0;
    return { ...p, speed_ms };
  });

  // Stats
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }

  let elevationGain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].altitude_m - points[i - 1].altitude_m;
    if (diff > 0) elevationGain += diff;
  }

  const timestamps = points.map((p) => p.timestamp.getTime());
  const duration = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
  const avgSpeed = duration > 0 ? totalDistance / duration : 0;

  // Average HR (exclude nulls)
  const hrValues = points.map((p) => p.heart_rate).filter((hr): hr is number => hr !== null);
  const avgHr = hrValues.length > 0 ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length) : null;

  const coordinates: [number, number, number][] = points.map((p) => [p.lng, p.lat, p.altitude_m]);

  return {
    trace: { type: 'LineString', coordinates },
    stats: {
      distance_m: totalDistance,
      elevation_m: elevationGain,
      duration_s: duration,
      avg_speed_ms: avgSpeed,
      avg_hr: avgHr,
      started_at: points[0]?.timestamp || new Date(),
      type: 'other',
    },
    points,
  };
}
