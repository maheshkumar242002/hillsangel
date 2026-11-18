import { BaseService } from './BaseService.js';
import vehicleRepository from '../repository/vehicleRepository.js';
import uploadService from './uploadService.js';
import { VehicleStatus } from '../enums/index.js';

export class VehicleService extends BaseService {
  constructor() {
    super(vehicleRepository);
  }

  /**
   * Filtered vehicles
   */
  async getVehicles(filters) {
    return vehicleRepository.findVehiclesFiltered(filters);
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(id) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      const err = new Error('Vehicle not found');
      err.statusCode = 404;
      throw err;
    }
    return vehicle;
  }

  /**
   * Create vehicle with registration number conflict check
   */
  async createVehicle(payload) {
    const regNumber = payload.registrationNumber?.trim().toUpperCase();
    const existing = await vehicleRepository.findByRegistration(regNumber);
    if (existing) {
      const err = new Error(`Vehicle with registration number "${regNumber}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const vehicleData = {
      ...payload,
      registrationNumber: regNumber,
      status: payload.status || VehicleStatus.AVAILABLE,
    };

    return vehicleRepository.create(vehicleData);
  }

  /**
   * Update vehicle with duplicate registration check
   */
  async updateVehicle(id, payload) {
    const vehicle = await this.getVehicleById(id);

    if (payload.registrationNumber) {
      const regNumber = payload.registrationNumber.trim().toUpperCase();
      const conflict = await vehicleRepository.findByRegistration(regNumber, vehicle.id);
      if (conflict) {
        const err = new Error(`Another vehicle is already registered with number "${regNumber}".`);
        err.statusCode = 409;
        throw err;
      }
      payload.registrationNumber = regNumber;
    }

    await vehicle.update(payload);
    return vehicle;
  }

  /**
   * Upload vehicle condition photos / display photos
   */
  async uploadImages(files, req) {
    const results = await uploadService.processMultipleFiles(files, req);
    const urls = results.map((r) => r.url);
    return {
      url: urls[0],
      urls,
    };
  }

  /**
   * Start trip inspection workflow (status -> on_tour, odometer, fuel, photos)
   */
  async startTripInspection(id, inspectionData) {
    const vehicle = await this.getVehicleById(id);

    const {
      startOdometerKm,
      fuelLevel,
      conditionPhotos,
      driverName,
      driverPhone,
      customerName,
      destination,
      remarks,
      bookingId,
    } = inspectionData;

    const startKm = parseInt(startOdometerKm, 10) || vehicle.currentOdometerKm || 0;

    const inspectionRecord = {
      tripId: `TRIP-${Date.now().toString().slice(-6)}`,
      bookingId: bookingId || '',
      customerName: customerName || 'Mountain Guest',
      destination: destination || 'Safari Circuit',
      driverName: driverName || vehicle.driverName,
      driverPhone: driverPhone || vehicle.driverPhone,
      startOdometerKm: startKm,
      fuelLevel: fuelLevel || 'Full Tank',
      conditionPhotos: Array.isArray(conditionPhotos) ? conditionPhotos : [],
      remarks: remarks || 'Pre-trip inspection verified & approved',
      startedAt: new Date().toISOString(),
      status: 'active',
    };

    await vehicle.update({
      status: VehicleStatus.ON_TOUR,
      currentOdometerKm: startKm,
      currentTrip: inspectionRecord,
    });

    return vehicle;
  }

  /**
   * End trip inspection workflow (status -> available, odometer calculation, return condition photos)
   */
  async endTripInspection(id, returnData) {
    const vehicle = await this.getVehicleById(id);

    const {
      endOdometerKm,
      returnFuelLevel,
      returnConditionPhotos,
      closingRemarks,
    } = returnData;

    const endKm = parseInt(endOdometerKm, 10) || vehicle.currentOdometerKm || 0;
    const currentTrip = vehicle.currentTrip || {};
    const kmRun = Math.max(0, endKm - (currentTrip.startOdometerKm || endKm));

    const completedTrip = {
      ...currentTrip,
      endOdometerKm: endKm,
      kmRun,
      returnFuelLevel: returnFuelLevel || 'Normal',
      returnConditionPhotos: Array.isArray(returnConditionPhotos) ? returnConditionPhotos : [],
      closingRemarks: closingRemarks || 'Vehicle returned in safe condition',
      endedAt: new Date().toISOString(),
      status: 'completed',
    };

    const history = Array.isArray(vehicle.tripInspectionHistory) ? [...vehicle.tripInspectionHistory] : [];
    history.unshift(completedTrip);

    await vehicle.update({
      status: VehicleStatus.AVAILABLE,
      currentOdometerKm: endKm,
      currentTrip: null,
      tripInspectionHistory: history.slice(0, 30),
    });

    return {
      vehicle,
      kmRun,
    };
  }
}

export default new VehicleService();
