import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TerrainMap } from '../components/map/TerrainMap';
import { TraceLayer } from '../components/map/TraceLayer';
import { ImportButton } from '../components/ui/ImportButton';
import { parseGPX, ParsedActivity } from '../services/gpxParser';
import { useMapStore } from '../stores/mapStore';
import { LineString } from 'geojson';

export default function MapScreen() {
  const [trace, setTrace] = useState<LineString | null>(null);
  const { setSelectedActivity } = useMapStore();
  
  const handleFileSelected = async (content: string, fileName: string) => {
    try {
      const parsed = await parseGPX(content);
      setTrace(parsed.trace);
      
      // Store in map store for detail screen
      setSelectedActivity('temp-' + Date.now());
      
      // TODO: Update viewport to fit trace bbox
    } catch (error) {
      console.error('Error parsing GPX:', error);
      alert('Failed to parse GPX file');
    }
  };
  
  return (
    <View style={styles.container}>
      <TerrainMap />
      {trace && <TraceLayer trace={trace} />}
      <ImportButton onFileSelected={handleFileSelected} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
