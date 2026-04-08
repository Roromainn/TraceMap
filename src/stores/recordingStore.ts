import { create } from 'zustand';
import { gpsTrackingService, TrackingSession, TrackingStatus } from '../services/gpsTracking';

interface RecordingState {
  status: TrackingStatus;
  activityType: 'run' | 'ride' | 'hike' | 'other' | null;
  session: TrackingSession | null;
  elapsedSeconds: number;
  timerInterval: NodeJS.Timeout | null;
  
  // Actions
  startRecording: (activityType: 'run' | 'ride' | 'hike' | 'other') => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<TrackingSession>;
  cancelRecording: () => void;
  resetTimer: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
  status: 'idle',
  activityType: null,
  session: null,
  elapsedSeconds: 0,
  timerInterval: null,

  startRecording: async (activityType) => {
    try {
      await gpsTrackingService.startSession(activityType);
      
      set({
        status: 'tracking',
        activityType,
        elapsedSeconds: 0,
      });

      // Start timer
      const interval = setInterval(() => {
        set((state) => ({
          elapsedSeconds: state.elapsedSeconds + 1,
        }));
      }, 1000);

      set({ timerInterval: interval });
    } catch (error: any) {
      console.error('[RecordingStore] Start error:', error);
      throw error;
    }
  },

  pauseRecording: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    gpsTrackingService.pause();
    
    set({
      status: 'paused',
      timerInterval: null,
    });
  },

  resumeRecording: () => {
    gpsTrackingService.resume();
    
    const interval = setInterval(() => {
      set((state) => ({
        elapsedSeconds: state.elapsedSeconds + 1,
      }));
    }, 1000);

    set({
      status: 'tracking',
      timerInterval: interval,
    });
  },

  stopRecording: async () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const session = await gpsTrackingService.stop();
    
    set({
      status: 'completed',
      session,
      timerInterval: null,
    });

    return session;
  },

  cancelRecording: () => {
    const { timerInterval } = get();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    gpsTrackingService.cancel();
    
    set({
      status: 'idle',
      activityType: null,
      session: null,
      elapsedSeconds: 0,
      timerInterval: null,
    });
  },

  resetTimer: () => {
    set({ elapsedSeconds: 0 });
  },
}));
