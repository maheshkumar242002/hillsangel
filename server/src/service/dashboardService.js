import dashboardRepository from '../repository/dashboardRepository.js';
import { BookingStatus } from '../enums/index.js';

export class DashboardService {
  /**
   * Aggregate and calculate admin dashboard metrics, trends, and charts
   */
  async getDashboardStats() {
    const rawData = await dashboardRepository.getDashboardRawData();

    const {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalPackages,
      activePackages,
      unreadEnquiries,
      recentBookings,
      allBookingsForMetrics,
    } = rawData;

    let totalRevenue = 0;
    const catMap = {
      family: { count: 0, revenue: 0 },
      friends: { count: 0, revenue: 0 },
    };
    const tierMap = {
      premium: { count: 0, revenue: 0 },
      extra_premium: { count: 0, revenue: 0 },
    };

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map();

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, { month: key, count: 0, revenue: 0 });
    }

    allBookingsForMetrics.forEach((b) => {
      const price = Number(b.totalPrice) || 0;
      const isPaid = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(b.status);

      if (isPaid) {
        totalRevenue += price;
      }

      const snap = b.packageSnapshot || {};
      const cat = (snap.category || 'couple').toLowerCase();
      const tier = (snap.tier || 'premium').toLowerCase();

      if (catMap[cat]) {
        catMap[cat].count += 1;
        catMap[cat].revenue += price;
      }

      if (tierMap[tier]) {
        tierMap[tier].count += 1;
        tierMap[tier].revenue += price;
      }

      const created = new Date(b.createdAt);
      if (created >= twelveMonthsAgo) {
        const mKey = `${monthNames[created.getMonth()]} ${created.getFullYear()}`;
        if (monthlyMap.has(mKey)) {
          const item = monthlyMap.get(mKey);
          item.count += 1;
          item.revenue += price;
        }
      }
    });

    return {
      stats: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        totalPackages,
        activePackages,
        unreadEnquiries,
      },
      charts: {
        categorySplit: [
          { name: 'Family Trip', count: catMap.family?.count || 0, revenue: catMap.family?.revenue || 0 },
          { name: 'Friends Trip', count: catMap.friends?.count || 0, revenue: catMap.friends?.revenue || 0 },
        ],
        tierSplit: [
          { name: 'Extra Premium', count: tierMap.extra_premium.count, revenue: tierMap.extra_premium.revenue },
          { name: 'Premium', count: tierMap.premium.count, revenue: tierMap.premium.revenue },
        ],
        monthlyTrend: Array.from(monthlyMap.values()),
      },
      recentBookings,
    };
  }
}

export default new DashboardService();
