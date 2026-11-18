import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import Enquiry from '../models/Enquiry.js';
import { BookingStatus, EnquiryStatus, PackageStatus } from '../enums/index.js';

export class DashboardRepository {
  /**
   * Fetch counts and raw data required for dashboard calculations
   */
  async getDashboardRawData() {
    const [
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
    ] = await Promise.all([
      Booking.count({ where: { isDelete: false } }),
      Booking.count({ where: { status: BookingStatus.PENDING, isDelete: false } }),
      Booking.count({ where: { status: BookingStatus.CONFIRMED, isDelete: false } }),
      Booking.count({ where: { status: BookingStatus.COMPLETED, isDelete: false } }),
      Booking.count({ where: { status: BookingStatus.CANCELLED, isDelete: false } }),
      Package.count({ where: { isDelete: false } }),
      Package.count({ where: { status: PackageStatus.ACTIVE, isDelete: false } }),
      Enquiry.count({ where: { status: EnquiryStatus.UNREAD, isDelete: false } }),
      Booking.findAll({
        where: { isDelete: false },
        order: [['createdAt', 'DESC']],
        limit: 6,
      }),
      Booking.findAll({
        where: { isDelete: false },
        attributes: ['totalPrice', 'status', 'packageSnapshot', 'createdAt'],
      }),
    ]);

    return {
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
    };
  }
}

export default new DashboardRepository();
