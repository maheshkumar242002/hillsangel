import galleryService from '../service/galleryService.js';
import { ApiResponse } from '../common/index.js';
import { MediaType } from '../enums/index.js';

/**
 * Gallery Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling GalleryService, and returning API responses.
 * (Database operations are handled in GalleryRepository; Business logic & media processing are handled in GalleryService)
 */

// @desc    Get all gallery items (supports ?type=photo|video & ?tag=...)
// @route   GET /api/gallery
// @access  Public
export const getGalleryItems = async (req, res, next) => {
  try {
    const { type } = req.query;

    if (type && !Object.values(MediaType).includes(type)) {
      return ApiResponse.badRequest(res, `Invalid type filter. Allowed: ${Object.values(MediaType).join(', ')}`);
    }

    const items = await galleryService.getGalleryItems(req.query);

    return ApiResponse.success(res, items, 'Gallery items retrieved successfully', {
      count: items.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload media file (photo or video) for gallery
// @route   POST /api/gallery/upload
// @access  Admin Protected
export const uploadGalleryMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'Please provide a media file to upload.');
    }

    const result = await galleryService.uploadMedia(req.file, req);

    return ApiResponse.created(res, result, 'Media uploaded successfully.');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.send(res, error.statusCode, { success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Create a new gallery item
// @route   POST /api/gallery
// @access  Admin Protected
export const createGalleryItem = async (req, res, next) => {
  try {
    const { title, url, type } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      errors.push('Title is required and must be at least 2 characters.');
    }
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      errors.push('Valid Media URL is required.');
    }
    if (type && !Object.values(MediaType).includes(type)) {
      errors.push(`Invalid media type. Allowed: ${Object.values(MediaType).join(', ')}`);
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for gallery item creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const item = await galleryService.createGalleryItem(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(res, item, 'Gallery item added successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update a gallery item
// @route   PUT /api/gallery/:id
// @access  Admin Protected
export const updateGalleryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Gallery ID is required.');
    }

    const item = await galleryService.updateGalleryItem(Number(id), req.body);

    return ApiResponse.success(res, item, 'Gallery item updated successfully.');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Delete a gallery item (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/gallery/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Admin Protected
export const deleteGalleryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Gallery ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await galleryService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Gallery item #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Gallery item #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
