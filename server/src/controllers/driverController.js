import driverService from '../service/driverService.js';
import { ApiResponse } from '../common/index.js';
import { DriverStatus, BloodGroup } from '../enums/index.js';

/**
 * Driver Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling DriverService, and returning API responses.
 * (Database operations are handled in DriverRepository; Business logic is handled in DriverService)
 */

// @desc    Get all drivers with optional search & status filter
// @route   GET /api/drivers
// @access  Public (Sanitized) / Admin (Full details)
export const getDrivers = async (req, res, next) => {
  try {
    const { status, search, sort = 'createdAt' } = req.query;
    const isAdmin = Boolean(req.admin);

    // Validate status parameter if provided using DriverStatus Enum
    const validStatuses = [...Object.values(DriverStatus), 'all'];
    if (status && !validStatuses.includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status filter. Allowed: ${validStatuses.join(', ')}`);
    }

    const drivers = await driverService.getDrivers({
      status,
      search: search?.trim(),
      isAdmin,
      sort,
    });

    return ApiResponse.success(res, drivers, 'Drivers fetched successfully', {
      count: drivers.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single driver by ID
// @route   GET /api/drivers/:id
// @access  Public (Sanitized) / Admin (Full details)
export const getDriverById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate driver ID
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Driver ID is required.');
    }

    const isAdmin = Boolean(req.admin);
    const driver = await driverService.getDriverById(Number(id), isAdmin);

    return ApiResponse.success(res, driver, 'Driver details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) {
      return ApiResponse.notFound(res, error.message);
    }
    next(error);
  }
};

// @desc    Create new driver in Master
// @route   POST /api/drivers
// @access  Private/Admin
export const createDriver = async (req, res, next) => {
  try {
    const { name, phone, licenseNumber, dailyBatta, experienceYears, rating, status, bloodGroup } = req.body;

    // 1. Mandatory field validations
    const errors = [];
    if (!name?.trim()) errors.push('Driver Name is required.');
    if (!phone?.trim()) errors.push('Mobile Phone Number is required.');
    if (!licenseNumber?.trim()) errors.push('Driving License Number is required.');

    // 2. Format & Enum validations
    if (phone && !/^[0-9+ -]{7,15}$/.test(phone.trim())) {
      errors.push('Invalid phone number format.');
    }
    if (status && !Object.values(DriverStatus).includes(status)) {
      errors.push(`Invalid status. Allowed values: ${Object.values(DriverStatus).join(', ')}`);
    }
    if (bloodGroup && !Object.values(BloodGroup).includes(bloodGroup)) {
      errors.push(`Invalid blood group. Allowed values: ${Object.values(BloodGroup).join(', ')}`);
    }
    if (dailyBatta !== undefined && (isNaN(Number(dailyBatta)) || Number(dailyBatta) < 0)) {
      errors.push('Daily Batta must be a positive number.');
    }
    if (experienceYears !== undefined && (isNaN(Number(experienceYears)) || Number(experienceYears) < 0)) {
      errors.push('Experience Years must be a positive number.');
    }
    if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      errors.push('Rating must be between 1.0 and 5.0.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for driver creation.', errors);
    }

    // Call business logic service
    const driver = await driverService.createDriver(req.body);

    return ApiResponse.created(
      res,
      driver,
      `Driver ${driver.name} successfully registered in Master!`
    );
  } catch (error) {
    if (error.statusCode === 409) {
      return ApiResponse.conflict(res, error.message);
    }
    next(error);
  }
};

// @desc    Update driver in Master
// @route   PUT /api/drivers/:id
// @access  Private/Admin
export const updateDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Driver ID is required.');
    }

    // Validate update fields if present
    const { phone, rating, dailyBatta } = req.body;
    const errors = [];
    if (phone !== undefined && !/^[0-9+ -]{7,15}$/.test(phone.trim())) {
      errors.push('Invalid phone number format.');
    }
    if (rating !== undefined && (isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5)) {
      errors.push('Rating must be between 1.0 and 5.0.');
    }
    if (dailyBatta !== undefined && (isNaN(Number(dailyBatta)) || Number(dailyBatta) < 0)) {
      errors.push('Daily Batta must be a positive number.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for driver update.', errors);
    }

    const updatedDriver = await driverService.updateDriver(Number(id), req.body);

    return ApiResponse.success(res, updatedDriver, 'Driver master record updated successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Delete driver from Master (Supports both Soft Delete & Hard Delete)
// @route   DELETE /api/drivers/:id
// @query   hard=true (Optional: permanently deletes; default false sets isDelete: true)
// @access  Private/Admin
export const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Driver ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;

    // 2. CALL SERVICE LAYER
    const result = await driverService.deleteDriver(Number(id), { hard: isHard });

    // 3. RETURN STANDARDIZED BASEMAP RESPONSE
    if (isHard) {
      return ApiResponse.success(res, result, `Driver #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Driver #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Restore a soft-deleted driver from trash
// @route   PATCH /api/drivers/:id/restore
// @access  Private/Admin
export const restoreDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Driver ID is required.');
    }

    // 2. CALL SERVICE LAYER
    const restored = await driverService.restoreDriver(Number(id));

    // 3. RETURN RESPONSE
    return ApiResponse.success(
      res,
      restored,
      `Driver ${restored.name} restored from trash (isDelete set to false)`
    );
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Upload driver photo or license document
// @route   POST /api/drivers/upload
// @access  Private/Admin
export const uploadDriverPhoto = async (req, res, next) => {
  try {
    const file = req.file || (req.files && req.files[0]);

    // Validation: file presence
    if (!file) {
      return ApiResponse.badRequest(res, 'Please provide an image file to upload.');
    }

    const url = await driverService.uploadPhoto(file, req);

    return ApiResponse.success(res, { url }, 'Driver photo uploaded successfully');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.send(res, error.statusCode, { success: false, message: error.message });
    }
    next(error);
  }
};
