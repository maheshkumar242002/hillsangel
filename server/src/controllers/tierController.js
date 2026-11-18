import tierService from '../service/tierService.js';
import { ApiResponse } from '../common/index.js';

/**
 * Tier Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling TierService, and returning API responses.
 * (Database operations are handled in TierRepository; Business logic is handled in TierService)
 */

// @desc    Get all tiers (Public)
// @route   GET /api/tiers
// @access  Public
export const getTiers = async (req, res, next) => {
  try {
    const tiers = await tierService.getAll({
      where: { isActive: true },
      order: [['starRating', 'ASC']],
    });

    return ApiResponse.success(res, tiers, 'Tiers retrieved successfully', {
      count: tiers.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tier by key (premium or extra_premium)
// @route   GET /api/tiers/:key
// @access  Public
export const getTierByKey = async (req, res, next) => {
  try {
    const keyVal = (req.params.key || '').toLowerCase().trim();

    // VALIDATION ONLY
    if (!keyVal) {
      return ApiResponse.badRequest(res, 'Valid tier key is required.');
    }

    const tier = await tierService.getByKey(keyVal);

    return ApiResponse.success(res, tier, 'Tier details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
