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

export const loginAdmin = async (credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  if (response.data && response.data.success) {
    if (response.data.token) {
      localStorage.setItem('adminToken', response.data.token);
    }
    if (response.data.admin) {
      localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
    }
    return response.data;
  }
  throw new Error(response.data?.message || 'Login failed');
};

export const logoutAdmin = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  return {
    success: true,
    message: 'Logged out successfully',
  };
};

export const getAdminMe = async (): Promise<{ success: boolean; admin: AdminUser }> => {
  const response = await api.get<{ success: boolean; admin: AdminUser }>('/auth/me');
  if (response.data && response.data.success && response.data.admin) {
    localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
    return response.data;
  }
  throw new Error('Unauthorized');
};

export const getDashboardStats = async (): Promise<DashboardApiResponse> => {
  const response = await api.get<DashboardApiResponse>('/dashboard/stats');
  return response.data;
};
