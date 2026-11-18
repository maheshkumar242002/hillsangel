import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Driver from '../models/Driver.js';
import { DriverStatus } from '../enums/index.js';

export const PUBLIC_DRIVER_ATTRIBUTES = [
  'id',
  'name',
  'photoUrl',
  'experienceYears',
  'specialization',
  'languages',
  'rating',
  'status',
  'assignedVehicleReg',
  'totalTripsCompleted',
  'createdAt',
];

export class DriverRepository extends BaseRepository {
  constructor() {
    super(Driver);
  }

  /**
   * Find drivers with query filtering, admin sanitization, and sorting
   */
  async findDrivers({ status, search, isAdmin = false, sort = 'createdAt' } = {}) {
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      const searchConditions = [
        { name: { [Op.like]: `%${search}%` } },
        { assignedVehicleReg: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } },
      ];
      if (isAdmin) {
        searchConditions.push(
          { phone: { [Op.like]: `%${search}%` } },
          { licenseNumber: { [Op.like]: `%${search}%` } },
          { badgeNumber: { [Op.like]: `%${search}%` } }
        );
      }
      where[Op.or] = searchConditions;
    }

    const queryOptions = {
      where,
      order: [['status', 'ASC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
    };

    if (!isAdmin) {
      queryOptions.attributes = PUBLIC_DRIVER_ATTRIBUTES;
    }

    return this.findAll(queryOptions);
  }

  /**
   * Find driver by primary key with optional role-based attribute sanitization
   */
  async findDriverById(id, isAdmin = false) {
    const queryOptions = {};
    if (!isAdmin) {
      queryOptions.attributes = PUBLIC_DRIVER_ATTRIBUTES;
    }
    return this.findById(id, queryOptions);
  }

  /**
   * Check if a driver exists with given phone or license number (optionally excluding a driver ID)
   */
  async findConflict({ phone, licenseNumber }, excludeId = null) {
    const conditions = [];
    if (phone) conditions.push({ phone });
    if (licenseNumber) conditions.push({ licenseNumber });

    if (!conditions.length) return null;

    const where = {
      [Op.or]: conditions,
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    return this.findOne(where);
  }

  /**
   * Find available drivers ready for vehicle assignment
   */
  async findAvailableDrivers() {
    return this.findAll({
      where: { status: DriverStatus.AVAILABLE },
      order: [['rating', 'DESC'], ['name', 'ASC']],
    });
  }
}

export default new DriverRepository();
