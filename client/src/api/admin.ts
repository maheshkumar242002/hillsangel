import { IBooking } from '../types';
import { initialMockBookings, mockPackages } from '../data/mockData';

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
  await new Promise((resolve) => setTimeout(resolve, 150));

  const admin: AdminUser = {
    id: 'adm-1',
    name: 'Hills Angel Administrator',
    email: credentials.email || 'admin@hillsangels.com',
    role: 'admin',
    lastLogin: new Date().toISOString(),
  };

  const token = 'mock_demo_admin_jwt_token_' + Date.now();
  localStorage.setItem('adminToken', token);
  localStorage.setItem('adminUser', JSON.stringify(admin));

  return {
    success: true,
    token,
    admin,
    message: 'Welcome back! Signed in with Demo credentials.',
  };
};

export const logoutAdmin = async (): Promise<{ success: boolean; message: string }> => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  return {
    success: true,
    message: 'Logged out successfully',
  };
};

export const getAdminMe = async (): Promise<{ success: boolean; admin: AdminUser }> => {
  const stored = localStorage.getItem('adminUser');
  const admin: AdminUser = stored
    ? JSON.parse(stored)
    : {
        id: 'adm-1',
        name: 'Hills Angel Administrator',
        email: 'admin@hillsangels.com',
        role: 'admin',
      };
  return {
    success: true,
    admin,
  };
};

export const getDashboardStats = async (): Promise<DashboardApiResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 100));

  let bookings: IBooking[] = [];
  try {
    const stored = localStorage.getItem('ha_mock_bookings');
    bookings = stored ? JSON.parse(stored) : initialMockBookings;
  } catch (e) {
    bookings = initialMockBookings;
  }

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const stats: DashboardStats = {
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalRevenue: totalRevenue || 58000,
    totalPackages: mockPackages.length,
    activePackages: mockPackages.filter((p) => p.status === 'active').length,
    unreadEnquiries: 1,
  };

  const charts = {
    categorySplit: [
      { name: 'Couple Packages', count: 8, revenue: 178000 },
      { name: 'Stranger Trails', count: 6, revenue: 56000 },
    ],
    tierSplit: [
      { name: 'Premium (3★)', count: 7, revenue: 95000 },
      { name: 'Extra Premium (5★)', count: 7, revenue: 139000 },
    ],
    monthlyTrend: [
      { month: 'Jul', count: 12, revenue: 160000 },
      { month: 'Aug', count: 18, revenue: 245000 },
      { month: 'Sep', count: 24, revenue: 310000 },
      { month: 'Oct', count: 28, revenue: 395000 },
    ],
  };

  return {
    success: true,
    stats,
    charts,
    recentBookings: bookings.slice(0, 5),
  };
};
