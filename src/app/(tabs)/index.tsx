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
  const [trace, setTrace] = useState<LineString | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const { activities, addActivity, loadActivities } = useMapStore();
  const { showSuccess, showError, showInfo } = useToast();

  // Load activities on mount (after login)
  useEffect(() => {
    loadActivities();
  }, []);

  // Show most recent activity trace on map
  useEffect(() => {
    if (activities.length > 0 && activities[0].trace?.coordinates?.length > 0) {
      const activityTrace = activities[0].trace as LineString;
      setTrace(activityTrace);
      
      console.log('[Map] Loading trace with', activityTrace.coordinates.length, 'points');
      
      // Calculate bounds with padding
      const coords = activityTrace.coordinates;
      const lngs = coords.map(([lng]: [number, number, number?]) => lng);
      const lats = coords.map(([, lat]: [number, number, number?]) => lat);
      
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      
      // Add 20% padding around the trace
      const lngPadding = (maxLng - minLng) * 0.2 || 0.01;
      const latPadding = (maxLat - minLat) * 0.2 || 0.01;
      
      setBounds({
        ne: [maxLng + lngPadding, maxLat + latPadding],
        sw: [minLng - lngPadding, minLat - latPadding],
      });
      
      showInfo(`${activities[0].title} affiché sur la carte`);
    }
  }, [activities]);

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
      <TerrainMap trace={trace} bounds={bounds} />
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
