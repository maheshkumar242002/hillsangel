import { create } from 'zustand';
import {
  getEnquiries,
  createEnquiry as apiCreateEnquiry,
  updateEnquiryStatus as apiUpdateEnquiryStatus,
  deleteEnquiry as apiDeleteEnquiry,
  getEnquiryWhatsAppLink as apiGetEnquiryWhatsAppLink,
  CreateEnquiryInput,
} from '../api/enquiries';
import { IEnquiry } from '../types';

export interface EnquiryStoreState {
  enquiries: IEnquiry[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  currentPage: number;

  // Actions
  createEnquiry: (input: CreateEnquiryInput) => Promise<any>;
  fetchEnquiries: (params?: { status?: string; page?: number; limit?: number }) => Promise<IEnquiry[]>;
  updateEnquiryStatus: (id: string, status: 'unread' | 'read' | 'replied') => Promise<IEnquiry>;
  deleteEnquiry: (id: string) => Promise<void>;
  getWhatsAppLink: (id: string) => Promise<string>;
}

export const useEnquiryStore = create<EnquiryStoreState>((set) => ({
  enquiries: [],
  loading: false,
  submitting: false,
  error: null,
  total: 0,
  totalPages: 1,
  currentPage: 1,

  createEnquiry: async (input: CreateEnquiryInput) => {
    try {
      set({ submitting: true, error: null });
      const res = await apiCreateEnquiry(input);
      set({ submitting: false });
      return res;
    } catch (err: any) {
      set({ submitting: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  fetchEnquiries: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const res = await getEnquiries(params);
      const list = res.enquiries || [];
      set({
        enquiries: list,
        total: res.total || 0,
        totalPages: res.totalPages || 1,
        currentPage: res.currentPage || 1,
        loading: false,
      });
      return list;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  updateEnquiryStatus: async (id: string, status: 'unread' | 'read' | 'replied') => {
    try {
      const res = await apiUpdateEnquiryStatus(id, status);
      set((state) => ({
        enquiries: state.enquiries.map((e) => (e._id === id || (e as any).id === id ? res.enquiry : e)),
      }));
      return res.enquiry;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  deleteEnquiry: async (id: string) => {
    try {
      await apiDeleteEnquiry(id);
      set((state) => ({
        enquiries: state.enquiries.filter((e) => e._id !== id && (e as any).id !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  getWhatsAppLink: async (id: string) => {
    const res = await apiGetEnquiryWhatsAppLink(id);
    return res.whatsappUrl;
  },
}));
