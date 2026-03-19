import { calculateDistance, calculateBBox, getAltitudeColor } from './geo';
import { colors } from './colors';

describe('calculateDistance', () => {
  it('calculates distance between two points', () => {
    const distance = calculateDistance(45.7640, 4.8357, 45.7650, 4.8367);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(200); // ~130m expected
  });
});

describe('calculateBBox', () => {
  it('calculates bounding box correctly', () => {
    const coords: [number, number][] = [
      [45.7640, 4.8357],
      [45.7650, 4.8367],
      [45.7630, 4.8347],
    ];
    
    const bbox = calculateBBox(coords);
    
    expect(bbox.minLat).toBe(45.7630);
    expect(bbox.maxLat).toBe(45.7650);
    expect(bbox.minLng).toBe(4.8347);
    expect(bbox.maxLng).toBe(4.8367);
  });
});

describe('getAltitudeColor', () => {
  it('returns blue for low altitude', () => {
    expect(getAltitudeColor(100, 100, 300)).toBe(colors.altitudeLow);
  });
  
  it('returns orange for mid altitude', () => {
    expect(getAltitudeColor(200, 100, 300)).toBe(colors.altitudeMid);
  });
  
  it('returns red for high altitude', () => {
    expect(getAltitudeColor(300, 100, 300)).toBe(colors.altitudeHigh);
  });
});
