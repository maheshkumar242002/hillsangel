import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import Package from '../models/Package.js';
import Category from '../models/Category.js';
import Tier from '../models/Tier.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';

/**
 * BookingRepository
 * Encapsulates all direct database queries for Bookings, Customers, and related ORM models.
 */
export class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  /**
   * Find package by primary key
   */
  async findPackageById(packageId) {
    return Package.findByPk(packageId);
  }

  /**
   * Find default active package
   */
  async findDefaultActivePackage() {
    return Package.findOne({ where: { status: 'active' } });
  }

  /**
   * Find customer by 10-digit phone number
   */
  async findCustomerByPhone(phone) {
    return Customer.findOne({ where: { phone } });
  }

  /**
   * Create or update customer record
   */
  async upsertCustomer({ name, phone, email, city, spentAmount }) {
    let customer = await this.findCustomerByPhone(phone);
    if (!customer) {
      customer = await Customer.create({
        name: name.trim(),
        phone,
        email: email || null,
        city: city || null,
        totalBookings: 1,
        totalSpent: spentAmount || 0,
      });
    } else {
      customer.totalBookings = (customer.totalBookings || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + (spentAmount || 0);
      if (email && !customer.email) customer.email = email.trim();
      await customer.save();
    }
    return customer;
  }

  /**
   * Find Category and Tier records by their key
   */
  async findCategoryAndTier(categoryKey, tierKey) {
    const [categoryDoc, tierDoc] = await Promise.all([
      categoryKey ? Category.findOne({ where: { key: categoryKey } }) : null,
      tierKey ? Tier.findOne({ where: { key: tierKey } }) : null,
    ]);
    return { categoryDoc, tierDoc };
  }

  /**
   * Find single booking with full associated details
   */
  async findBookingWithDetails(id) {
    return this.findById(id, {
      include: [
        { model: Customer, as: 'customerDetails' },
        { model: Package, as: 'packageDetails' },
        { model: Category, as: 'categoryDetails' },
        { model: Tier, as: 'tierDetails' },
      ],
    });
  }

  /**
   * Find bookings with multi-parameter filtering, search, and pagination
   */
  async findBookingsFiltered({
    status,
    category,
    tier,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = {}) {
    const where = {};

    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    if (category && category !== 'all') {
      where['packageSnapshot.category'] = category.toLowerCase();
    }

    if (tier && tier !== 'all') {
      where['packageSnapshot.tier'] = tier.toLowerCase();
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { bookingId: { [Op.like]: term } },
        { customerName: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
      ];
    }

    if (startDate || endDate) {
      where.travelDate = {};
      if (startDate) where.travelDate[Op.gte] = new Date(startDate);
      if (endDate) where.travelDate[Op.lte] = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: rawBookings, count: total } = await this.model.findAndCountAll({
      where: this.applySoftDeleteScope(where),
      include: [
        { model: Customer, as: 'customerDetails' },
        { model: Package, as: 'packageDetails' },
        { model: Category, as: 'categoryDetails' },
        { model: Tier, as: 'tierDetails' },
      ],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: limitNum,
    });

    const bookings = rawBookings.map((b) => {
      const json = b.toJSON();
      json.customer = json.customerDetails || json.customerId;
      json.package = json.packageDetails || json.packageId;
      json.categoryRef = json.categoryDetails || json.categoryId;
      json.tierRef = json.tierDetails || json.tierId;
      return json;
    });

    return {
      bookings,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
    };
  }

  /**
   * Find all bookings for CSV export
   */
  async findAllForExport() {
    return this.model.findAll({
      where: this.applySoftDeleteScope({}),
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find vehicle by ID or registration number
   */
  async findVehicle(vehicleId, vehicleReg) {
    if (vehicleId) return Vehicle.findByPk(vehicleId);
    if (vehicleReg) return Vehicle.findOne({ where: { regNumber: vehicleReg } });
    return null;
  }

  /**
   * Find driver by ID or name
   */
  async findDriver(driverId, driverName) {
    if (driverId) return Driver.findByPk(driverId);
    if (driverName) return Driver.findOne({ where: { name: driverName } });
    return null;
  }
}

export default new BookingRepository();
