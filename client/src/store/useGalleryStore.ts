import { create } from 'zustand';
import {
  getGalleryItems,
  createGalleryItem as apiCreateGalleryItem,
  updateGalleryItem as apiUpdateGalleryItem,
  deleteGalleryItem as apiDeleteGalleryItem,
  uploadGalleryMedia as apiUploadGalleryMedia,
  UploadMediaResponse,
} from '../api/gallery';
import { IGalleryItem } from '../types';

export interface GalleryStoreState {
  items: IGalleryItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchGalleryItems: (params?: { type?: string; tag?: string; featured?: boolean }) => Promise<IGalleryItem[]>;
  createGalleryItem: (data: Partial<IGalleryItem>) => Promise<IGalleryItem>;
  updateGalleryItem: (id: string, data: Partial<IGalleryItem>) => Promise<IGalleryItem>;
  deleteGalleryItem: (id: string) => Promise<void>;
  uploadMedia: (formData: FormData) => Promise<UploadMediaResponse>;
}

export const useGalleryStore = create<GalleryStoreState>((set) => ({
  items: [],
  loading: false,
  saving: false,
  error: null,

  fetchGalleryItems: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const res = await getGalleryItems(params);
      const list = res.items || [];
      set({ items: list, loading: false });
      return list;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  createGalleryItem: async (data: Partial<IGalleryItem>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiCreateGalleryItem(data);
      set((state) => ({
        items: [res.item, ...state.items],
        saving: false,
      }));
      return res.item;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  updateGalleryItem: async (id: string, data: Partial<IGalleryItem>) => {
    try {
      set({ saving: true, error: null });
      const res = await apiUpdateGalleryItem(id, data);
      set((state) => ({
        items: state.items.map((i) => (i._id === id || (i as any).id === id ? res.item : i)),
        saving: false,
      }));
      return res.item;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  deleteGalleryItem: async (id: string) => {
    try {
      await apiDeleteGalleryItem(id);
      set((state) => ({
        items: state.items.filter((i) => i._id !== id && (i as any).id !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  uploadMedia: async (formData: FormData) => {
    return await apiUploadGalleryMedia(formData);
  },
}));
