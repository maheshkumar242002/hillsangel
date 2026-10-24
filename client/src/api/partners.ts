import api from './axios';
import {
  IPartnerTieup,
  IPartnerStats,
  ISettlementCalculation,
  ITripSettlement,
  ICommissionStats,
  IPartnerPayoutItem,
} from '../types';

export interface PartnersApiResponse {
  success: boolean;
  count: number;
  partners: IPartnerTieup[];
}

export interface SinglePartnerApiResponse {
  success: boolean;
  message?: string;
  partner: IPartnerTieup;
}

export interface PartnerStatsApiResponse {
  success: boolean;
  stats: IPartnerStats;
}

export interface SettlementApiResponse {
  success: boolean;
  data: ISettlementCalculation;
}

export interface TripSettlementsApiResponse {
  success: boolean;
  count: number;
  settlements: ITripSettlement[];
}

export interface SingleSettlementApiResponse {
  success: boolean;
  message?: string;
  settlement: ITripSettlement;
}

export interface CommissionStatsApiResponse {
  success: boolean;
  stats: ICommissionStats;
}

export const getPartners = async (
  params: {
    category?: string;
    type?: string;
    location?: string;
    status?: string;
    pricingModel?: string;
    search?: string;
    sort?: string;
  } = {}
): Promise<PartnersApiResponse> => {
  const response = await api.get<PartnersApiResponse>('/partners', { params });
  return response.data;
};

export const getPartnerStats = async (): Promise<PartnerStatsApiResponse> => {
  const response = await api.get<PartnerStatsApiResponse>('/partners/stats');
  return response.data;
};

export const getPartnerById = async (id: string | number): Promise<SinglePartnerApiResponse> => {
  const response = await api.get<SinglePartnerApiResponse>(`/partners/${id}`);
  return response.data;
};

export const createPartner = async (
  data: Partial<IPartnerTieup>
): Promise<SinglePartnerApiResponse> => {
  const response = await api.post<SinglePartnerApiResponse>('/partners', data);
  return response.data;
};

export const updatePartner = async (
  id: string | number,
  data: Partial<IPartnerTieup>
): Promise<SinglePartnerApiResponse> => {
  const response = await api.put<SinglePartnerApiResponse>(`/partners/${id}`, data);
  return response.data;
};

export const deletePartner = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(`/partners/${id}`);
  return response.data;
};

export const calculateTripSettlement = async (payload: {
  stayPartnerId?: string | number | null;
  foodPartnerId?: string | number | null;
  persons: number;
  nights: number;
  days: number;
  selectedMeals?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  tripRevenue?: number;
  transportCost?: number;
  miscCost?: number;
  partners?: Array<{
    id?: string;
    name: string;
    phone?: string;
    sharePercent: number;
    upiId?: string;
  }>;
  partner1Percent?: number;
  partner2Percent?: number;
  partner1Name?: string;
  partner2Name?: string;
}): Promise<SettlementApiResponse> => {
  const response = await api.post<SettlementApiResponse>('/partners/calculate-settlement', payload);
  return response.data;
};

export interface AutoCalculateBookingResponse {
  success: boolean;
  message?: string;
  data: {
    booking: {
      id: number;
      bookingId: string;
      customerName: string;
      phone: string;
      travelDate: string;
      destination: string;
      tripTitle: string;
      persons: number;
      nights: number;
      days: number;
      tripRevenue: number;
    };
    stay: any;
    food: any;
    financials: {
      tripRevenue: number;
      stayCost: number;
      foodCost: number;
      transportCost: number;
      miscCost: number;
      totalExpenses: number;
      netProfit: number;
      profitMarginPercent: number;
    };
    partnerSplit: IPartnerPayoutItem[];
    savedSettlement?: ITripSettlement;
  };
}

export const autoCalculateBookingProfit = async (payload: {
  bookingId: string | number;
  stayPartnerId?: string | number | null;
  foodPartnerId?: string | number | null;
  selectedMeals?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  transportCostOverride?: number;
  miscCostOverride?: number;
  saveToLedger?: boolean;
}): Promise<AutoCalculateBookingResponse> => {
  const response = await api.post<AutoCalculateBookingResponse>(
    '/partners/auto-calculate-booking',
    payload
  );
  return response.data;
};

// ==========================================
// TRIP SETTLEMENTS & COMMISSION TRACKING APIs
// ==========================================

export const getTripSettlements = async (
  params: {
    status?: string;
    partnerName?: string;
    destination?: string;
    search?: string;
    sort?: string;
  } = {}
): Promise<TripSettlementsApiResponse> => {
  const response = await api.get<TripSettlementsApiResponse>('/partners/settlements', { params });
  return response.data;
};

export const saveTripSettlement = async (
  data: Partial<ITripSettlement>
): Promise<SingleSettlementApiResponse> => {
  const response = await api.post<SingleSettlementApiResponse>('/partners/settlements', data);
  return response.data;
};

export const getCommissionStats = async (): Promise<CommissionStatsApiResponse> => {
  const response = await api.get<CommissionStatsApiResponse>('/partners/commission-stats');
  return response.data;
};

export const updatePartnerPayoutStatus = async (
  settlementId: number | string,
  payload: {
    partnerIndex?: number;
    partnerName?: string;
    status: 'paid' | 'pending';
    paymentMode?: string;
    paymentRef?: string;
    notes?: string;
  }
): Promise<SingleSettlementApiResponse> => {
  const response = await api.put<SingleSettlementApiResponse>(
    `/partners/settlements/${settlementId}/payout`,
    payload
  );
  return response.data;
};

export const deleteTripSettlement = async (
  id: number | string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/partners/settlements/${id}`
  );
  return response.data;
};

export const autoSettleAllBookings = async (): Promise<{
  success: boolean;
  message: string;
  count: number;
  settled: Array<{ bookingId: string; settlementCode?: string; netProfit?: number }>;
  skipped: string[];
}> => {
  const response = await api.post('/partners/auto-settle-all');
  return response.data;
};

export const uploadPartnerImage = async (formData: FormData): Promise<{ success: boolean; imageUrl: string }> => {
  const response = await api.post<{ success: boolean; imageUrl: string }>('/partners/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

