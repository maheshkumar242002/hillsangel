import { create } from 'zustand';
import {
  getAssets,
  getAssetStats,
  getAssetById,
  createAsset as apiCreateAsset,
  updateAsset as apiUpdateAsset,
  deleteAsset as apiDeleteAsset,
  uploadAssetImage as apiUploadAssetImage,
} from '../api/assets';
import { IAsset, IAssetStats } from '../types';

export interface AssetStoreState {
  assets: IAsset[];
  stats: IAssetStats | null;
  selectedAsset: IAsset | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchAssets: (params?: { category?: string; status?: string; search?: string; sort?: string }) => Promise<IAsset[]>;
  fetchAssetStats: () => Promise<IAssetStats | null>;
  fetchAssetById: (id: string) => Promise<IAsset>;
  createAsset: (data: Partial<IAsset>) => Promise<IAsset>;
  updateAsset: (id: string, data: Partial<IAsset>) => Promise<IAsset>;
  deleteAsset: (id: string) => Promise<void>;
  uploadImage: (formData: FormData) => Promise<string>;
  setSelectedAsset: (asset: IAsset | null) => void;
}

export const useAssetStore = create<AssetStoreState>((set) => ({
  assets: [],
  stats: null,
  selectedAsset: null,
  loading: false,
  saving: false,
  error: null,

  fetchAssets: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const res = await getAssets(params);
      const list = res.assets || [];
      set({ assets: list, loading: false });
      return list;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  fetchAssetStats: async () => {
    try {
      const res = await getAssetStats();
      set({ stats: res.stats });
      return res.stats;
    } catch (err: any) {
      console.warn('Failed to fetch asset stats:', err);
      return null;
    }
  },

  fetchAssetById: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const res = await getAssetById(id);
      set({ selectedAsset: res.asset, loading: false });
      return res.asset;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  createAsset: async (data: Partial<IAsset>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiCreateAsset(data);
      set((state) => ({
        assets: [res.asset, ...state.assets],
        saving: false,
      }));
      return res.asset;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  updateAsset: async (id: string, data: Partial<IAsset>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiUpdateAsset(id, data);
      set((state) => ({
        assets: state.assets.map((a) => (a._id === id || (a as any).id === id ? res.asset : a)),
        selectedAsset: state.selectedAsset?._id === id ? res.asset : state.selectedAsset,
        saving: false,
      }));
      return res.asset;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  deleteAsset: async (id: string) => {
    try {
      await apiDeleteAsset(id);
      set((state) => ({
        assets: state.assets.filter((a) => a._id !== id && (a as any).id !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  uploadImage: async (formData: FormData) => {
    const res = await apiUploadAssetImage(formData);
    return res.fileUrl;
  },

  setSelectedAsset: (asset: IAsset | null) => set({ selectedAsset: asset }),
}));
