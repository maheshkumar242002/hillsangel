import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import PartnerTieup from '../models/PartnerTieup.js';
import TripSettlement from '../models/TripSettlement.js';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import sequelize from '../config/db.js';

export class PartnerTieupRepository extends BaseRepository {
  constructor() {
    super(PartnerTieup);
  }

  /**
   * Filter partners with search, category, location, and sorting
   */
  async findPartnersWithFilters({ category, type, location, status, pricingModel, search, sort = 'name' }) {
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (type && type !== 'all') where.type = type;
    if (location && location !== 'all') where.location = location;
    if (status && status !== 'all') where.status = status;
    if (pricingModel && pricingModel !== 'all') where.pricingModel = pricingModel;

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { partnerCode: { [Op.like]: term } },
        { location: { [Op.like]: term } },
        { contactPerson: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { address: { [Op.like]: term } },
      ];
    }

    let order = [['name', 'ASC']];
    if (sort === 'createdAt_desc') order = [['createdAt', 'DESC']];
    else if (sort === 'price_asc') order = [['pricePerPerson', 'ASC']];
    else if (sort === 'price_desc') order = [['pricePerPerson', 'DESC']];
    else if (sort === 'rating_desc') order = [['rating', 'DESC']];

    return this.findAll({ where, order });
  }

  /**
   * Aggregates and pricing averages using raw SQL
   */
  async getPartnerStatsRaw() {
    const totalCount = await this.count();
    const stayCount = await this.count({ where: { category: 'stay' } });
    const foodCount = await this.count({ where: { category: 'food' } });
    const activeCount = await this.count({ where: { status: 'active' } });

    let stayAverages = {};
    let foodAverages = {};

    try {
      const [stayRows] = await sequelize.query(`
        SELECT 
          COALESCE(AVG(CASE WHEN pricePerPerson > 0 THEN pricePerPerson END), 0) AS avgStayPerPerson,
          COALESCE(AVG(CASE WHEN pricePerRoom > 0 THEN pricePerRoom END), 0) AS avgStayPerRoom,
          COALESCE(AVG(CASE WHEN pricePerTrip > 0 THEN pricePerTrip END), 0) AS avgStayPerTrip
        FROM partner_tieups
        WHERE category = 'stay' AND status = 'active' AND isDelete = 0
      `);
      stayAverages = stayRows?.[0] || {};
    } catch {
      stayAverages = { avgStayPerPerson: 0, avgStayPerRoom: 0, avgStayPerTrip: 0 };
    }

    try {
      const [foodRows] = await sequelize.query(`
        SELECT 
          COALESCE(AVG(CASE WHEN pricePerPerson > 0 THEN pricePerPerson END), 0) AS avgFoodPerPerson,
          COALESCE(AVG(CASE WHEN pricePerTrip > 0 THEN pricePerTrip END), 0) AS avgFoodPerTrip
        FROM partner_tieups
        WHERE category = 'food' AND status = 'active' AND isDelete = 0
      `);
      foodAverages = foodRows?.[0] || {};
    } catch {
      foodAverages = { avgFoodPerPerson: 0, avgFoodPerTrip: 0 };
    }

    return {
      totalCount,
      stayCount,
      foodCount,
      activeCount,
      stayAverages,
      foodAverages,
    };
  }

  /**
   * Find trip settlements with filters and sorting
   */
  async findSettlementsWithFilters({ status, destination, search, sort = 'createdAt_desc' }) {
    const where = {};

    if (status && status !== 'all') {
      where.overallStatus = status;
    }
    if (destination && destination !== 'all') {
      where.destination = destination;
    }
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { settlementCode: { [Op.like]: term } },
        { tripTitle: { [Op.like]: term } },
        { destination: { [Op.like]: term } },
        { stayPartnerName: { [Op.like]: term } },
        { foodPartnerName: { [Op.like]: term } },
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'date_asc') order = [['tripDate', 'ASC']];
    else if (sort === 'date_desc') order = [['tripDate', 'DESC']];
    else if (sort === 'profit_desc') order = [['netProfit', 'DESC']];

    return TripSettlement.findAll({
      where: { ...where, isDelete: false },
      order,
    });
  }

  /**
   * Find all settlements for commission statistics
   */
  async getAllSettlementsForStats() {
    return TripSettlement.findAll({
      where: { isDelete: false },
      order: [['tripDate', 'DESC']],
    });
  }

  /**
   * Find single settlement by primary key
   */
  async findSettlementById(id) {
    return TripSettlement.findOne({
      where: { id, isDelete: false },
    });
  }

  /**
   * Find settlement by bookingId
   */
  async findSettlementByBookingId(bookingId) {
    return TripSettlement.findOne({
      where: { bookingId, isDelete: false },
    });
  }

  /**
   * Create trip settlement
   */
  async createSettlement(data) {
    return TripSettlement.create(data);
  }

  /**
   * Delete trip settlement (soft or hard)
   */
  async deleteSettlement(id, { hard = false } = {}) {
    const settlement = await TripSettlement.findByPk(id);
    if (!settlement) {
      const err = new Error('Settlement record not found');
      err.statusCode = 404;
      throw err;
    }

    if (hard) {
      await settlement.destroy();
      return { id: settlement.id, hard: true };
    }

    await settlement.update({ isDelete: true, deletedAt: new Date() });
    return { id: settlement.id, isDelete: true };
  }

  /**
   * Count total settlements
   */
  async countSettlements() {
    return TripSettlement.count({ where: { isDelete: false } });
  }

  /**
   * Find active partner by destination location
   */
  async findActivePartnerByDestination(category, destination) {
    return this.findOne({
      where: {
        category,
        status: 'active',
        location: { [Op.like]: `%${destination}%` },
      },
    });
  }

  /**
   * Find any active partner by category
   */
  async findFirstActivePartner(category) {
    return this.findOne({
      where: {
        category,
        status: 'active',
      },
    });
  }

  /**
   * Find unsettled bookings for auto-settlement
   */
  async findUnsettledBookings() {
    return Booking.findAll({
      where: {
        status: { [Op.in]: ['confirmed', 'completed', 'pending'] },
        isDelete: false,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Find booking by bookingId or ID for settlement
   */
  async findBookingForSettlement(bookingId) {
    return Booking.findOne({
      where: {
        [Op.or]: [
          { bookingId: String(bookingId).trim() },
          ...(isNaN(Number(bookingId)) ? [] : [{ id: Number(bookingId) }]),
        ],
        isDelete: false,
      },
    });
  }

  /**
   * Get active settings
   */
  async getSettings() {
    return Settings.findOne({ order: [['createdAt', 'DESC']] });
  }
}

export default new PartnerTieupRepository();
