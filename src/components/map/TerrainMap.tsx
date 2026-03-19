import React, { useRef, useEffect } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useMapStore } from '../../stores/mapStore';

// Note: Set your MapTiler access token in .env file
// MapLibreGL.setAccessToken(process.env.MAPTILER_TOKEN);

export function TerrainMap() {
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const { viewport, setViewport } = useMapStore();
  
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCamera({
        centerCoordinate: [viewport.lng, viewport.lat],
        zoomLevel: viewport.zoom,
        pitch: viewport.pitch,
        heading: viewport.bearing,
      });
    }
  }, []);
  
  const onCameraChanged = async (state: any) => {
    const camera = await mapRef.current?.getCamera();
    if (camera) {
      setViewport({
        lat: camera.centerCoordinate[1],
        lng: camera.centerCoordinate[0],
        zoom: camera.zoom,
        pitch: camera.pitch,
        bearing: camera.heading,
      });
    }
  };
  
  return (
    <MapLibreGL.MapView
      ref={mapRef}
      style={{ flex: 1 }}
      styleURL="https://api.maptiler.com/maps/outdoor/style.json?key=YOUR_MAPTILER_TOKEN"
      onCameraChanged={onCameraChanged}
    >
      <MapLibreGL.Camera
        centerCoordinate={[viewport.lng, viewport.lat]}
        zoomLevel={viewport.zoom}
        pitch={viewport.pitch}
        heading={viewport.bearing}
      />
    </MapLibreGL.MapView>
  );
}
