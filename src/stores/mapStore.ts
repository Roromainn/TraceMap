import { create } from 'zustand';
import { ParsedActivity } from '../services/gpxParser';
import { createActivityFromGPX, getCurrentUser } from '../services/activities';

interface StoredActivity extends ParsedActivity {
  id: string;
  title: string;
  isSaved?: boolean; // true if saved to Supabase
}

interface MapState {
  viewport: {
    lat: number;
    lng: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  selectedActivityId: string | null;
  activities: StoredActivity[];
  dateRange: {
    start: Date;
    end: Date;
  };
  isLoading: boolean;
  setViewport: (viewport: Partial<MapState['viewport']>) => void;
  setSelectedActivity: (id: string | null) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
  addActivity: (activity: ParsedActivity, title: string, gpxContent?: string) => Promise<string>;
  getActivityById: (id: string) => StoredActivity | undefined;
  loadActivities: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  viewport: {
    lat: 45.7640,
    lng: 4.8357,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  },
  selectedActivityId: null,
  activities: [],
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  isLoading: false,
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport }
  })),
  setSelectedActivity: (id) => set({ selectedActivityId: id }),
  setDateRange: (range) => set({ dateRange: range }),
  
  addActivity: async (activity, title, gpxContent) => {
    const user = await getCurrentUser();
    
    console.log('[MapStore] addActivity called:', {
      title,
      hasUser: !!user,
      userId: user?.id,
      pointsCount: activity.points.length,
      hasHR: activity.points.some((p) => p.heart_rate !== null),
    });
    
    // Optimistic save: show immediately in UI
    const id = user ? 'supabase-' + Date.now() : 'local-' + Date.now();
    
    set((state) => ({
      activities: [{ ...activity, id, title, isSaved: !!user }, ...state.activities],
      selectedActivityId: id,
    }));
    
    if (user) {
      // Save to Supabase in background (don't block UI)
      set({ isLoading: true });
      try {
        console.log('[MapStore] Saving to Supabase in background...');
        const supabaseId = await createActivityFromGPX(user.id, activity, {
          title,
          rawGpxContent: gpxContent,
          fileName: `${title}.gpx`,
        });
        
        console.log('[MapStore] Saved successfully with ID:', supabaseId);
        
        // Update the activity with the real Supabase ID
        set((state) => ({
          activities: state.activities.map((a) => 
            a.id === id ? { ...a, id: supabaseId, isSaved: true } : a
          ),
          isLoading: false,
        }));
        
        return supabaseId;
      } catch (error: any) {
        console.error('[MapStore] Failed to save activity:', error);
        alert(`Erreur sauvegarde: ${error.message}`);
        set({ isLoading: false });
        throw error;
      }
    } else {
      // Save locally only
      console.log('[MapStore] No user, saving locally');
      return id;
    }
  },
  
  getActivityById: (id) => get().activities.find((a) => a.id === id),
  
  loadActivities: async () => {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('[MapStore] No user, skipping load');
      set({ activities: [] });
      return;
    }
    
    console.log('[MapStore] Loading activities for user:', user.id);
    set({ isLoading: true });
    
    try {
      const { getActivities } = await import('../services/activities');
      const activities = await getActivities(user.id);
      
      console.log('[MapStore] Loaded', activities.length, 'activities from Supabase');
      
      // Convert to StoredActivity format
      const storedActivities = activities.map((a) => ({
        ...a,
        stats: {
          distance_m: a.distance_m,
          elevation_m: a.elevation_m,
          duration_s: a.duration_s,
          avg_speed_ms: a.avg_speed_ms,
          avg_hr: a.avg_hr,
          started_at: new Date(a.started_at),
          type: a.type,
        },
        points: [], // Will be loaded on demand when viewing detail
        trace: {
          type: 'LineString' as const,
          coordinates: [], // Will be loaded on demand
        },
      }));
      
      set({ 
        activities: storedActivities,
        isLoading: false,
      });
    } catch (error) {
      console.error('[MapStore] Failed to load activities:', error);
      set({ activities: [], isLoading: false });
    }
  },
  
  refresh: async () => {
    await get().loadActivities();
  },
}));
