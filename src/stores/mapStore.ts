import { create } from 'zustand';

interface MapState {
  viewport: {
    lat: number;
    lng: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  selectedActivityId: string | null;
  dateRange: {
    start: Date;
    end: Date;
  };
  setViewport: (viewport: Partial<MapState['viewport']>) => void;
  setSelectedActivity: (id: string | null) => void;
  setDateRange: (range: { start: Date; end: Date }) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewport: {
    lat: 45.7640,
    lng: 4.8357,
    zoom: 12,
    pitch: 0,
    bearing: 0,
  },
  selectedActivityId: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport }
  })),
  setSelectedActivity: (id) => set({ selectedActivityId: id }),
  setDateRange: (range) => set({ dateRange: range }),
}));
