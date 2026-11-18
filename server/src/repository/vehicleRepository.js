import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Vehicle from '../models/Vehicle.js';
import AssetExpense from '../models/AssetExpense.js';

export class VehicleRepository extends BaseRepository {
  constructor() {
    super(Vehicle);
  }

  /**
   * Find vehicle with associated expenses
   */
  async findWithExpenses(id) {
    return this.findById(id, {
      include: [
        { model: AssetExpense, as: 'expenses' },
      ],
    });
  }

  /**
   * Find vehicle by registration plate number
   */
  async findByRegistration(registrationNumber, excludeId = null) {
    const where = { registrationNumber };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.findOne(where);
  }

  /**
   * Find vehicles with mode, persons, and status filters
   */
  async findVehiclesFiltered({ mode, persons, status, vehicleType } = {}) {
    const where = {};

    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['available', 'on_tour'] };
    }

    if (mode === 'rental') {
      where.isAvailableForRental = true;
    } else if (mode === 'tour') {
      where.isAvailableForTour = true;
    }

    if (persons) {
      const numPersons = parseInt(persons, 10);
      if (!isNaN(numPersons)) {
        where.seatingCapacity = { [Op.gte]: numPersons };
      }
    }

    if (vehicleType && vehicleType !== 'all') {
      where.vehicleType = vehicleType;
    }

    return this.findAll({
      where: this.applySoftDeleteScope(where),
      order: [
        ['sortOrder', 'ASC'],
        ['isAvailableForRental', 'DESC'],
        ['name', 'ASC'],
      ],
    });
  }
}

export default new VehicleRepository();
