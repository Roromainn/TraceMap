import { XMLParser } from 'fast-xml-parser';
import { calculateDistance, calculateBBox } from '../utils/geo';

export interface ParsedActivity {
  trace: GeoJSON.LineString;
  stats: {
    distance_m: number;
    elevation_m: number;
    duration_s: number;
    avg_speed_ms: number;
    started_at: Date;
    type: 'run' | 'ride' | 'hike' | 'other';
  };
  points: Array<{
    lat: number;
    lng: number;
    altitude_m: number;
    timestamp: Date;
  }>;
}

export async function parseGPX(gpxContent: string): Promise<ParsedActivity> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });
  
  const result = parser.parse(gpxContent);
  
  if (!result.gpx?.trk?.trkseg?.trkpt) {
    throw new Error('Invalid GPX: No track points found');
  }
  
  const trackPoints = Array.isArray(result.gpx.trk.trkseg.trkpt)
    ? result.gpx.trk.trkseg.trkpt
    : [result.gpx.trk.trkseg.trkpt];
  
  const points = trackPoints.map((pt: any) => ({
    lat: parseFloat(pt['@_lat']),
    lng: parseFloat(pt['@_lon']),
    altitude_m: pt.ele ? parseFloat(pt.ele) : 0,
    timestamp: pt.time ? new Date(pt.time) : new Date(),
  }));
  
  // Calculate distance
  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(
      points[i - 1].lat,
      points[i - 1].lng,
      points[i].lat,
      points[i].lng
    );
  }
  
  // Calculate elevation gain
  let elevationGain = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].altitude_m - points[i - 1].altitude_m;
    if (diff > 0) elevationGain += diff;
  }
  
  // Calculate duration
  const timestamps = points.map((p) => p.timestamp.getTime());
  const duration = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
  
  // Calculate average speed
  const avgSpeed = duration > 0 ? totalDistance / duration : 0;
  
  // Create GeoJSON LineString
  const coordinates: [number, number, number][] = points.map((p) => [
    p.lng,
    p.lat,
    p.altitude_m,
  ]);
  
  return {
    trace: {
      type: 'LineString',
      coordinates,
    },
    stats: {
      distance_m: totalDistance,
      elevation_m: elevationGain,
      duration_s: duration,
      avg_speed_ms: avgSpeed,
      started_at: points[0]?.timestamp || new Date(),
      type: 'other', // Could be inferred from speed/distance
    },
    points,
  };
}
