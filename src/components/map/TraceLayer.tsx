import React, { useMemo } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { FeatureCollection, Feature, LineString } from 'geojson';
import { colors } from '../../utils/colors';

interface TraceLayerProps {
  trace: LineString;
}

export function TraceLayer({ trace }: TraceLayerProps) {
  const sourceId = 'trace-source';
  const layerId = 'trace-layer';

  const geojson: FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: trace,
        properties: {},
      } as Feature,
    ],
  }), [trace]);

  return (
    <>
      <MapLibreGL.ShapeSource
        id={sourceId}
        shape={geojson}
        lineMetrics={true} // Enable for gradient styling
      >
        {/* Outer glow layer (wider, semi-transparent) */}
        <MapLibreGL.LineLayer
          id={`${layerId}-glow`}
          style={{
            lineColor: colors.primary,
            lineWidth: 8,
            lineOpacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
        
        {/* Main trace layer */}
        <MapLibreGL.LineLayer
          id={layerId}
          style={{
            lineColor: colors.primary,
            lineWidth: 4,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      </MapLibreGL.ShapeSource>
    </>
  );
}
