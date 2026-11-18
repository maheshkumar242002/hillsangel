import categoryService from '../service/categoryService.js';
import { ApiResponse } from '../common/index.js';

/**
 * Category Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling CategoryService, and returning API responses.
 * (Database operations are handled in CategoryRepository; Business logic is handled in CategoryService)
 */

// @desc    Get all categories (Public)
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll({
      where: { isActive: true },
      order: [['key', 'ASC']],
    });

    return ApiResponse.success(res, categories, 'Categories retrieved successfully', {
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by key (couple or stranger)
// @route   GET /api/categories/:key
// @access  Public
export const getCategoryByKey = async (req, res, next) => {
  try {
    const keyVal = (req.params.key || '').toLowerCase().trim();

    // VALIDATION ONLY
    if (!keyVal) {
      return ApiResponse.badRequest(res, 'Valid category key is required.');
    }

    const category = await categoryService.getByKey(keyVal);

    return ApiResponse.success(res, category, 'Category details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
