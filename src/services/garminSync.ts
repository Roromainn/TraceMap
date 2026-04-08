import { garminAuthService, GarminTokens } from './garminAuth';
import { GARMIN_ENABLED } from '../config/garminConfig';
import { fitParser } from './fitParser';
import { createActivityFromFIT, createActivityFromGPX } from './activities';
import { supabase } from './supabase';

export interface GarminSyncState {
  isConnected: boolean;
  lastSync?: Date;
  syncedActivitiesCount: number;
  error?: string;
}

export interface SyncProgress {
  current: number;
  total: number;
  activityName: string;
}

class GarminSyncService {
  private tokens: GarminTokens | null = null;
  private onProgress?: (progress: SyncProgress) => void;

  /**
   * Check if Garmin is connected
   */
  async getConnectionState(): Promise<GarminSyncState> {
    // If Garmin integration is disabled, report as not connected
    if (!GARMIN_ENABLED) {
      return {
        isConnected: false,
        syncedActivitiesCount: 0,
      };
    }
    try {
      // Try to get tokens from secure storage
      const storedTokens = await this.getStoredTokens();
      
      if (!storedTokens) {
        return {
          isConnected: false,
          syncedActivitiesCount: 0,
        };
      }

      this.tokens = storedTokens;

      // Test connection by getting profile
      const profile = await garminAuthService.getProfile(storedTokens);
      
      if (!profile) {
        // Tokens expired, clear them
        await this.clearTokens();
        return {
          isConnected: false,
          syncedActivitiesCount: 0,
        };
      }

      // Get last sync time from storage
      const lastSync = await this.getLastSyncTime();
      const syncedCount = await this.getSyncedActivitiesCount();

      return {
        isConnected: true,
        lastSync,
        syncedActivitiesCount: syncedCount,
      };
    } catch (error: any) {
      console.error('[GarminSync] Connection state error:', error);
      return {
        isConnected: false,
        syncedActivitiesCount: 0,
        error: error.message,
      };
    }
  }

  /**
   * Connect to Garmin Connect
   */
  async connect(): Promise<{
    success: boolean;
    profile?: any;
    error?: string;
  }> {
    try {
      // If Garmin integration is disabled, short-circuit
      if (!GARMIN_ENABLED) {
        return { success: false, error: 'Garmin integration is disabled' };
      }
      // Start OAuth flow
      const result = await garminAuthService.authenticate();
      
      if (!result.authenticated || !result.tokens) {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }

      // Store tokens
      this.tokens = result.tokens;
      await this.storeTokens(result.tokens);

      // Get profile
      const profile = await garminAuthService.getProfile(result.tokens);
      
      if (!profile) {
        return {
          success: false,
          error: 'Failed to get profile',
        };
      }

      return {
        success: true,
        profile,
      };
    } catch (error: any) {
      console.error('[GarminSync] Connect error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Disconnect from Garmin
   */
  async disconnect(): Promise<void> {
    await this.clearTokens();
    this.tokens = null;
  }

  /**
   * Sync activities from Garmin
   */
  async syncActivities(
    options: {
      limit?: number;
      force?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    synced: number;
    error?: string;
  }> {
    // Short-circuit when Garmin is disabled
    if (!GARMIN_ENABLED) {
      return { success: false, synced: 0, error: 'Garmin integration is disabled' };
    }
    const { limit = 20, force = false } = options;

    try {
      if (!this.tokens) {
        // Try to load tokens
        const state = await this.getConnectionState();
        if (!state.isConnected) {
          return {
            success: false,
            synced: 0,
            error: 'Not connected to Garmin',
          };
        }
      }

      if (!this.tokens) {
        throw new Error('No tokens available');
      }

      // Get activities list from Garmin
      const garminActivities = await garminAuthService.getActivities(
        this.tokens,
        limit
      );

      if (garminActivities.length === 0) {
        return {
          success: true,
          synced: 0,
        };
      }

      // Get already synced activity IDs
      const syncedIds = await this.getSyncedActivityIds();
      
      // Filter out already synced activities (unless force)
      const toSync = force
        ? garminActivities
        : garminActivities.filter((a) => !syncedIds.includes(a.activityId));

      if (toSync.length === 0) {
        return {
          success: true,
          synced: 0,
        };
      }

      // Sync each activity
      let syncedCount = 0;
      
      for (let i = 0; i < toSync.length; i++) {
        const activity = toSync[i];
        
        if (this.onProgress) {
          this.onProgress({
            current: i + 1,
            total: toSync.length,
            activityName: activity.activityName,
          });
        }

        try {
          // Download activity file
          const fileBlob = await garminAuthService.downloadActivity(
            this.tokens!,
            activity.activityId,
            activity.fileFormat as 'fit' | 'gpx'
          );

          if (!fileBlob) {
            console.warn(`[GarminSync] Failed to download activity ${activity.activityId}`);
            continue;
          }

          // Convert blob to ArrayBuffer
          const arrayBuffer = await fileBlob.arrayBuffer();

          // Parse based on format
          let parsedActivity;
          
          if (activity.fileFormat === 'fit') {
            const fitResult = await fitParser.parse(arrayBuffer);
            parsedActivity = fitResult.activities[0];
          } else {
            // GPX
            const text = await fileBlob.text();
            const { parseGPX } = await import('./gpxParser');
            parsedActivity = await parseGPX(text);
          }

          if (!parsedActivity) {
            console.warn(`[GarminSync] Failed to parse activity ${activity.activityId}`);
            continue;
          }

          // Save to Supabase
          const { data, error } = await supabase
            .from('activities')
            .insert({
              user_id: (await supabase.auth.getUser()).user.id,
              title: activity.activityName,
              type: parsedActivity.stats.type,
              started_at: parsedActivity.stats.started_at.toISOString(),
              duration_s: parsedActivity.stats.duration_s,
              distance_m: parsedActivity.stats.distance_m,
              elevation_m: parsedActivity.stats.elevation_m,
              avg_speed_ms: parsedActivity.stats.avg_speed_ms,
              avg_hr: parsedActivity.stats.avg_hr,
              trace: parsedActivity.trace,
              source: 'garmin',
              garmin_activity_id: activity.activityId,
            })
            .select()
            .single();

          if (error) {
            console.error(`[GarminSync] Failed to save activity ${activity.activityId}:`, error);
            continue;
          }

          // Save activity points
          if (data && parsedActivity.points.length > 0) {
            const pointsData = parsedActivity.points.map((p: any, index: number) => ({
              activity_id: data.id,
              seq: index,
              lat: p.lat,
              lng: p.lng,
              altitude_m: p.altitude_m,
              speed_ms: p.speed_ms,
              heart_rate: p.heart_rate,
              timestamp: p.timestamp.toISOString(),
            }));

            const { error: pointsError } = await supabase
              .from('activity_points')
              .insert(pointsData);

            if (pointsError) {
              console.error(`[GarminSync] Failed to save points for ${activity.activityId}:`, pointsError);
            }
          }

          syncedCount++;
        } catch (error: any) {
          console.error(`[GarminSync] Error syncing activity ${activity.activityId}:`, error);
          // Continue with next activity
        }
      }

      // Update last sync time
      await this.updateLastSyncTime();

      return {
        success: true,
        synced: syncedCount,
      };
    } catch (error: any) {
      console.error('[GarminSync] Sync error:', error);
      return {
        success: false,
        synced: 0,
        error: error.message,
      };
    }
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: (progress: SyncProgress) => void) {
    this.onProgress = callback;
  }

  /**
   * Store tokens in secure storage
   */
  private async storeTokens(tokens: GarminTokens): Promise<void> {
    const key = 'garmin_tokens';
    await require('expo-secure-store').setItemAsync(
      key,
      JSON.stringify(tokens)
    );
  }

  /**
   * Get tokens from secure storage
   */
  private async getStoredTokens(): Promise<GarminTokens | null> {
    try {
      const key = 'garmin_tokens';
      const stored = await require('expo-secure-store').getItemAsync(key);
      
      if (!stored) {
        return null;
      }

      return JSON.parse(stored);
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear tokens from storage
   */
  private async clearTokens(): Promise<void> {
    const key = 'garmin_tokens';
    await require('expo-secure-store').deleteItemAsync(key);
  }

  /**
   * Get last sync time
   */
  private async getLastSyncTime(): Promise<Date | undefined> {
    try {
      const key = 'garmin_last_sync';
      const stored = await require('expo-secure-store').getItemAsync(key);
      
      if (!stored) {
        return undefined;
      }

      return new Date(stored);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Update last sync time
   */
  private async updateLastSyncTime(): Promise<void> {
    const key = 'garmin_last_sync';
    await require('expo-secure-store').setItemAsync(key, new Date().toISOString());
  }

  /**
   * Get count of synced activities
   */
  private async getSyncedActivitiesCount(): Promise<number> {
    try {
      const { data } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'garmin');

      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get list of synced Garmin activity IDs
   */
  private async getSyncedActivityIds(): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('activities')
        .select('garmin_activity_id')
        .eq('source', 'garmin');

      return (data || []).map((a: any) => a.garmin_activity_id).filter(Boolean);
    } catch (error) {
      return [];
    }
  }
}

// Singleton instance
export const garminSyncService = new GarminSyncService();
