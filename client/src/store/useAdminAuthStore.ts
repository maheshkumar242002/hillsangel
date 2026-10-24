import { create } from 'zustand';
import {
  loginAdmin,
  logoutAdmin,
  getAdminMe,
  getDashboardStats,
  AdminUser,
  DashboardStats,
  LoginResponse,
} from '../api/admin';
import { IBooking } from '../types';

export interface AdminAuthStoreState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  stats: DashboardStats | null;
  charts: {
    categorySplit: Array<{ name: string; count: number; revenue: number }>;
    tierSplit: Array<{ name: string; count: number; revenue: number }>;
    monthlyTrend: Array<{ month: string; count: number; revenue: number }>;
  } | null;
  recentBookings: IBooking[];
  error: string | null;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  fetchDashboardStats: () => Promise<any>;
}

export const useAdminAuthStore = create<AdminAuthStoreState>((set) => ({
  admin: (() => {
    try {
      const saved = localStorage.getItem('adminUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  isAuthenticated: Boolean(localStorage.getItem('adminToken')),
  loading: false,
  stats: null,
  charts: null,
  recentBookings: [],
  error: null,

  login: async (credentials) => {
    try {
      set({ loading: true, error: null });
      const res = await loginAdmin(credentials);
      set({
        admin: res.admin,
        isAuthenticated: true,
        loading: false,
      });
      return res;
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  logout: async () => {
    try {
      await logoutAdmin();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      set({
        admin: null,
        isAuthenticated: false,
        stats: null,
        charts: null,
        recentBookings: [],
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      set({ admin: null, isAuthenticated: false });
      return false;
    }
    try {
      const res = await getAdminMe();
      if (res.success && res.admin) {
        set({ admin: res.admin, isAuthenticated: true });
        localStorage.setItem('adminUser', JSON.stringify(res.admin));
        return true;
      }
      return false;
    } catch {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      set({ admin: null, isAuthenticated: false });
      return false;
    }
  },

  fetchDashboardStats: async () => {
    try {
      set({ loading: true });
      const res = await getDashboardStats();
      set({
        stats: res.stats,
        charts: res.charts,
        recentBookings: res.recentBookings || [],
        loading: false,
      });
      return res;
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },
}));
