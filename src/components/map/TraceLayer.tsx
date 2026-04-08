import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { FeatureCollection, Feature, LineString } from 'geojson';
import { colors } from '../../utils/colors';

interface TraceLayerProps {
  trace: LineString;
  color?: string; // Optional custom color
  index?: number; // For unique IDs
}

export function TraceLayer({ trace, color, index = 0 }: TraceLayerProps) {
  const sourceId = `trace-source-${index}`;
  const layerId = `trace-layer-${index}`;
  const traceColor = color || colors.primary;

  const geojson: FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: trace,
        properties: {},
      } as Feature,
    ],
  }), [trace, index]);

  return (
    <MapLibreGL.ShapeSource
      id={sourceId}
      shape={geojson}
    >
      {/* Single trace layer for performance */}
      <MapLibreGL.LineLayer
        id={layerId}
        style={{
          lineColor: traceColor,
          lineWidth: 4,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </MapLibreGL.ShapeSource>
  );
}
