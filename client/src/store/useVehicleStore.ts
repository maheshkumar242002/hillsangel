import { create } from 'zustand';
import {
  getVehicles,
  createVehicle as apiCreateVehicle,
  updateVehicle as apiUpdateVehicle,
  deleteVehicle as apiDeleteVehicle,
  uploadVehicleImages as apiUploadVehicleImages,
  startTripInspection as apiStartTripInspection,
  endTripInspection as apiEndTripInspection,
  GetVehiclesParams,
} from '../api/vehicles';
import { IVehicleMaster } from '../types';

export interface VehicleStoreState {
  vehicles: IVehicleMaster[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  searchQuery: string;
  selectedType: string;

  // Actions
  fetchVehicles: (params?: GetVehiclesParams) => Promise<IVehicleMaster[]>;
  createVehicle: (data: Partial<IVehicleMaster>) => Promise<IVehicleMaster>;
  updateVehicle: (id: string | number, data: Partial<IVehicleMaster>) => Promise<IVehicleMaster>;
  deleteVehicle: (id: string | number) => Promise<void>;
  uploadPhotos: (formData: FormData) => Promise<string[]>;
  startTrip: (
    id: string | number,
    data: {
      startOdometerKm: number;
      fuelLevel: string;
      conditionPhotos: string[];
      driverName?: string;
      driverPhone?: string;
      customerName?: string;
      destination?: string;
      remarks?: string;
      bookingId?: string;
    }
  ) => Promise<IVehicleMaster>;
  endTrip: (
    id: string | number,
    data: {
      endOdometerKm: number;
      returnFuelLevel: string;
      returnConditionPhotos: string[];
      closingRemarks?: string;
    }
  ) => Promise<IVehicleMaster>;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: string) => void;
  getFilteredVehicles: () => IVehicleMaster[];
}

export const useVehicleStore = create<VehicleStoreState>((set, get) => ({
  vehicles: [],
  loading: false,
  saving: false,
  error: null,
  searchQuery: '',
  selectedType: 'all',

  fetchVehicles: async (params?: GetVehiclesParams) => {
    try {
      set({ loading: true, error: null });
      const data = await getVehicles(params);
      set({ vehicles: data, loading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch fleet from database';
      set({ error: msg, loading: false });
      throw err;
    }
  },

  createVehicle: async (data: Partial<IVehicleMaster>) => {
    try {
      set({ saving: true, error: null });
      const created = await apiCreateVehicle(data);
      set((state) => ({
        vehicles: [...state.vehicles, created],
        saving: false,
      }));
      return created;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || 'Failed to create vehicle' });
      throw err;
    }
  },

  updateVehicle: async (id: string | number, data: Partial<IVehicleMaster>) => {
    try {
      set({ saving: true, error: null });
      const updated = await apiUpdateVehicle(id, data);
      set((state) => ({
        vehicles: state.vehicles.map((v) => ((v._id || v.id) === id ? updated : v)),
        saving: false,
      }));
      return updated;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || 'Failed to update vehicle' });
      throw err;
    }
  },

  deleteVehicle: async (id: string | number) => {
    try {
      await apiDeleteVehicle(id);
      set((state) => ({
        vehicles: state.vehicles.filter((v) => (v._id || v.id) !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to delete vehicle' });
      throw err;
    }
  },

  uploadPhotos: async (formData: FormData) => {
    return await apiUploadVehicleImages(formData);
  },

  startTrip: async (id, inspectionData) => {
    const updated = await apiStartTripInspection(id, inspectionData);
    set((state) => ({
      vehicles: state.vehicles.map((v) => ((v._id || v.id) === id ? updated : v)),
    }));
    return updated;
  },

  endTrip: async (id, returnData) => {
    const updated = await apiEndTripInspection(id, returnData);
    set((state) => ({
      vehicles: state.vehicles.map((v) => ((v._id || v.id) === id ? updated : v)),
    }));
    return updated;
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedType: (type: string) => set({ selectedType: type }),

  getFilteredVehicles: () => {
    const { vehicles, searchQuery, selectedType } = get();
    const query = searchQuery.trim().toLowerCase();

    return vehicles.filter((v) => {
      const matchesSearch =
        !query ||
        v.name.toLowerCase().includes(query) ||
        v.regNumber.toLowerCase().includes(query) ||
        (v.driverName && v.driverName.toLowerCase().includes(query)) ||
        (v.rcNumber && v.rcNumber.toLowerCase().includes(query));

      const matchesType =
        selectedType === 'all' || v.vehicleType === selectedType;

      return matchesSearch && matchesType;
    });
  },
}));
