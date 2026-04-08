import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useRecordingStore } from '../../stores/recordingStore';
import { useToast } from '../../contexts/ToastContext';
import { useMapStore } from '../../stores/mapStore';
import { createActivity } from '../../services/activities';
import { TerrainMap } from '../../components/map/TerrainMap';
import { colors } from '../../utils/colors';
import { LineString } from 'geojson';

const ACTIVITY_TYPES = [
  { value: 'run', label: 'Running', icon: 'directions-run', color: '#F97316' },
  { value: 'ride', label: 'Cycling', icon: 'directions-bike', color: '#3B82F6' },
  { value: 'hike', label: 'Hiking', icon: 'hiking', color: '#10B981' },
  { value: 'other', label: 'Other', icon: 'directions-walk', color: '#8B5CF6' },
];

export default function RecordScreen() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { addActivity } = useMapStore();
  
  const {
    status,
    activityType,
    elapsedSeconds,
    session,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = useRecordingStore();

  const [showSummary, setShowSummary] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [selectedType, setSelectedType] = useState<'run' | 'ride' | 'hike' | 'other'>('run');

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const stats = session ? {
    distance: session.totalDistance,
    elevation: session.totalElevation,
    points: session.points,
  } : null;

  const distanceKm = stats ? (stats.distance / 1000).toFixed(2) : '0.00';
  const elevationM = stats ? stats.elevation.toFixed(0) : '0';
  
  const pace = stats && elapsedSeconds > 0 && stats.distance > 0
    ? (elapsedSeconds / (stats.distance / 1000)) / 60
    : 0;
  const paceMin = Math.floor(pace);
  const paceSec = Math.floor((pace - paceMin) * 60);
  const paceStr = paceMin > 0 ? `${paceMin}:${paceSec.toString().padStart(2, '0')}` : '--:--';

  const mapTrace = stats && stats.points.length > 0 ? {
    type: 'LineString' as const,
    coordinates: stats.points.map((p) => [p.lng, p.lat, p.altitude_m]),
  } : null;

  const mapBounds = mapTrace && stats ? {
    ne: [
      Math.max(...stats.points.map((p) => p.lng)) + 0.005,
      Math.max(...stats.points.map((p) => p.lat)) + 0.005,
    ] as [number, number],
    sw: [
      Math.min(...stats.points.map((p) => p.lng)) - 0.005,
      Math.min(...stats.points.map((p) => p.lat)) - 0.005,
    ] as [number, number],
  } : null;

  const handleStart = async () => {
    try {
      await startRecording(selectedType);
    } catch (error: any) {
      showError(error.message || 'Failed to start recording');
    }
  };

  const handleStop = async () => {
    if (elapsedSeconds < 10) {
      Alert.alert(
        'Too Short',
        'Activity must be at least 10 seconds',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await stopRecording();
      setShowSummary(true);
    } catch (error: any) {
      showError(error.message || 'Failed to stop recording');
    }
  };

  const handleSave = async () => {
    try {
      if (!session) return;

      const title = activityName.trim() || `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} - ${new Date().toLocaleDateString()}`;
      
      const activity = {
        trace: {
          type: 'LineString' as const,
          coordinates: session.points.map((p) => [p.lng, p.lat, p.altitude_m]),
        },
        stats: {
          distance_m: session.totalDistance,
          elevation_m: session.totalElevation,
          duration_s: elapsedSeconds,
          avg_speed_ms: session.totalDistance / elapsedSeconds,
          avg_hr: null,
          started_at: session.startTime,
          type: selectedType,
        },
        points: session.points,
      };

      await createActivity(activity, 'recording');
      showSuccess('Activity saved successfully!');
      setShowSummary(false);
      cancelRecording();
      router.push('/(tabs)');
    } catch (error: any) {
      showError(error.message || 'Failed to save activity');
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Activity?',
      'This will delete your recording',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            cancelRecording();
            setShowSummary(false);
            router.push('/(tabs)');
          },
        },
      ]
    );
  };

  if (status === 'idle') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.logo}>KINETIC</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>New Activity</Text>
          <Text style={styles.subtitle}>Select your activity type</Text>

          <View style={styles.typeGrid}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.typeOption,
                  selectedType === type.value && [
                    styles.typeOptionSelected,
                    { borderColor: type.color },
                  ],
                ]}
                onPress={() => setSelectedType(type.value as any)}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={40}
                  color={selectedType === type.value ? type.color : colors.onSurfaceVariant}
                />
                <Text style={[
                  styles.typeLabel,
                  selectedType === type.value && { color: type.color },
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: ACTIVITY_TYPES.find(t => t.value === selectedType)?.color }]}
            onPress={handleStart}
          >
            <MaterialIcons name="play-arrow" size={28} color={colors.white} />
            <Text style={styles.startButtonText}>Start {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'End Activity?',
              'This will delete your current recording',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End', style: 'destructive', onPress: () => {
                  cancelRecording();
                  router.push('/(tabs)');
                }},
              ]
            );
          }}>
            <MaterialIcons name="close" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{activityType?.toUpperCase()}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.mapContainer}>
          {mapTrace && mapBounds ? (
            <TerrainMap traces={[mapTrace]} bounds={mapBounds} enable3D={false} />
          ) : (
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="gps-off" size={48} color={colors.outline} />
              <Text style={styles.mapPlaceholderText}>Waiting for GPS...</Text>
            </View>
          )}
        </View>

        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{distanceKm}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statValue}>{paceStr}</Text>
            <Text style={styles.statLabel}>min/km</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{elevationM}</Text>
            <Text style={styles.statLabel}>elev m</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {status === 'paused' ? 'Paused' : 'Recording...'}
          </Text>
        </View>

        <View style={styles.controls}>
          {status === 'paused' ? (
            <TouchableOpacity style={[styles.controlButton, styles.resumeButton]} onPress={resumeRecording}>
              <MaterialIcons name="play-arrow" size={32} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.controlButton, styles.pauseButton]} onPress={pauseRecording}>
              <MaterialIcons name="pause" size={32} color={colors.white} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
            <MaterialIcons name="stop" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Activity Summary</Text>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <MaterialIcons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {mapTrace && mapBounds && (
                <View style={styles.modalMapContainer}>
                  <TerrainMap traces={[mapTrace]} bounds={mapBounds} enable3D={false} />
                </View>
              )}

              <Text style={styles.sectionLabel}>Activity Name</Text>
              <View style={styles.nameInputContainer}>
                <MaterialIcons name="edit" size={20} color={colors.outline} />
                <TextInput
                  style={styles.nameInput}
                  placeholder="e.g., Morning Run, Evening Ride..."
                  value={activityName}
                  onChangeText={setActivityName}
                  maxLength={50}
                />
              </View>

              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{distanceKm}</Text>
                  <Text style={styles.summaryStatLabel}>Distance (km)</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{formatTime(elapsedSeconds)}</Text>
                  <Text style={styles.summaryStatLabel}>Duration</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{paceStr}</Text>
                  <Text style={styles.summaryStatLabel}>Pace</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryStatValue}>{elevationM}</Text>
                  <Text style={styles.summaryStatLabel}>Elevation (m)</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalButton, styles.discardButton]} onPress={handleDiscard}>
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSave}
              >
                <MaterialIcons name="check" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>Save Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  logo: { fontSize: 24, fontFamily: 'Lexend', fontWeight: '900', fontStyle: 'italic', color: colors.primary, letterSpacing: -1 },
  headerTitle: { fontSize: 17, fontFamily: 'Lexend', fontWeight: '700', color: colors.onSurface },
  content: { flex: 1 },
  contentContainer: { padding: 24 },
  title: { fontSize: 32, fontFamily: 'Lexend', fontWeight: '900', color: colors.onSurface, marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: 'Lexend', fontWeight: '500', color: colors.onSurfaceVariant, marginBottom: 32 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  typeOption: { width: '48%', backgroundColor: colors.surfaceContainerLow, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12, borderWidth: 3, borderColor: 'transparent' },
  typeOptionSelected: { backgroundColor: colors.primaryContainer },
  typeLabel: { fontSize: 15, fontFamily: 'Lexend', fontWeight: '700', color: colors.onSurfaceVariant },
  startButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  startButtonText: { fontSize: 18, fontFamily: 'Lexend', fontWeight: '800', color: colors.white },
  mapContainer: { height: 200, width: '100%', backgroundColor: colors.surfaceContainerLow },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceContainerHigh },
  mapPlaceholderText: { fontSize: 14, fontFamily: 'Lexend', fontWeight: '600', color: colors.outline, marginTop: 8 },
  timerContainer: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.white },
  timer: { fontSize: 64, fontFamily: 'Lexend', fontWeight: '900', color: colors.onSurface, fontVariant: ['tabular-nums'] },
  statsGrid: { flexDirection: 'row', backgroundColor: colors.white, marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.outlineVariant },
  statValue: { fontSize: 24, fontFamily: 'Lexend', fontWeight: '800', color: colors.onSurface },
  statLabel: { fontSize: 11, fontFamily: 'Lexend', fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  statusText: { fontSize: 13, fontFamily: 'Lexend', fontWeight: '600', color: colors.onSurfaceVariant },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 32, padding: 32 },
  controlButton: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  pauseButton: { backgroundColor: colors.primary },
  resumeButton: { backgroundColor: colors.primary },
  stopButton: { backgroundColor: colors.error },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  modalTitle: { fontSize: 20, fontFamily: 'Lexend', fontWeight: '800', color: colors.onSurface },
  modalBody: { padding: 24 },
  modalMapContainer: { height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontFamily: 'Lexend', fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  nameInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 24, gap: 12 },
  nameInput: { flex: 1, fontSize: 16, fontFamily: 'Lexend', fontWeight: '500', color: colors.onSurface },
  summaryStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryStat: { width: '48%', backgroundColor: colors.surfaceContainerLow, borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryStatValue: { fontSize: 24, fontFamily: 'Lexend', fontWeight: '800', color: colors.onSurface },
  summaryStatLabel: { fontSize: 10, fontFamily: 'Lexend', fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 24, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  modalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  discardButton: { backgroundColor: colors.surfaceContainerHigh },
  discardButtonText: { fontSize: 15, fontFamily: 'Lexend', fontWeight: '700', color: colors.onSurfaceVariant },
  saveButton: { backgroundColor: colors.primary },
  saveButtonText: { fontSize: 15, fontFamily: 'Lexend', fontWeight: '700', color: colors.white },
});
