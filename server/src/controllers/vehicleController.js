import vehicleService from '../service/vehicleService.js';
import { ApiResponse } from '../common/index.js';
import { VehicleStatus, RentalType } from '../enums/index.js';

/**
 * Vehicle Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling VehicleService, and returning API responses.
 * (Database operations are handled in VehicleRepository; Business logic & inspections are handled in VehicleService)
 */

// @desc    Get all vehicles (Public & Booking Form)
// @route   GET /api/vehicles
// @access  Public
export const getVehicles = async (req, res, next) => {
  try {
    const { status, rentalType } = req.query;

    // VALIDATION ONLY
    if (status && !Object.values(VehicleStatus).includes(status)) {
      return ApiResponse.badRequest(res, `Invalid vehicle status filter. Allowed: ${Object.values(VehicleStatus).join(', ')}`);
    }
    if (rentalType && !Object.values(RentalType).includes(rentalType)) {
      return ApiResponse.badRequest(res, `Invalid rental type filter. Allowed: ${Object.values(RentalType).join(', ')}`);
    }

    const vehicles = await vehicleService.getVehicles(req.query);

    return ApiResponse.success(res, vehicles, 'Vehicles retrieved successfully', {
      count: vehicles.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle details (Admin)
// @route   GET /api/vehicles/:id
// @access  Private/Admin
export const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Vehicle ID is required.');
    }

    const vehicle = await vehicleService.getVehicleById(Number(id));

    return ApiResponse.success(res, vehicle, 'Vehicle details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Create new vehicle in Master (Admin only)
// @route   POST /api/vehicles
// @access  Private/Admin
export const createVehicle = async (req, res, next) => {
  try {
    const { name, registrationNumber, seatingCapacity, perDayRate } = req.body;

    // 1. MANDATORY VALIDATION ONLY
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Vehicle name must be at least 2 characters.');
    }
    if (!registrationNumber || typeof registrationNumber !== 'string' || registrationNumber.trim().length < 4) {
      errors.push('Valid registration number is required (e.g. TN-57-AW-1234).');
    }
    if (seatingCapacity !== undefined && (isNaN(Number(seatingCapacity)) || Number(seatingCapacity) < 1)) {
      errors.push('Seating capacity must be at least 1.');
    }
    if (perDayRate !== undefined && (isNaN(Number(perDayRate)) || Number(perDayRate) < 0)) {
      errors.push('Per day rate must be a positive number.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for vehicle creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const createdVehicle = await vehicleService.createVehicle(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(
      res,
      createdVehicle,
      `Vehicle ${createdVehicle.name} (${createdVehicle.registrationNumber}) added to Master!`
    );
  } catch (error) {
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Update vehicle in Master (Admin only)
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
export const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Vehicle ID is required.');
    }

    const { perDayRate, seatingCapacity } = req.body;
    const errors = [];
    if (perDayRate !== undefined && (isNaN(Number(perDayRate)) || Number(perDayRate) < 0)) {
      errors.push('Per day rate must be a positive number.');
    }
    if (seatingCapacity !== undefined && (isNaN(Number(seatingCapacity)) || Number(seatingCapacity) < 1)) {
      errors.push('Seating capacity must be at least 1.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for vehicle update.', errors);
    }

    // 2. CALL SERVICE LAYER
    const updatedVehicle = await vehicleService.updateVehicle(Number(id), req.body);

    // 3. RETURN RESPONSE
    return ApiResponse.success(res, updatedVehicle, 'Vehicle master updated successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Delete vehicle from Master (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/vehicles/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private/Admin
export const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Vehicle ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await vehicleService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Vehicle #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Vehicle #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Upload vehicle images / condition photos
// @route   POST /api/vehicles/upload
// @access  Private/Admin
export const uploadVehicleImages = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    // VALIDATION ONLY
    if (!files || files.length === 0) {
      return ApiResponse.badRequest(res, 'Please provide an image file to upload.');
    }

    const result = await vehicleService.uploadImages(files, req);

    return ApiResponse.created(res, result, 'Vehicle image(s) uploaded successfully');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.send(res, error.statusCode, { success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Start trip inspection (updates status to on_tour, records condition photos, start km & fuel)
// @route   POST /api/vehicles/:id/start-trip
// @access  Private/Admin
export const startTripInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Vehicle ID is required.');
    }

    const updatedVehicle = await vehicleService.startTripInspection(Number(id), req.body);

    return ApiResponse.success(
      res,
      updatedVehicle,
      'Trip started successfully with vehicle condition photos & inspection logged!'
    );
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    End trip inspection (records return km, condition photos, updates status to available)
// @route   POST /api/vehicles/:id/end-trip
// @access  Private/Admin
export const endTripInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Vehicle ID is required.');
    }

    const result = await vehicleService.endTripInspection(Number(id), req.body);

    return ApiResponse.success(
      res,
      result.vehicle,
      `Trip completed! Total distance run: ${result.kmRun} km. Vehicle is now Available.`
    );
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
