import api from './axios';
import { IBooking } from '../types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  admin: AdminUser;
  message?: string;
}

export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalPackages: number;
  activePackages: number;
  unreadEnquiries: number;
}

export interface DashboardApiResponse {
  success: boolean;
  stats: DashboardStats;
  charts: {
    categorySplit: Array<{ name: string; count: number; revenue: number }>;
    tierSplit: Array<{ name: string; count: number; revenue: number }>;
    monthlyTrend: Array<{ month: string; count: number; revenue: number }>;
  };
  recentBookings: IBooking[];
}

export const loginAdmin = async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

export const logoutAdmin = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getAdminMe = async (): Promise<{ success: boolean; admin: AdminUser }> => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const getDashboardStats = async (): Promise<DashboardApiResponse> => {
  const response = await api.get<DashboardApiResponse>('/dashboard/stats');
  return response.data;
};
