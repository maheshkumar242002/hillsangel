import { create } from 'zustand';
import { getSettings, updateSettings as apiUpdateSettings } from '../api/settings';
import { ISettings } from '../types';

export interface SettingsStoreState {
  settings: ISettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<ISettings>;
  updateSettings: (data: Partial<ISettings>) => Promise<ISettings>;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: null,
  loading: false,
  saving: false,
  error: null,

  fetchSettings: async () => {
    try {
      set({ loading: true, error: null });
      const res = await getSettings();
      set({ settings: res.settings, loading: false });
      return res.settings;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  updateSettings: async (data: Partial<ISettings>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiUpdateSettings(data);
      set({ settings: res.settings, saving: false });
      return res.settings;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },
}));
