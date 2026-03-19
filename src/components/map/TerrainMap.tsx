import React from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LineString } from 'geojson';
import { useMapStore } from '../../stores/mapStore';
import { TraceLayer } from './TraceLayer';

const MAPTILER_TOKEN = process.env.EXPO_PUBLIC_MAPTILER_TOKEN;
const MAP_STYLE_URL = `https://api.maptiler.com/maps/outdoor/style.json?key=${MAPTILER_TOKEN}`;

interface TraceBounds {
  ne: [number, number]; // [lng, lat]
  sw: [number, number]; // [lng, lat]
}

interface TerrainMapProps {
  trace?: LineString | null;
  bounds?: TraceBounds | null;
}

export function TerrainMap({ trace, bounds }: TerrainMapProps) {
  const { viewport } = useMapStore();

  return (
    <MapLibreGL.MapView
      style={{ flex: 1 }}
      mapStyle={MAP_STYLE_URL}
    >
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
      {trace && <TraceLayer trace={trace} />}
    </MapLibreGL.MapView>
  );
}
