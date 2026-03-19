import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpeedUnit } from '../utils/units';

interface SettingsState {
  speedUnit: SpeedUnit;
  setSpeedUnit: (unit: SpeedUnit) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      speedUnit: 'min_km', // Défaut : allure (min/km)
      setSpeedUnit: (unit) => set({ speedUnit: unit }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
