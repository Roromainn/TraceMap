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
      >
        <MapLibreGL.LineLayer
          id={layerId}
          testID="trace-layer"
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
