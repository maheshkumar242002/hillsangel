import { create } from 'zustand';
import {
  getPartners,
  getPartnerStats,
  getPartnerById,
  createPartner as apiCreatePartner,
  updatePartner as apiUpdatePartner,
  deletePartner as apiDeletePartner,
  calculateTripSettlement as apiCalculateTripSettlement,
  saveTripSettlement as apiSaveTripSettlement,
  getTripSettlements as apiGetTripSettlements,
  getCommissionStats as apiGetCommissionStats,
  updatePartnerPayoutStatus as apiUpdatePartnerPayoutStatus,
  autoCalculateBookingProfit as apiAutoCalculateBookingProfit,
  autoSettleAllBookings as apiAutoSettleAllBookings,
} from '../api/partners';
import {
  IPartnerTieup,
  IPartnerStats,
  ISettlementCalculation,
  ITripSettlement,
  ICommissionStats,
} from '../types';

export interface PartnerStoreState {
  partners: IPartnerTieup[];
  stats: IPartnerStats | null;
  settlements: ITripSettlement[];
  commissionStats: ICommissionStats | null;
  activeCalculation: ISettlementCalculation | null;
  selectedPartner: IPartnerTieup | null;
  loading: boolean;
  saving: boolean;
  calculating: boolean;
  error: string | null;

  // Actions
  fetchPartners: (params?: any) => Promise<IPartnerTieup[]>;
  fetchPartnerStats: () => Promise<IPartnerStats | null>;
  fetchPartnerById: (id: string | number) => Promise<IPartnerTieup>;
  createPartner: (data: Partial<IPartnerTieup>) => Promise<IPartnerTieup>;
  updatePartner: (id: string | number, data: Partial<IPartnerTieup>) => Promise<IPartnerTieup>;
  deletePartner: (id: string | number) => Promise<void>;
  calculateSettlement: (payload: any) => Promise<ISettlementCalculation>;
  saveTripSettlement: (payload: Partial<ITripSettlement>) => Promise<ITripSettlement>;
  fetchTripSettlements: (params?: any) => Promise<ITripSettlement[]>;
  fetchCommissionStats: () => Promise<ICommissionStats | null>;
  updatePayoutStatus: (settlementId: number | string, payload: any) => Promise<ITripSettlement>;
  autoCalculateBooking: (payload: any) => Promise<any>;
  autoSettleAll: () => Promise<any>;
  setSelectedPartner: (partner: IPartnerTieup | null) => void;
}

export const usePartnerStore = create<PartnerStoreState>((set) => ({
  partners: [],
  stats: null,
  settlements: [],
  commissionStats: null,
  activeCalculation: null,
  selectedPartner: null,
  loading: false,
  saving: false,
  calculating: false,
  error: null,

  fetchPartners: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      const res = await getPartners(params);
      const list = res.partners || [];
      set({ partners: list, loading: false });
      return list;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  fetchPartnerStats: async () => {
    try {
      const res = await getPartnerStats();
      set({ stats: res.stats });
      return res.stats;
    } catch (err: any) {
      console.warn('Failed to fetch partner stats:', err);
      return null;
    }
  },

  fetchPartnerById: async (id) => {
    try {
      set({ loading: true, error: null });
      const res = await getPartnerById(id);
      set({ selectedPartner: res.partner, loading: false });
      return res.partner;
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  createPartner: async (data) => {
    try {
      set({ saving: true, error: null });
      const res = await apiCreatePartner(data);
      set((state) => ({
        partners: [res.partner, ...state.partners],
        saving: false,
      }));
      return res.partner;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  updatePartner: async (id, data) => {
    try {
      set({ saving: true, error: null });
      const res = await apiUpdatePartner(id, data);
      set((state) => ({
        partners: state.partners.map((p) => ((p._id || p.id) === id ? res.partner : p)),
        selectedPartner: state.selectedPartner && (state.selectedPartner._id || state.selectedPartner.id) === id ? res.partner : state.selectedPartner,
        saving: false,
      }));
      return res.partner;
    } catch (err: any) {
      set({ saving: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  deletePartner: async (id) => {
    try {
      await apiDeletePartner(id);
      set((state) => ({
        partners: state.partners.filter((p) => (p._id || p.id) !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  calculateSettlement: async (payload) => {
    try {
      set({ calculating: true });
      const res = await apiCalculateTripSettlement(payload);
      set({ activeCalculation: res.data, calculating: false });
      return res.data;
    } catch (err: any) {
      set({ calculating: false, error: err.message });
      throw err;
    }
  },

  saveTripSettlement: async (payload) => {
    try {
      const res = await apiSaveTripSettlement(payload);
      set((state) => ({
        settlements: [res.settlement, ...state.settlements],
      }));
      return res.settlement;
    } catch (err: any) {
      throw err;
    }
  },

  fetchTripSettlements: async (params = {}) => {
    try {
      set({ loading: true });
      const res = await apiGetTripSettlements(params);
      const list = res.settlements || [];
      set({ settlements: list, loading: false });
      return list;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },

  fetchCommissionStats: async () => {
    try {
      const res = await apiGetCommissionStats();
      set({ commissionStats: res.stats });
      return res.stats;
    } catch (err: any) {
      console.warn('Failed to fetch commission stats:', err);
      return null;
    }
  },

  updatePayoutStatus: async (settlementId, payload) => {
    const res = await apiUpdatePartnerPayoutStatus(settlementId, payload);
    set((state) => ({
      settlements: state.settlements.map((s) => (String(s.id) === String(settlementId) ? res.settlement : s)),
    }));
    return res.settlement;
  },

  autoCalculateBooking: async (payload) => {
    return await apiAutoCalculateBookingProfit(payload);
  },

  autoSettleAll: async () => {
    return await apiAutoSettleAllBookings();
  },

  setSelectedPartner: (partner: IPartnerTieup | null) => set({ selectedPartner: partner }),
}));
