import destinationService from '../service/destinationService.js';
import { ApiResponse } from '../common/index.js';

/**
 * Destination Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling DestinationService, and returning API responses.
 * (Database operations are handled in DestinationRepository; Business logic & KPI aggregations are handled in DestinationService)
 */

// @desc    Get all destinations with filters, search, and live partner/package counts
// @route   GET /api/destinations
// @access  Public / Admin
export const getDestinations = async (req, res, next) => {
  try {
    const destinations = await destinationService.getDestinationsWithStats(req.query);

    return ApiResponse.success(res, destinations, 'Destinations retrieved successfully', {
      count: destinations.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single destination with sub-locations & attractions
// @route   GET /api/destinations/:id
// @access  Public / Admin
export const getDestinationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Destination ID is required.');
    }

    const destination = await destinationService.getById(Number(id));

    return ApiResponse.success(res, destination, 'Destination details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Create new hill station destination
// @route   POST /api/destinations
// @access  Admin Protected
export const createDestination = async (req, res, next) => {
  try {
    const { name, state } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Destination name must be at least 2 characters long.');
    }
    if (!state || typeof state !== 'string' || state.trim().length < 2) {
      errors.push('State name is required (e.g. Kerala, Tamil Nadu).');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for destination creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const createdDestination = await destinationService.createDestination(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(
      res,
      createdDestination,
      `Destination '${createdDestination.name}' created successfully.`
    );
  } catch (error) {
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Update destination details
// @route   PUT /api/destinations/:id
// @access  Admin Protected
export const updateDestination = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Destination ID is required.');
    }

    const updated = await destinationService.updateDestination(Number(id), req.body);

    return ApiResponse.success(res, updated, 'Destination updated successfully.');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Add sub-location hub to destination
// @route   POST /api/destinations/:id/sublocations
// @access  Admin Protected
export const addSubLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Destination ID is required.');
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return ApiResponse.badRequest(res, 'Sub-location name must be at least 2 characters.');
    }

    const result = await destinationService.addSubLocation(Number(id), req.body);

    return ApiResponse.created(
      res,
      result.subLocation,
      `Sub-location '${result.subLocation.name}' added to ${result.dest.name}`
    );
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Toggle destination active/inactive status
// @route   PATCH /api/destinations/:id/toggle-status
// @access  Admin Protected
export const toggleDestinationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Destination ID is required.');
    }

    const updated = await destinationService.toggleStatus(Number(id));

    return ApiResponse.success(res, updated, `Destination is now ${updated.status}.`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Delete a destination (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/destinations/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Admin Protected
export const deleteDestination = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Destination ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await destinationService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Destination #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Destination #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
