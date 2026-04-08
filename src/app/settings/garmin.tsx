import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { garminSyncService, GarminSyncState } from '../../services/garminSync';
import { colors } from '../../utils/colors';

export default function GarminConnectScreen() {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState<GarminSyncState | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  useEffect(() => {
    loadConnectionState();
  }, []);

  const loadConnectionState = async () => {
    const state = await garminSyncService.getConnectionState();
    setSyncState(state);
  };

  const handleConnect = async () => {
    setLoading(true);
    
    try {
      const result = await garminSyncService.connect();
      
      if (result.success && result.profile) {
        Alert.alert(
          'Connected!',
          `Welcome ${result.profile.displayName}`,
          [{ text: 'OK', onPress: loadConnectionState }]
        );
      } else {
        Alert.alert('Connection Failed', result.error || 'Failed to connect to Garmin');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Garmin',
      'Are you sure you want to disconnect? You will need to re-authenticate to sync activities.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await garminSyncService.disconnect();
            setSyncState({ isConnected: false, syncedActivitiesCount: 0 });
            Alert.alert('Disconnected', 'Garmin has been disconnected');
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    
    try {
      // Set progress callback
      garminSyncService.setProgressCallback((progress) => {
        setProgress({
          current: progress.current,
          total: progress.total,
          name: progress.activityName,
        });
      });

      const result = await garminSyncService.syncActivities({ limit: 20 });

      if (result.success) {
        if (result.synced > 0) {
          Alert.alert('Sync Complete', `${result.synced} activities synced from Garmin`);
        } else {
          Alert.alert('Sync Complete', 'No new activities to sync');
        }
        await loadConnectionState();
      } else {
        Alert.alert('Sync Failed', result.error || 'Failed to sync activities');
      }
    } catch (error: any) {
      Alert.alert('Sync Error', error.message);
    } finally {
      setSyncing(false);
      setProgress(null);
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialIcons name="fitness-center" size={48} color={colors.primary} />
          <Text style={styles.title}>Garmin Connect</Text>
          <Text style={styles.subtitle}>Sync your activities automatically</Text>
        </View>
      </View>

      {/* Connection Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <MaterialIcons
              name={syncState?.isConnected ? 'check-circle' : 'error'}
              size={24}
              color={syncState?.isConnected ? colors.success : colors.error}
            />
            <Text style={styles.statusText}>
              {syncState?.isConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>

          {syncState?.isConnected && (
            <>
              <View style={styles.infoRow}>
                <MaterialIcons name="sync" size={18} color={colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  Last sync: {formatLastSync(syncState.lastSync)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="directions-run" size={18} color={colors.onSurfaceVariant} />
                <Text style={styles.infoText}>
                  {syncState.syncedActivitiesCount} activities synced
                </Text>
              </View>
            </>
          )}
        </View>

        {!syncState?.isConnected ? (
          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <MaterialIcons name="link" size={20} color={colors.white} />
                <Text style={styles.buttonText}>Connect Garmin</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={handleDisconnect}
          >
            <MaterialIcons name="unlink" size={20} color={colors.error} />
            <Text style={[styles.buttonText, styles.disconnectText]}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sync Section */}
      {syncState?.isConnected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync Activities</Text>
          
          <View style={styles.syncCard}>
            <Text style={styles.syncDescription}>
              Download your recent activities from Garmin Connect. This will import activities that haven't been synced yet.
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.syncButton, syncing && styles.buttonDisabled]}
              onPress={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <>
                  <ActivityIndicator color={colors.white} />
                  <Text style={styles.buttonText}>
                    {progress ? `Syncing ${progress.current}/${progress.total}...` : 'Syncing...'}
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="refresh" size={20} color={colors.white} />
                  <Text style={styles.buttonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>

            {progress && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(progress.current / progress.total) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{progress.name}</Text>
              </View>
            )}
          </View>

          {/* Auto-sync info */}
          <View style={styles.infoCard}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Auto-sync coming soon</Text>
              <Text style={styles.infoDescription}>
                Future updates will automatically sync your Garmin activities in the background every 15 minutes.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.helpCard}>
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>1</Text>
            </View>
            <Text style={styles.helpStepText}>Connect your Garmin account using OAuth</Text>
          </View>
          
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>2</Text>
            </View>
            <Text style={styles.helpStepText}>We'll fetch your recent activities</Text>
          </View>
          
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>3</Text>
            </View>
            <Text style={styles.helpStepText}>Activities are parsed and saved to your account</Text>
          </View>
          
          <View style={styles.helpStep}>
            <View style={styles.helpStepNumber}>
              <Text style={styles.helpStepNumberText}>4</Text>
            </View>
            <Text style={styles.helpStepText}>View your Garmin activities alongside manual imports</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    backgroundColor: colors.white,
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.onSurface,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '600',
    color: colors.onSurface,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  connectButton: {
    backgroundColor: colors.primary,
  },
  disconnectButton: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  syncButton: {
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.white,
  },
  disconnectText: {
    color: colors.error,
  },
  syncCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  syncDescription: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.primary,
    opacity: 0.1,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.primary,
    lineHeight: 20,
  },
  helpCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  helpStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  helpStepNumberText: {
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '800',
    color: colors.white,
  },
  helpStepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lexend',
    fontWeight: '500',
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    paddingTop: 4,
  },
});
