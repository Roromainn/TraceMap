import { colors } from './colors';

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bounding box for a set of coordinates
 */
export function calculateBBox(
  coordinates: [number, number][]
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const lats = coordinates.map(([lat]) => lat);
  const lngs = coordinates.map(([, lng]) => lng);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * Get color based on altitude (gradient: blue → orange → red)
 */
export function getAltitudeColor(
  altitude: number,
  minAlt: number,
  maxAlt: number
): string {
  if (maxAlt === minAlt) return colors.altitudeMid;
  
  const ratio = (altitude - minAlt) / (maxAlt - minAlt);
  
  if (ratio < 0.5) {
    // Interpolate from blue to orange
    return ratio < 0.25 ? colors.altitudeLow : colors.altitudeMid;
  } else {
    // Interpolate from orange to red
    return ratio > 0.75 ? colors.altitudeHigh : colors.altitudeMid;
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
