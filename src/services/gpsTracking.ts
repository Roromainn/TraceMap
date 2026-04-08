import * as Location from 'expo-location';
import { calculateDistance } from '../utils/geo';

export interface TrackingPoint {
  lat: number;
  lng: number;
  altitude_m: number;
  speed_ms: number;
  heart_rate: number | null;
  timestamp: Date;
}

export interface TrackingSession {
  id: string;
  activityType: 'run' | 'ride' | 'hike' | 'other';
  startTime: Date;
  points: TrackingPoint[];
  isPaused: boolean;
  totalDistance: number;
  totalElevation: number;
}

export type TrackingStatus = 'idle' | 'tracking' | 'paused' | 'completed';

class GPSTrackingService {
  private session: TrackingSession | null = null;
  private subscription: Location.LocationSubscription | null = null;
  private lastPoint: TrackingPoint | null = null;
  private status: TrackingStatus = 'idle';

  getStatus(): TrackingStatus {
    return this.status;
  }

  getSession(): TrackingSession | null {
    return this.session;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return backgroundStatus === 'granted';
    } catch (error) {
      console.error('[GPSTracking] Permission error:', error);
      return false;
    }
  }

  async startSession(activityType: 'run' | 'ride' | 'hike' | 'other'): Promise<void> {
    if (this.status === 'tracking') {
      throw new Error('Session already active');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permissions denied');
    }

    this.session = {
      id: Date.now().toString(),
      activityType,
      startTime: new Date(),
      points: [],
      isPaused: false,
      totalDistance: 0,
      totalElevation: 0,
    };

    this.lastPoint = null;
    this.status = 'tracking';

    // Start location updates every 3 seconds
    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000, // 3 seconds
        distanceInterval: 0, // Don't filter by distance
        showsBackgroundLocationIndicator: true,
        allowsBackgroundLocationUpdates: true,
      },
      (location) => {
        if (this.session?.isPaused) return;

        const point: TrackingPoint = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          altitude_m: location.coords.altitude || 0,
          speed_ms: location.coords.speed || 0,
          heart_rate: null, // Will be added from Bluetooth HR monitor later
          timestamp: new Date(location.timestamp),
        };

        this.addPoint(point);
      }
    );

    console.log('[GPSTracking] Session started:', this.session.id);
  }

  private addPoint(point: TrackingPoint): void {
    if (!this.session) return;

    // Calculate distance from last point
    if (this.lastPoint) {
      const distance = calculateDistance(
        this.lastPoint.lat,
        this.lastPoint.lng,
        point.lat,
        point.lng
      );

      // Filter GPS noise (< 2m)
      if (distance < 0.002) return;

      this.session.totalDistance += distance;

      // Calculate elevation gain
      const elevationDiff = point.altitude_m - this.lastPoint.altitude_m;
      if (elevationDiff > 0) {
        this.session.totalElevation += elevationDiff;
      }
    }

    this.session.points.push(point);
    this.lastPoint = point;
  }

  pause(): void {
    if (!this.session || this.status !== 'tracking') return;
    this.session.isPaused = true;
    this.status = 'paused';
    console.log('[GPSTracking] Session paused');
  }

  resume(): void {
    if (!this.session || this.status !== 'paused') return;
    this.session.isPaused = false;
    this.status = 'tracking';
    console.log('[GPSTracking] Session resumed');
  }

  async stop(): Promise<TrackingSession> {
    if (!this.session) {
      throw new Error('No active session');
    }

    // Stop location updates
    if (this.subscription) {
      await this.subscription.remove();
      this.subscription = null;
    }

    const completedSession = { ...this.session };
    this.session = null;
    this.lastPoint = null;
    this.status = 'completed';

    console.log('[GPSTracking] Session stopped:', completedSession.id);
    return completedSession;
  }

  cancel(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.session = null;
    this.lastPoint = null;
    this.status = 'idle';
    console.log('[GPSTracking] Session cancelled');
  }

  getCurrentStats() {
    if (!this.session) {
      return null;
    }

    const now = new Date();
    const elapsedSeconds = (now.getTime() - this.session.startTime.getTime()) / 1000;
    
    // Active time (excluding pauses)
    const activeSeconds = this.session.isPaused 
      ? elapsedSeconds 
      : elapsedSeconds; // Could be more precise with pause tracking

    const distanceKm = this.session.totalDistance / 1000;
    const avgSpeed = activeSeconds > 0 ? this.session.totalDistance / activeSeconds : 0;
    const pace = avgSpeed > 0 ? (1000 / (avgSpeed * 60)) : 0; // min/km

    return {
      duration: elapsedSeconds,
      distance: this.session.totalDistance,
      elevation: this.session.totalElevation,
      avgSpeed,
      pace,
      points: this.session.points.length,
    };
  }
}

// Singleton instance
export const gpsTrackingService = new GPSTrackingService();
