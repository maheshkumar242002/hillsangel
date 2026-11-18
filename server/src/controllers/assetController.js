import assetService from '../service/assetService.js';
import { ApiResponse } from '../common/index.js';
import { AssetCategory, AssetStatus } from '../enums/index.js';

/**
 * Asset Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling AssetService, and returning API responses.
 * (Database operations are handled in AssetRepository; Business logic & KPI math are handled in AssetService)
 */

// @desc    Get all assets with filters & search
// @route   GET /api/assets
// @access  Public / Admin
export const getAssets = async (req, res, next) => {
  try {
    const { category, status } = req.query;

    if (category && category !== 'all' && !Object.values(AssetCategory).includes(category)) {
      return ApiResponse.badRequest(res, `Invalid category filter. Allowed: ${Object.values(AssetCategory).join(', ')}`);
    }
    if (status && status !== 'all' && !Object.values(AssetStatus).includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status filter. Allowed: ${Object.values(AssetStatus).join(', ')}`);
    }

    const assets = await assetService.getAssets(req.query);

    return ApiResponse.success(res, assets, 'Assets retrieved successfully', {
      count: assets.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get asset metrics & KPI statistics
// @route   GET /api/assets/stats
// @access  Admin Protected
export const getAssetStats = async (req, res, next) => {
  try {
    const stats = await assetService.getStats();

    return ApiResponse.success(res, stats, 'Asset statistics calculated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Public / Admin
export const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Asset ID is required.');
    }

    const asset = await assetService.getById(Number(id));

    return ApiResponse.success(res, asset, 'Asset details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Admin Protected
export const createAsset = async (req, res, next) => {
  try {
    const { name, buyPrice, rentPrice, category, status } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Asset name must be at least 2 characters.');
    }
    if (buyPrice === undefined || isNaN(Number(buyPrice)) || Number(buyPrice) < 0) {
      errors.push('Buy price must be a non-negative number.');
    }
    if (rentPrice === undefined || isNaN(Number(rentPrice)) || Number(rentPrice) < 0) {
      errors.push('Rent price must be a non-negative number.');
    }
    if (category && !Object.values(AssetCategory).includes(category)) {
      errors.push(`Invalid category. Allowed: ${Object.values(AssetCategory).join(', ')}`);
    }
    if (status && !Object.values(AssetStatus).includes(status)) {
      errors.push(`Invalid status. Allowed: ${Object.values(AssetStatus).join(', ')}`);
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for asset creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const createdAsset = await assetService.createAsset(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(res, createdAsset, 'Asset created successfully.');
  } catch (error) {
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Admin Protected
export const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Asset ID is required.');
    }

    const updatedAsset = await assetService.updateAsset(Number(id), req.body);

    return ApiResponse.success(res, updatedAsset, 'Asset updated successfully.');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Delete an asset (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/assets/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Admin Protected
export const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Asset ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await assetService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Asset #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Asset #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Upload asset image
// @route   POST /api/assets/upload
// @access  Admin Protected
export const uploadAssetImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'Please provide an image file to upload.');
    }

    const fileUrl = await assetService.uploadImage(req.file, req);

    return ApiResponse.created(res, { fileUrl }, 'Asset image uploaded successfully.');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.send(res, error.statusCode, { success: false, message: error.message });
    }
    next(error);
  }
};
