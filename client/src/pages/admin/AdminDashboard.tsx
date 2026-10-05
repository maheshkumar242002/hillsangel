import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  IndianRupee,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getDashboardStats } from '../../api/admin';
import { formatINR, formatDate } from '../../utils/formatters';
import TierBadge from '../../components/common/TierBadge';
import CategoryChip from '../../components/common/CategoryChip';
import { StatCardSkeleton } from '../../components/common/Skeleton';
import { IBooking } from '../../types';

interface DashboardData {
  stats: {
    totalBookings?: number;
    pendingBookings?: number;
    confirmedBookings?: number;
    totalRevenue?: number;
    totalPackages?: number;
    activePackages?: number;
    unreadEnquiries?: number;
  };
  charts: {
    monthlyTrend?: Array<{ month: string; count: number; revenue: number }>;
    categorySplit?: Array<{ name: string; count: number }>;
    tierSplit?: Array<{ name: string; count: number }>;
  };
  recentBookings: IBooking[];
}

export default function AdminDashboard(): React.ReactElement {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const res = await getDashboardStats();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  const { stats, charts, recentBookings } = data || {
    stats: {},
    charts: { monthlyTrend: [], categorySplit: [], tierSplit: [] },
    recentBookings: [],
  };

  const PIE_COLORS = ['#4A7C59', '#C9A227', '#E57373', '#64B5F6'];

  return (
    <div className="space-y-8">
      {/* ================= 1. STAT CARDS (2 cols mobile, 4 cols desktop) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary-dark">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-text">
              {stats.totalBookings || 0}
            </span>
            <span className="text-[11px] text-muted block mt-0.5">All time records</span>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-amber-700">
              {stats.pendingBookings || 0}
            </span>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">Requires action</span>
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Confirmed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700">
              {stats.confirmedBookings || 0}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Ready for departure</span>
          </div>
        </div>

        {/* Total Confirmed Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-gold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-primary-dark">
              {formatINR(stats.totalRevenue || 0)}
            </span>
            <span className="text-[11px] text-muted block mt-0.5">Confirmed & Completed</span>
          </div>
        </div>
      </div>

      {/* ================= 2. CHARTS SECTION (Recharts ResponsiveContainer) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bookings & Revenue Trend (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-text">Booking Trends</h3>
              <p className="text-xs text-muted">Monthly trip volume and customer flow</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {charts.monthlyTrend && charts.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7C70' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7C70' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4A7C59" radius={[6, 6, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                No monthly historical data yet.
              </div>
            )}
          </div>
        </div>

        {/* Category & Tier Breakdown (1 col) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-text">Traveller Splits</h3>
            <p className="text-xs text-muted">Couple vs Stranger & Tiers</p>
          </div>

          <div className="h-48 sm:h-56 w-full">
            {charts.categorySplit && charts.categorySplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categorySplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {charts.categorySplit.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">
                No category data yet.
              </div>
            )}
          </div>

          {/* Quick Package counts summary */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-muted">
            <span>Live Packages: {stats.activePackages || 0} / {stats.totalPackages || 0}</span>
            <Link to="/admin/packages" className="text-primary font-semibold hover:underline">
              Manage →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 3. RECENT BOOKINGS (Card list on mobile, table on desktop) ================= */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-text">Recent Bookings</h3>
            <p className="text-xs text-muted">Latest travel requests received</p>
          </div>
          <Link
            to="/admin/bookings"
            className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline min-h-[40px]"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* MOBILE CARD VIEW (< 768px) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {recentBookings.map((b) => (
            <div key={b._id} className="p-4 rounded-2xl border border-gray-100 bg-surface/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-primary-dark">{b.bookingId}</span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    b.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : b.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-text">{b.customerName} ({b.phone})</p>
                <p className="text-[11px] text-muted">{b.packageSnapshot?.title}</p>
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-muted">{formatDate(b.travelDate)}</span>
                <span className="font-bold text-primary-dark">{formatINR(b.totalPrice)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP TABLE VIEW (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-muted uppercase">
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Package</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-primary-dark">
                    {b.bookingId}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-text">{b.customerName}</p>
                    <p className="text-[11px] text-muted">{b.phone}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-text">{b.packageSnapshot?.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CategoryChip category={b.packageSnapshot?.category} showLabel={false} />
                      <TierBadge tier={b.packageSnapshot?.tier} size="sm" />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted">{formatDate(b.travelDate)}</td>
                  <td className="py-3 px-3 font-semibold text-primary-dark">
                    {formatINR(b.totalPrice)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
