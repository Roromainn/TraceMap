import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TerrainMap } from '../../components/map/TerrainMap';
import { ImportButton } from '../../components/ui/ImportButton';
import { parseGPX } from '../../services/gpxParser';
import { useMapStore } from '../../stores/mapStore';
import { LineString } from 'geojson';

type Bounds = { ne: [number, number]; sw: [number, number] };

export default function MapScreen() {
  const [trace, setTrace] = useState<LineString | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const { addActivity } = useMapStore();

  const handleFileSelected = async (content: string, fileName: string) => {
    try {
      const parsed = await parseGPX(content);
      setTrace(parsed.trace);

      // Calcul de la bounding box depuis les coordonnées GeoJSON [lng, lat, ?alt]
      const coords = parsed.trace.coordinates;
      const lngs = coords.map(([lng]) => lng);
      const lats = coords.map(([, lat]) => lat);
      setBounds({
        ne: [Math.max(...lngs), Math.max(...lats)],
        sw: [Math.min(...lngs), Math.min(...lats)],
      });

      const title = fileName.replace(/\.gpx$/i, '');
      await addActivity(parsed, title, content); // Pass GPX content for upload
    } catch (error) {
      console.error('Error parsing GPX:', error);
      alert('Impossible de lire le fichier GPX. Vérifiez que le fichier est valide.');
    }
  };

  return (
    <View style={styles.container}>
      <TerrainMap trace={trace} bounds={bounds} />
      <ImportButton onFileSelected={handleFileSelected} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
