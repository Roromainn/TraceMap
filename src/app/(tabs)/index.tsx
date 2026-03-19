import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { TerrainMap } from '../../components/map/TerrainMap';
import { ImportButton } from '../../components/ui/ImportButton';
import { parseGPX } from '../../services/gpxParser';
import { useMapStore } from '../../stores/mapStore';
import { useToast } from '../../contexts/ToastContext';
import { colors } from '../../utils/colors';
import { LineString } from 'geojson';

type Bounds = { ne: [number, number]; sw: [number, number] };

export default function MapScreen() {
  const [traces, setTraces] = useState<LineString[]>([]);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { activities, addActivity, loadActivities } = useMapStore();
  const { showSuccess, showError, showInfo } = useToast();

  // Load activities on mount (after login) - only once
  useEffect(() => {
    if (!hasLoadedOnce) {
      loadActivities();
      setHasLoadedOnce(true);
    }
  }, []);

  // Show ALL activity traces on map
  useEffect(() => {
    if (activities.length === 0) return;
    
    // Collect all traces
    const allTraces = activities
      .filter((a) => a.trace?.coordinates?.length > 0)
      .map((a) => a.trace as LineString);
    
    if (allTraces.length > 0) {
      console.log('[Map] Displaying', allTraces.length, 'activities with traces');
      allTraces.forEach((t, i) => {
        console.log(`  Activity ${i + 1}: ${t.coordinates.length} points`);
      });
      
      setTraces(allTraces);
      
      // Calculate bounds to fit ALL traces
      const allCoords = allTraces.flatMap((t) => t.coordinates);
      const lngs = allCoords.map(([lng]: [number, number, number?]) => lng);
      const lats = allCoords.map(([, lat]: [number, number, number?]) => lat);
      
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      // Add 20% padding around all traces
      const lngPadding = (maxLng - minLng) * 0.2 || 0.005;
      const latPadding = (maxLat - minLat) * 0.2 || 0.005;
      
      setBounds({
        ne: [maxLng + lngPadding, maxLat + latPadding],
        sw: [minLng - lngPadding, minLat - latPadding],
      });
      
      showInfo(`${activities.length} activités affichées sur la carte`);
    }
  }, [activities.length]);

  const handleFileSelected = async (content: string, fileName: string, error?: string) => {
    // Handle import errors
    if (error) {
      showError(error);
      return;
    }

    // Handle file picker cancel
    if (!content && !fileName) {
      return;
    }

    setIsParsing(true);
    try {
      const parsed = await parseGPX(content);
      setTraces([parsed.trace]); // Show only the new trace during import

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

      showSuccess(`${title} importé avec succès !`);
    } catch (error: any) {
      console.error('Error parsing GPX:', error);
      showError('Impossible de lire le fichier GPX. Vérifiez que le fichier est valide.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TerrainMap traces={traces} bounds={bounds} />
      {isParsing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <ImportButton onFileSelected={handleFileSelected} disabled={isParsing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
