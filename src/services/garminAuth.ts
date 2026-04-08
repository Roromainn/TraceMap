// Garmin Connect API Configuration
// NOTE: You need to register your app at https://connect.garmin.com/oauthConfirm
const GARMIN_CONSUMER_KEY = 'YOUR_GARMIN_CONSUMER_KEY';
const GARMIN_CONSUMER_SECRET = 'YOUR_GARMIN_CONSUMER_SECRET';
const GARMIN_BASE_URL = 'https://connect.garmin.com';
const GARMIN_API_URL = 'https://api.garmin.com';

import { GARMIN_ENABLED } from '../config/garminConfig';

// OAuth endpoints
const GARMIN_OAUTH_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth/oauth/request_token';
const GARMIN_OAUTH_AUTHORIZE_URL = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_OAUTH_ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth/oauth/access_token';

export interface GarminTokens {
  oauthToken: string;
  oauthTokenSecret: string;
  expiresIn?: number;
}

export interface GarminProfile {
  userId: string;
  displayName: string;
  fullName: string;
}

export interface GarminActivity {
  activityId: string;
  activityName: string;
  startTimeISO: string;
  elapsedTimeInSeconds: number;
  distanceMetric: number;
  elevationGainMetric: number;
  activityType: string;
  fileFormat: string;
}

class GarminAuthService {
  private redirectUri: string;

  constructor() {
    this.redirectUri = 'tracemap://garmin-callback';
  }

  /**
   * Open URL in browser (dynamic import to avoid native module crash)
   */
  private async openBrowser(url: string): Promise<{ type: string }> {
    try {
      const ExpoWebBrowser = await import('expo-web-browser');
      const result = await ExpoWebBrowser.openBrowserAsync(url, {
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: '#007CC3',
        toolbarColor: '#007CC3',
      });
      return { type: result.type };
    } catch (error) {
      console.error('[GarminAuth] Browser not available:', error);
      return { type: 'cancel' };
    }
  }

  /**
   * Start OAuth 1.0a flow with Garmin Connect
   * This is a placeholder until a proper backend proxy is available.
   * If Garmin integration is disabled, return a clear error message.
   */
  async authenticate(): Promise<{
    authenticated: boolean;
    tokens?: GarminTokens;
    error?: string;
  }> {
    try {
      // Garmin integration guarded behind a feature flag.
      if (!GARMIN_ENABLED) {
        return {
          authenticated: false,
          error: 'Garmin integration is disabled in this environment. Enable GARMIN_ENABLED to use it.',
        };
      }

      // For now, this is a placeholder - full OAuth requires backend proxy
      console.warn('[GarminAuth] Full OAuth flow requires backend proxy. Using manual token flow.');
      // TODO: Implement proper OAuth flow with backend proxy
      // For now, return a placeholder
      return {
        authenticated: false,
        error: 'Garmin OAuth requires backend setup. See docs.',
      };
    } catch (error: any) {
      console.error('[GarminAuth] Authentication error:', error);
      return {
        authenticated: false,
        error: error.message || 'Authentication failed',
      };
    }
  }

  /**
   * Get user profile from Garmin
   */
  async getProfile(_tokens: GarminTokens): Promise<GarminProfile | null> {
    try {
      // Placeholder - requires valid tokens
      return null;
    } catch (error) {
      console.error('[GarminAuth] Get profile error:', error);
      return null;
    }
  }

  /**
   * Get recent activities from Garmin
   */
  async getActivities(
    _tokens: GarminTokens,
    _limit: number = 10,
    _offset: number = 0
  ): Promise<GarminActivity[]> {
    try {
      return [];
    } catch (error) {
      console.error('[GarminAuth] Get activities error:', error);
      return [];
    }
  }

  /**
   * Download activity file (FIT/GPX)
   */
  async downloadActivity(
    _tokens: GarminTokens,
    _activityId: string,
    _format: 'fit' | 'gpx' = 'fit'
  ): Promise<Blob | null> {
    try {
      return null;
    } catch (error) {
      console.error('[GarminAuth] Download activity error:', error);
      return null;
    }
  }
}

// Singleton instance
export const garminAuthService = new GarminAuthService();
