import { create } from 'zustand';
import { SpeedUnit } from '../utils/units';

interface SettingsState {
  speedUnit: SpeedUnit;
  setSpeedUnit: (unit: SpeedUnit) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  speedUnit: 'min_km', // Défaut : allure (min/km)
  setSpeedUnit: (unit) => set({ speedUnit: unit }),
}));
