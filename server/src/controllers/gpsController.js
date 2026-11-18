import gpsService from '../service/gpsService.js';
import { ApiResponse } from '../common/index.js';
import { GpsVehicleStatus } from '../enums/index.js';

/**
 * GPS Tracking Controller
 * RESPONSIBILITY: Request validation, device key verification, calling GpsService, returning ApiResponse.
 */

// @desc    Get all tracked vehicles + live fleet summary
// @route   GET /api/gps/vehicles
// @access  Private (Admin)
export const getTrackedVehicles = async (req, res, next) => {
  try {
    const result = await gpsService.getTrackedVehiclesSummary();
    return ApiResponse.success(res, result, 'Fleet telemetry retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Get single vehicle by ID or Registration Number
// @route   GET /api/gps/vehicles/:id
// @access  Private (Admin)
export const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || String(id).trim() === '') {
      return ApiResponse.badRequest(res, 'Vehicle ID or registration number is required.');
    }

    const vehicle = await gpsService.getVehicleById(String(id).trim());
    return ApiResponse.success(res, { vehicle }, 'Vehicle GPS details retrieved');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Update Vehicle GPS Telemetry (from IoT hardware tracker or driver app)
// @route   POST /api/gps/update
// @access  Device API Key or Admin Private
export const updateVehicleGps = async (req, res, next) => {
  try {
    // 1. Device / Admin Authentication Check
    const deviceKey = req.headers['x-device-key'] || req.headers['x-api-key'];
    const configuredKey = process.env.GPS_DEVICE_API_KEY || 'hills_angels_gps_iot_device_auth_2026_safe';
    const isAdmin = Boolean(req.admin);

    if (!isAdmin && (!deviceKey || deviceKey !== configuredKey)) {
      return ApiResponse.unauthorized(
        res,
        'Unauthorized GPS update. Valid X-Device-Key or admin authorization required.'
      );
    }

    // 2. Input Validation Only
    const errors = [];
    const regNumber = req.body.regNumber || req.body.registrationNumber;
    const deviceId = req.body.deviceId;
    const { latitude, longitude, speed, status } = req.body;

    if (!regNumber && !deviceId) {
      errors.push('Vehicle registration number (regNumber) or device ID (deviceId) is required.');
    }

    if (latitude !== undefined) {
      const latNum = Number(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.push('Invalid latitude: must be a numeric value between -90 and 90.');
      }
    }

    if (longitude !== undefined) {
      const lngNum = Number(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.push('Invalid longitude: must be a numeric value between -180 and 180.');
      }
    }

    if (speed !== undefined) {
      const spdNum = Number(speed);
      if (isNaN(spdNum) || spdNum < 0 || spdNum > 300) {
        errors.push('Invalid speed: must be a non-negative number up to 300 km/h.');
      }
    }

    if (status !== undefined) {
      const validStatuses = Object.values(GpsVehicleStatus);
      if (!validStatuses.includes(status)) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for GPS telemetry update.', errors);
    }

    // 3. Call Service Layer
    const vehicle = await gpsService.updateTelemetry(req.body);

    return ApiResponse.success(res, { vehicle }, 'GPS telemetry updated successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Live Simulation Step (moves active vehicles slightly along safari paths)
// @route   POST /api/gps/simulate-step
// @access  Private (Admin)
export const simulateGpsStep = async (req, res, next) => {
  try {
    const vehicles = await gpsService.simulateStep();
    return ApiResponse.success(res, { vehicles }, 'Simulation tick applied');
  } catch (err) {
    next(err);
  }
};

// @desc    Reset GPS locations back to base checkpoints
// @route   POST /api/gps/reset
// @access  Private (Admin)
export const resetVehiclesGps = async (req, res, next) => {
  try {
    const vehicles = await gpsService.resetFleet();
    return ApiResponse.success(res, { vehicles }, 'Fleet GPS locations reset to base');
  } catch (err) {
    next(err);
  }
};
