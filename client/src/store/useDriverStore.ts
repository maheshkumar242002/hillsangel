import { create } from 'zustand';
import {
  getDrivers,
  createDriver as apiCreateDriver,
  updateDriver as apiUpdateDriver,
  deleteDriver as apiDeleteDriver,
  uploadDriverPhoto as apiUploadDriverPhoto,
  GetDriversParams,
} from '../api/drivers';
import { IDriverMaster } from '../types';

export interface DriverStoreState {
  drivers: IDriverMaster[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  searchQuery: string;
  selectedStatus: string;

  // Actions
  fetchDrivers: (params?: GetDriversParams) => Promise<IDriverMaster[]>;
  createDriver: (data: Partial<IDriverMaster>) => Promise<IDriverMaster>;
  updateDriver: (id: string | number, data: Partial<IDriverMaster>) => Promise<IDriverMaster>;
  deleteDriver: (id: string | number) => Promise<void>;
  uploadPhoto: (formData: FormData) => Promise<string>;
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: string) => void;
  getFilteredDrivers: () => IDriverMaster[];
  getAvailableDrivers: () => IDriverMaster[];
}

export const useDriverStore = create<DriverStoreState>((set, get) => ({
  drivers: [],
  loading: false,
  saving: false,
  error: null,
  searchQuery: '',
  selectedStatus: 'all',

  fetchDrivers: async (params?: GetDriversParams) => {
    try {
      set({ loading: true, error: null });
      const data = await getDrivers(params);
      set({ drivers: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  createDriver: async (data: Partial<IDriverMaster>) => {
    try {
      set({ saving: true, error: null });
      const created = await apiCreateDriver(data);
      set((state) => ({
        drivers: [created, ...state.drivers],
        saving: false,
      }));
      return created;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  updateDriver: async (id: string | number, data: Partial<IDriverMaster>) => {
    try {
      set({ saving: true, error: null });
      const updated = await apiUpdateDriver(id, data);
      set((state) => ({
        drivers: state.drivers.map((d) => ((d._id || d.id) === id ? updated : d)),
        saving: false,
      }));
      return updated;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  deleteDriver: async (id: string | number) => {
    try {
      await apiDeleteDriver(id);
      set((state) => ({
        drivers: state.drivers.filter((d) => (d._id || d.id) !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  uploadPhoto: async (formData: FormData) => {
    return await apiUploadDriverPhoto(formData);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedStatus: (status: string) => set({ selectedStatus: status }),

  getFilteredDrivers: () => {
    const { drivers, searchQuery, selectedStatus } = get();
    const query = searchQuery.trim().toLowerCase();

    return drivers.filter((d) => {
      const matchesSearch =
        !query ||
        d.name.toLowerCase().includes(query) ||
        d.phone.toLowerCase().includes(query) ||
        d.licenseNumber.toLowerCase().includes(query) ||
        (d.badgeNumber && d.badgeNumber.toLowerCase().includes(query)) ||
        (d.assignedVehicleReg && d.assignedVehicleReg.toLowerCase().includes(query)) ||
        (d.specialization && d.specialization.toLowerCase().includes(query));

      const matchesStatus =
        selectedStatus === 'all' || d.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  },

  getAvailableDrivers: () => {
    return get().drivers.filter((d) => d.status === 'available');
  },
}));
