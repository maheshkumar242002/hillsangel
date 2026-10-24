import { Op } from 'sequelize';
import Category from '../models/Category.js';

// @desc    Get all categories (Public)
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['key', 'ASC']],
    });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
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
    const keyVal = (req.params.key || '').toLowerCase();
    const category = await Category.findOne({
      where: {
        [Op.or]: [{ key: keyVal }, { slug: keyVal }],
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};
