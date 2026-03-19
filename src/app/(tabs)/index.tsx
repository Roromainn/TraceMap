import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
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
  const [enable3D, setEnable3D] = useState(false);
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
      <TerrainMap traces={traces} bounds={bounds} enable3D={enable3D} />
      {isParsing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <ImportButton onFileSelected={handleFileSelected} disabled={isParsing} />
      
      {/* 3D Toggle Button */}
      <TouchableOpacity
        style={[styles.btn3D, enable3D && styles.btn3DActive]}
        onPress={() => {
          setEnable3D(!enable3D);
          showInfo(enable3D ? 'Mode 2D activé' : 'Mode 3D activé');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.btn3DText}>{enable3D ? '🏔️ 3D' : '🗺️ 2D'}</Text>
      </TouchableOpacity>
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
  btn3D: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  btn3DActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  btn3DText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.darkGray,
  },
});
