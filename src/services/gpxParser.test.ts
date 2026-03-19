import { parseGPX } from './gpxParser';

describe('parseGPX', () => {
  it('parses valid GPX file with elevation', async () => {
    const gpxContent = `
      <?xml version="1.0" encoding="UTF-8"?>
      <gpx version="1.1">
        <trk>
          <trkseg>
            <trkpt lat="45.7640" lon="4.8357">
              <ele>200</ele>
              <time>2024-01-01T10:00:00Z</time>
            </trkpt>
            <trkpt lat="45.7650" lon="4.8367">
              <ele>210</ele>
              <time>2024-01-01T10:01:00Z</time>
            </trkpt>
          </trkseg>
        </trk>
      </gpx>
    `;
    
    const result = await parseGPX(gpxContent);
    
    expect(result.trace.type).toBe('LineString');
    expect(result.trace.coordinates).toHaveLength(2);
    expect(result.stats.distance_m).toBeGreaterThan(0);
    expect(result.stats.elevation_m).toBe(10);
    expect(result.stats.duration_s).toBe(60);
  });

  it('handles GPX without elevation', async () => {
    const gpxContent = `
      <?xml version="1.0" encoding="UTF-8"?>
      <gpx version="1.1">
        <trk>
          <trkseg>
            <trkpt lat="45.7640" lon="4.8357" />
          </trkseg>
        </trk>
      </gpx>
    `;
    
    const result = await parseGPX(gpxContent);
    
    expect(result.stats.elevation_m).toBe(0);
  });

  it('handles GPX without timestamps', async () => {
    const gpxContent = `
      <?xml version="1.0" encoding="UTF-8"?>
      <gpx version="1.1">
        <trk>
          <trkseg>
            <trkpt lat="45.7640" lon="4.8357">
              <ele>200</ele>
            </trkpt>
          </trkseg>
        </trk>
      </gpx>
    `;
    
    const result = await parseGPX(gpxContent);
    
    expect(result.stats.started_at).toBeDefined();
  });
});
