import React from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LineString } from 'geojson';
import { useMapStore } from '../../stores/mapStore';
import { TraceLayer } from './TraceLayer';

const MAPTILER_TOKEN = process.env.EXPO_PUBLIC_MAPTILER_TOKEN;

// Use outdoor style with terrain support
const MAP_STYLE_URL = `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_TOKEN}`;

// Terrain source for elevation data (DEM)
const TERRAIN_SOURCE = {
  type: 'raster-dem' as const,
  tiles: [`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_TOKEN}`],
  tileSize: 256,
};

interface TraceBounds {
  ne: [number, number]; // [lng, lat]
  sw: [number, number]; // [lng, lat]
}

interface TerrainMapProps {
  traces?: LineString[]; // Multiple traces
  bounds?: TraceBounds | null;
  enable3D?: boolean; // Enable 3D terrain
}

export function TerrainMap({ traces = [], bounds, enable3D = false }: TerrainMapProps) {
  const { viewport } = useMapStore();

  return (
    <MapLibreGL.MapView
      style={{ flex: 1 }}
      mapStyle={MAP_STYLE_URL}
      styleURL={MAP_STYLE_URL}
    >
      {/* Terrain source for 3D elevation */}
      {enable3D && (
        <>
          <MapLibreGL.RasterDemSource
            id="terrain-source"
            {...TERRAIN_SOURCE}
          />
          <MapLibreGL.Terrain
            sourceID="terrain-source"
            exaggeration={1.5} // Vertical exaggeration for visibility
          />
        </>
      )}
      
      {bounds ? (
        <MapLibreGL.Camera
          bounds={{
            ne: bounds.ne,
            sw: bounds.sw,
            paddingTop: 80,
            paddingBottom: 80,
            paddingLeft: 40,
            paddingRight: 40,
          }}
          animationMode="flyTo"
          animationDuration={900}
        />
      ) : (
        <MapLibreGL.Camera
          centerCoordinate={[viewport.lng, viewport.lat]}
          zoomLevel={viewport.zoom}
          pitch={viewport.pitch}
          heading={viewport.bearing}
        />
      )}
      {/* Render all traces with different colors and unique IDs */}
      {traces.map((trace, index) => {
        // Different colors for each trace
        const traceColors = [
          '#F97316', // Orange (1ère activité)
          '#3B82F6', // Bleue (2ème activité)
          '#10B981', // Verte (3ème activité)
          '#EF4444', // Rouge (4ème activité)
          '#8B5CF6', // Violette (5ème activité)
          '#F59E0B', // Jaune-orangé (6ème activité)
        ];
        const color = traceColors[index % traceColors.length];
        
        return (
          <TraceLayer 
            key={`trace-${index}`} 
            trace={trace} 
            color={color}
            index={index}
          />
        );
      })}
    </MapLibreGL.MapView>
  );
}
