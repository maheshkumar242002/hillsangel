import { Op } from 'sequelize';
import Tier from '../models/Tier.js';

// @desc    Get all tiers (Public)
// @route   GET /api/tiers
// @access  Public
export const getTiers = async (req, res, next) => {
  try {
    const tiers = await Tier.findAll({
      where: { isActive: true },
      order: [['starRating', 'ASC']],
    });
    res.status(200).json({
      success: true,
      count: tiers.length,
      tiers,
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
    const keyVal = (req.params.key || '').toLowerCase();
    const tier = await Tier.findOne({
      where: {
        [Op.or]: [{ key: keyVal }, { slug: keyVal }],
      },
    });

    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Tier not found.',
      });
    }

    res.status(200).json({
      success: true,
      tier,
    });
  } catch (error) {
    next(error);
  }
};
