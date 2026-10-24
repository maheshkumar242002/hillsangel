import { Op } from 'sequelize';
import Asset from '../models/Asset.js';
import sequelize from '../config/db.js';
import { processUploadedFile } from '../middleware/upload.js';

// @desc    Get all assets with filters & search
// @route   GET /api/assets
// @access  Public / Admin
export const getAssets = async (req, res, next) => {
  try {
    const { category, status, search, sort = 'name' } = req.query;
    const where = {};

    if (category && category !== 'all') {
      where.category = category;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { assetCode: { [Op.like]: term } },
        { description: { [Op.like]: term } },
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'buyPrice_asc') order = [['buyPrice', 'ASC']];
    else if (sort === 'buyPrice_desc') order = [['buyPrice', 'DESC']];
    else if (sort === 'rentPrice_asc') order = [['rentPrice', 'ASC']];
    else if (sort === 'rentPrice_desc') order = [['rentPrice', 'DESC']];
    else if (sort === 'name') order = [['name', 'ASC']];

    const assets = await Asset.findAll({
      where,
      order,
    });

    res.status(200).json({
      success: true,
      count: assets.length,
      assets,
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
    const totalAssets = await Asset.count();
    const availableAssets = await Asset.count({ where: { status: 'available' } });
    const inUseAssets = await Asset.count({ where: { status: 'in_use' } });
    const maintenanceAssets = await Asset.count({ where: { status: 'maintenance' } });

    // Financial totals in MySQL
    const [financialRows] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(buyPrice * quantity), 0) AS totalBuyInvestment,
        COALESCE(SUM(rentPrice * quantity), 0) AS totalRentYieldPotential
      FROM assets
    `);

    const totals = financialRows?.[0] || {
      totalBuyInvestment: 0,
      totalRentYieldPotential: 0,
    };

    // Category breakdown in MySQL
    const [categoryRows] = await sequelize.query(`
      SELECT 
        category AS _id,
        COUNT(*) AS count,
        COALESCE(SUM(quantity), 0) AS totalUnits,
        COALESCE(SUM(buyPrice * quantity), 0) AS totalBuyValue
      FROM assets
      GROUP BY category
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalAssets,
        availableAssets,
        inUseAssets,
        maintenanceAssets,
        totalBuyInvestment: Number(totals.totalBuyInvestment || 0),
        totalRentYieldPotential: Number(totals.totalRentYieldPotential || 0),
        categoryStats: categoryRows.map((r) => ({
          _id: r._id,
          count: Number(r.count),
          totalUnits: Number(r.totalUnits),
          totalBuyValue: Number(r.totalBuyValue),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Public / Admin
export const getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Admin Protected
export const createAsset = async (req, res, next) => {
  try {
    const {
      name,
      assetCode,
      category,
      buyPrice,
      rentPrice,
      rentUnit,
      quantity,
      availableQuantity,
      status,
      imageUrl,
      description,
      vehicleSpecs,
    } = req.body;

    if (!name || buyPrice === undefined || rentPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Asset name, buy price, and rent price are required',
      });
    }

    // Auto generate code if not provided
    const code =
      assetCode?.trim().toUpperCase() ||
      `AST-${(category || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await Asset.findOne({ where: { assetCode: code } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Asset code '${code}' already exists. Please use a unique code.`,
      });
    }

    const asset = await Asset.create({
      name,
      assetCode: code,
      category: category || 'camping',
      buyPrice: Number(buyPrice),
      rentPrice: Number(rentPrice),
      rentUnit: rentUnit || 'per trip',
      quantity: Number(quantity) || 1,
      availableQuantity:
        availableQuantity !== undefined ? Number(availableQuantity) : Number(quantity) || 1,
      status: status || 'available',
      imageUrl,
      description,
      vehicleSpecs,
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Admin Protected
export const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Check code collision if changed
    if (req.body.assetCode && req.body.assetCode.toUpperCase() !== asset.assetCode) {
      const code = req.body.assetCode.toUpperCase();
      const existing = await Asset.findOne({
        where: {
          assetCode: code,
          id: { [Op.ne]: asset.id },
        },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Asset code '${code}' already in use by another asset`,
        });
      }
      req.body.assetCode = code;
    }

    await asset.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      asset,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Admin Protected
export const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    await asset.destroy();

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload asset image
// @route   POST /api/assets/upload
// @access  Admin Protected
export const uploadAssetImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const fileUrl = await processUploadedFile(req.file, req);

    res.status(200).json({
      success: true,
      fileUrl,
      message: 'Asset image uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};
