import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import VehicleGps from '../models/VehicleGps.js';

export class GpsRepository extends BaseRepository {
  constructor() {
    super(VehicleGps);
  }

  /**
   * Get all tracked vehicles ordered by status and last updated
   */
  async findAllTrackedVehicles() {
    return this.findAll({
      order: [
        ['status', 'ASC'],
        ['updatedAt', 'DESC'],
      ],
    });
  }

  /**
   * Find vehicle by ID, registration number, or device ID
   */
  async findByIdOrRegNumber(identifier) {
    const isNumeric = !isNaN(Number(identifier));
    const where = {
      [Op.or]: [
        { regNumber: String(identifier) },
        { deviceId: String(identifier) },
        ...(isNumeric ? [{ id: Number(identifier) }] : []),
      ],
    };
    return this.findOne({ where });
  }

  /**
   * Find vehicle by registration number or device ID
   */
  async findByRegOrDeviceId(regNumber, deviceId) {
    const conditions = [];
    if (regNumber) conditions.push({ regNumber });
    if (deviceId) conditions.push({ deviceId });

    if (conditions.length === 0) return null;

    return this.findOne({
      where: {
        [Op.or]: conditions,
      },
    });
  }

  /**
   * Reset all vehicles to base coordinates and idle status
   */
  async resetFleetToBase() {
    await VehicleGps.update(
      { speed: 0, status: 'idle', ignition: false },
      { where: { isDelete: false } }
    );
    return this.findAllTrackedVehicles();
  }
}

export default new GpsRepository();
