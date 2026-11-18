import { BaseService } from './BaseService.js';
import driverRepository from '../repository/driverRepository.js';
import uploadService from './uploadService.js';
import { DriverStatus } from '../enums/index.js';

export class DriverService extends BaseService {
  constructor() {
    super(driverRepository);
  }

  /**
   * Fetch drivers with search, status filters, and role-based permissions
   */
  async getDrivers({ status, search, isAdmin = false, sort } = {}) {
    return driverRepository.findDrivers({ status, search, isAdmin, sort });
  }

  /**
   * Fetch single driver with role-based details
   */
  async getDriverById(id, isAdmin = false) {
    const driver = await driverRepository.findDriverById(id, isAdmin);
    if (!driver) {
      const error = new Error('Driver not found');
      error.statusCode = 404;
      throw error;
    }
    return driver;
  }

  /**
   * Create new driver with conflict verification and default assignments
   */
  async createDriver(payload) {
    const phone = payload.phone?.trim();
    const licenseNumber = payload.licenseNumber?.trim().toUpperCase();

    // Check conflict with existing driver
    const conflict = await driverRepository.findConflict({ phone, licenseNumber });
    if (conflict) {
      const error = new Error('A driver with this Phone Number or License Number already exists in database');
      error.statusCode = 409;
      throw error;
    }

    const driverData = {
      name: payload.name.trim(),
      phone,
      altPhone: payload.altPhone || '',
      photoUrl: payload.photoUrl || '',
      licenseNumber,
      licenseExpiry: payload.licenseExpiry || '',
      badgeNumber: payload.badgeNumber || '',
      experienceYears: Number(payload.experienceYears) || 5,
      specialization: payload.specialization || 'High-Altitude 4x4 Mountain Safari Pilot',
      languages: Array.isArray(payload.languages) ? payload.languages : ['Tamil', 'English'],
      emergencyContactName: payload.emergencyContactName || '',
      emergencyContactPhone: payload.emergencyContactPhone || '',
      bloodGroup: payload.bloodGroup || 'O+',
      address: payload.address || '',
      assignedVehicleId: payload.assignedVehicleId ? Number(payload.assignedVehicleId) : null,
      assignedVehicleReg: payload.assignedVehicleReg || '',
      dailyBatta: Number(payload.dailyBatta) || 800,
      rating: Number(payload.rating) || 4.9,
      status: payload.status || DriverStatus.AVAILABLE,
      notes: payload.notes || '',
    };

    return driverRepository.create(driverData);
  }

  /**
   * Update existing driver with conflict check
   */
  async updateDriver(id, payload) {
    const driver = await this.getDriverById(id, true);

    const updateData = { ...payload };
    if (updateData.phone) updateData.phone = updateData.phone.trim();
    if (updateData.licenseNumber) updateData.licenseNumber = updateData.licenseNumber.trim().toUpperCase();

    if (updateData.phone || updateData.licenseNumber) {
      const conflict = await driverRepository.findConflict(
        { phone: updateData.phone, licenseNumber: updateData.licenseNumber },
        driver.id
      );
      if (conflict) {
        const error = new Error('Another driver is already registered with this phone or license number');
        error.statusCode = 409;
        throw error;
      }
    }

    await driver.update(updateData);
    return driver;
  }

  /**
   * Delete driver:
   * - If `hard: true` -> permanently deletes from table
   * - If `hard: false` (default) -> sets `isDelete: true` (soft delete)
   */
  async deleteDriver(id, { hard = false } = {}) {
    return this.delete(id, { hard });
  }

  /**
   * Restore a soft-deleted driver
   */
  async restoreDriver(id) {
    return this.restore(id);
  }

  /**
   * Upload driver photo or document
   */
  async uploadPhoto(file, req) {
    const uploadResult = await uploadService.processFile(file, req);
    return uploadResult.url;
  }

  /**
   * Get drivers ready for vehicle assignment
   */
  async getAvailableDrivers() {
    return driverRepository.findAvailableDrivers();
  }
}

export default new DriverService();
