import { create } from 'zustand';
import {
  getTrackedVehicles,
  getVehicleGpsById,
  simulateGpsStep as apiSimulateGpsStep,
  resetVehiclesGps as apiResetVehiclesGps,
  updateVehicleTelemetry as apiUpdateVehicleTelemetry,
} from '../api/gps';
import { IVehicleGps } from '../types';

export interface GpsStoreState {
  vehicles: IVehicleGps[];
  selectedVehicle: IVehicleGps | null;
  loading: boolean;
  tracking: boolean;
  error: string | null;

  // Actions
  fetchTrackedVehicles: () => Promise<IVehicleGps[]>;
  fetchVehicleGpsById: (id: string | number) => Promise<IVehicleGps>;
  simulateStep: () => Promise<IVehicleGps[]>;
  resetGps: () => Promise<IVehicleGps[]>;
  updateTelemetry: (data: Partial<IVehicleGps>) => Promise<IVehicleGps>;
  setSelectedVehicle: (v: IVehicleGps | null) => void;
  setTracking: (active: boolean) => void;
}

export const useGpsStore = create<GpsStoreState>((set) => ({
  vehicles: [],
  selectedVehicle: null,
  loading: false,
  tracking: false,
  error: null,

  fetchTrackedVehicles: async () => {
    try {
      set({ loading: true, error: null });
      const res = await getTrackedVehicles();
      const list = res.vehicles || [];
      set({ vehicles: list, loading: false });
      return list;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  fetchVehicleGpsById: async (id) => {
    try {
      const res = await getVehicleGpsById(id);
      set({ selectedVehicle: res.vehicle });
      return res.vehicle;
    } catch (err: any) {
      throw err;
    }
  },

  simulateStep: async () => {
    try {
      const res = await apiSimulateGpsStep();
      const list = res.vehicles || [];
      set({ vehicles: list });
      return list;
    } catch (err: any) {
      throw err;
    }
  },

  resetGps: async () => {
    try {
      const res = await apiResetVehiclesGps();
      const list = res.vehicles || [];
      set({ vehicles: list });
      return list;
    } catch (err: any) {
      throw err;
    }
  },

  updateTelemetry: async (data) => {
    try {
      const res = await apiUpdateVehicleTelemetry(data);
      set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === res.vehicle.id ? res.vehicle : v)),
      }));
      return res.vehicle;
    } catch (err: any) {
      throw err;
    }
  },

  setSelectedVehicle: (v) => set({ selectedVehicle: v }),
  setTracking: (active) => set({ tracking: active }),
}));
