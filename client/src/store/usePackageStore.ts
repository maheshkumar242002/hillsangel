import { create } from 'zustand';
import {
  getPackages,
  getPackageBySlug,
  getFeaturedPackages,
  getDestinations,
  createPackage as apiCreatePackage,
  updatePackage as apiUpdatePackage,
  deletePackage as apiDeletePackage,
  togglePackageStatus as apiTogglePackageStatus,
  uploadPackageImages as apiUploadPackageImages,
  GetPackagesParams,
} from '../api/packages';
import { IPackage } from '../types';

export interface PackageStoreState {
  packages: IPackage[];
  featuredPackages: IPackage[];
  destinations: Array<{ name: string; count: number; image?: string; minPrice?: number }>;
  selectedPackage: IPackage | null;
  counterpartPackage: IPackage | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  currentPage: number;

  // Actions
  fetchPackages: (params?: GetPackagesParams) => Promise<IPackage[]>;
  fetchPackageBySlug: (slug: string) => Promise<{ package: IPackage; counterpart?: IPackage | null }>;
  fetchFeaturedPackages: () => Promise<IPackage[]>;
  fetchDestinations: () => Promise<any[]>;
  createPackage: (data: Partial<IPackage>) => Promise<IPackage>;
  updatePackage: (id: string, data: Partial<IPackage>) => Promise<IPackage>;
  deletePackage: (id: string) => Promise<void>;
  togglePackageStatus: (id: string) => Promise<IPackage>;
  uploadMedia: (formData: FormData) => Promise<any>;
  setSelectedPackage: (pkg: IPackage | null) => void;
}

export const usePackageStore = create<PackageStoreState>((set) => ({
  packages: [],
  featuredPackages: [],
  destinations: [],
  selectedPackage: null,
  counterpartPackage: null,
  loading: false,
  saving: false,
  error: null,
  total: 0,
  totalPages: 1,
  currentPage: 1,

  fetchPackages: async (params?: GetPackagesParams) => {
    try {
      set({ loading: true, error: null });
      const res = await getPackages(params);
      set({
        packages: res.packages || [],
        total: res.total || 0,
        totalPages: res.totalPages || 1,
        currentPage: res.currentPage || 1,
        loading: false,
      });
      return res.packages || [];
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  fetchPackageBySlug: async (slug: string) => {
    try {
      set({ loading: true, error: null });
      const res = await getPackageBySlug(slug);
      set({
        selectedPackage: res.package,
        counterpartPackage: res.counterpart || null,
        loading: false,
      });
      return { package: res.package, counterpart: res.counterpart };
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  fetchFeaturedPackages: async () => {
    try {
      const res = await getFeaturedPackages();
      const list = res.packages || [];
      set({ featuredPackages: list });
      return list;
    } catch (err: any) {
      console.warn('Failed to fetch featured packages:', err);
      return [];
    }
  },

  fetchDestinations: async () => {
    try {
      const res = await getDestinations();
      const list = res.destinations || [];
      set({ destinations: list });
      return list;
    } catch (err: any) {
      console.warn('Failed to fetch destinations:', err);
      return [];
    }
  },

  createPackage: async (data: Partial<IPackage>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiCreatePackage(data);
      set((state) => ({
        packages: [res.package, ...state.packages],
        saving: false,
      }));
      return res.package;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  updatePackage: async (id: string, data: Partial<IPackage>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiUpdatePackage(id, data);
      set((state) => ({
        packages: state.packages.map((p) => (p._id === id || (p as any).id === id ? res.package : p)),
        selectedPackage: state.selectedPackage?._id === id ? res.package : state.selectedPackage,
        saving: false,
      }));
      return res.package;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  deletePackage: async (id: string) => {
    try {
      await apiDeletePackage(id);
      set((state) => ({
        packages: state.packages.filter((p) => p._id !== id && (p as any).id !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  togglePackageStatus: async (id: string) => {
    try {
      const res = await apiTogglePackageStatus(id);
      set((state) => ({
        packages: state.packages.map((p) => (p._id === id || (p as any).id === id ? res.package : p)),
      }));
      return res.package;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  uploadMedia: async (formData: FormData) => {
    return await apiUploadPackageImages(formData);
  },

  setSelectedPackage: (pkg: IPackage | null) => set({ selectedPackage: pkg }),
}));
