import { create } from 'zustand';
import { ParsedActivity } from '../services/gpxParser';

interface StoredActivity extends ParsedActivity {
  id: string;
  title: string;
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
  setViewport: (viewport: Partial<MapState['viewport']>) => void;
  setSelectedActivity: (id: string | null) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
  addActivity: (activity: ParsedActivity, title: string) => string;
  getActivityById: (id: string) => StoredActivity | undefined;
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
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport }
  })),
  setSelectedActivity: (id) => set({ selectedActivityId: id }),
  setDateRange: (range) => set({ dateRange: range }),
  addActivity: (activity, title) => {
    const id = 'local-' + Date.now();
    set((state) => ({
      activities: [{ ...activity, id, title }, ...state.activities],
      selectedActivityId: id,
    }));
    return id;
  },
  getActivityById: (id) => get().activities.find((a) => a.id === id),
}));
