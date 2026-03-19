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
    
    if (user) {
      // Save to Supabase
      set({ isLoading: true });
      try {
        const id = await createActivityFromGPX(user.id, activity, {
          title,
          rawGpxContent: gpxContent,
          fileName: `${title}.gpx`,
        });
        
        set((state) => ({
          activities: [{ ...activity, id, title, isSaved: true }, ...state.activities],
          selectedActivityId: id,
          isLoading: false,
        }));
        return id;
      } catch (error) {
        console.error('Failed to save activity:', error);
        set({ isLoading: false });
        throw error;
      }
    } else {
      // Save locally only
      const id = 'local-' + Date.now();
      set((state) => ({
        activities: [{ ...activity, id, title, isSaved: false }, ...state.activities],
        selectedActivityId: id,
      }));
      return id;
    }
  },
  
  getActivityById: (id) => get().activities.find((a) => a.id === id),
  
  loadActivities: async () => {
    // TODO: Load from Supabase when implemented
    set({ activities: [] });
  },
  
  refresh: async () => {
    await get().loadActivities();
  },
}));
