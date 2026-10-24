import { create } from 'zustand';
import api from '../api/axios';

export interface ConnectionState {
  isOnline: boolean;
  isDbConnected: boolean;
  latencyMs: number;
  lastChecked: Date | null;
  checking: boolean;
  error: string | null;

  // Actions
  checkConnection: () => Promise<boolean>;
  setOnlineStatus: (status: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isOnline: navigator.onLine,
  isDbConnected: true,
  latencyMs: 0,
  lastChecked: null,
  checking: false,
  error: null,

  setOnlineStatus: (status: boolean) => set({ isOnline: status }),

  checkConnection: async () => {
    if (!navigator.onLine) {
      set({ isOnline: false, isDbConnected: false, latencyMs: 0, error: 'Network offline' });
      return false;
    }

    try {
      set({ checking: true, error: null });
      const startTime = Date.now();
      const res = await api.get('/health', { timeout: 4000 });
      const latency = Date.now() - startTime;

      const isDbOk = res.data?.db === 'connected' || res.data?.status === 'ok' || res.status === 200;
      set({
        isOnline: true,
        isDbConnected: isDbOk,
        latencyMs: latency,
        lastChecked: new Date(),
        checking: false,
        error: null,
      });
      return true;
    } catch (err: any) {
      // Fallback check to vehicles endpoint
      try {
        const startTime = Date.now();
        await api.get('/vehicles?limit=1', { timeout: 4000 });
        const latency = Date.now() - startTime;
        set({
          isOnline: true,
          isDbConnected: true,
          latencyMs: latency,
          lastChecked: new Date(),
          checking: false,
          error: null,
        });
        return true;
      } catch (innerErr: any) {
        set({
          isOnline: navigator.onLine,
          isDbConnected: false,
          latencyMs: 0,
          lastChecked: new Date(),
          checking: false,
          error: innerErr.message || 'Cannot reach API / Database server',
        });
        return false;
      }
    }
  },
}));
