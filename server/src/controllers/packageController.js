import packageService from '../service/packageService.js';
import { ApiResponse } from '../common/index.js';
import { PackageStatus, PackageTier, PackageCategory } from '../enums/index.js';

/**
 * Package Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling PackageService, and returning API responses.
 * (Database operations are handled in PackageRepository; Business logic & enrichment are handled in PackageService)
 */

// @desc    Get all packages with filtering, search, sort, pagination
// @route   GET /api/packages
// @access  Public
export const getPackages = async (req, res, next) => {
  try {
    const { minPrice, maxPrice, category, tier } = req.query;

    // VALIDATION ONLY
    const errors = [];
    if (minPrice !== undefined && (isNaN(Number(minPrice)) || Number(minPrice) < 0)) {
      errors.push('minPrice must be a positive number.');
    }
    if (maxPrice !== undefined && (isNaN(Number(maxPrice)) || Number(maxPrice) < 0)) {
      errors.push('maxPrice must be a positive number.');
    }
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      errors.push('minPrice cannot be greater than maxPrice.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation error on package filters.', errors);
    }

    const result = await packageService.getFilteredPackages(req.query);

    return ApiResponse.success(res, result.packages, 'Packages retrieved successfully', {
      count: result.count,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single package by slug
// @route   GET /api/packages/slug/:slug
// @access  Public
export const getPackageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // VALIDATION ONLY
    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return ApiResponse.badRequest(res, 'Valid URL slug is required.');
    }

    const pkg = await packageService.getPackageBySlug(slug.trim());

    return ApiResponse.success(res, pkg, 'Package details retrieved successfully');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Get single package by ID
// @route   GET /api/packages/:id
// @access  Public
export const getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Package ID is required.');
    }

    const pkg = await packageService.getPackageById(Number(id));

    return ApiResponse.success(res, pkg, 'Package details retrieved successfully');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Get featured packages for homepage
// @route   GET /api/packages/featured
// @access  Public
export const getFeaturedPackages = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const packages = await packageService.getFeaturedPackages(limit);

    return ApiResponse.success(res, packages, 'Featured packages retrieved successfully', {
      count: packages.length,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get distinct destinations with package counts
// @route   GET /api/packages/destinations
// @access  Public
export const getDestinations = async (req, res, next) => {
  try {
    const destinations = await packageService.getDestinations();

    return ApiResponse.success(res, destinations, 'Destinations retrieved successfully', {
      count: destinations.length,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new package
// @route   POST /api/packages
// @access  Private (Admin)
export const createPackage = async (req, res, next) => {
  try {
    const { title, destination, price, category, tier } = req.body;

    // 1. MANDATORY VALIDATION ONLY
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.push('Package title must be at least 3 characters.');
    }
    if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
      errors.push('Destination is required.');
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
      errors.push('Price must be a positive number greater than 0.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for package creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const createdPkg = await packageService.createPackage(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(res, createdPkg, 'Tour package created successfully.');
  } catch (err) {
    next(err);
  }
};

// @desc    Update an existing package
// @route   PUT /api/packages/:id
// @access  Private (Admin)
export const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, originalPrice } = req.body;

    // 1. VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Package ID is required.');
    }

    const errors = [];
    if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
      errors.push('Price must be a positive number greater than 0.');
    }
    if (originalPrice !== undefined && originalPrice !== null && (isNaN(Number(originalPrice)) || Number(originalPrice) < 0)) {
      errors.push('Original price must be a non-negative number.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for package update.', errors);
    }

    // 2. CALL SERVICE LAYER
    const updatedPkg = await packageService.updatePackage(Number(id), req.body);

    // 3. RETURN RESPONSE
    return ApiResponse.success(res, updatedPkg, 'Tour package updated successfully.');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Delete a package (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/packages/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private (Admin)
export const deletePackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Package ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await packageService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Package #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Package #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Toggle package active status
// @route   PATCH /api/packages/:id/status
// @access  Private (Admin)
export const togglePackageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Package ID is required.');
    }

    const pkg = await packageService.togglePackageStatus(Number(id));

    return ApiResponse.success(res, pkg, `Package status toggled to ${pkg.status}`);
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Upload images for packages
// @route   POST /api/packages/upload
// @access  Private (Admin)
export const uploadPackageImages = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    // VALIDATION ONLY
    if (!files || files.length === 0) {
      return ApiResponse.badRequest(res, 'Please provide at least one image file to upload.');
    }

    const urls = await packageService.uploadPackageImages(files, req);

    return ApiResponse.created(res, { urls }, 'Package images uploaded successfully.');
  } catch (err) {
    if (err.statusCode) {
      return ApiResponse.send(res, err.statusCode, { success: false, message: err.message });
    }
    next(err);
  }
};
