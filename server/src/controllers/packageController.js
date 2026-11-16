import { Op } from 'sequelize';
import Package from '../models/Package.js';
import Asset from '../models/Asset.js';
import PartnerTieup from '../models/PartnerTieup.js';
import { processUploadedFile } from '../middleware/upload.js';

// Helper to generate a URL slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

// Helper to attach populated includedAssets, availableVehicles, and partner tieups (Stay & Food)
const attachPackageAssets = async (pkgList) => {
  const isArray = Array.isArray(pkgList);
  const list = isArray ? pkgList : [pkgList];
  if (!list.length || !list[0]) return isArray ? [] : null;

  const allIds = new Set();
  const allPartnerIds = new Set();

  list.forEach((pkg) => {
    const rawAssetIds = pkg.includedAssetIds || [];
    const rawVehIds = pkg.availableVehicleIds || [];
    const assetIds = (Array.isArray(rawAssetIds) ? rawAssetIds : []).map((id) =>
      typeof id === 'object' && id !== null ? id.id || id._id : id
    );
    const vehicleIds = (Array.isArray(rawVehIds) ? rawVehIds : []).map((id) =>
      typeof id === 'object' && id !== null ? id.id || id._id : id
    );

    assetIds.forEach((id) => {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) allIds.add(parsed);
    });
    vehicleIds.forEach((id) => {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) allIds.add(parsed);
    });

    // Collect Stay & Food partner IDs
    if (pkg.stayPartnerId) {
      const pStay = parseInt(pkg.stayPartnerId, 10);
      if (!isNaN(pStay)) allPartnerIds.add(pStay);
    }
    if (pkg.foodPartnerId) {
      const pFood = parseInt(pkg.foodPartnerId, 10);
      if (!isNaN(pFood)) allPartnerIds.add(pFood);
    }
    const rawSelectedStays = pkg.selectedStayIds || [];
    const rawSelectedFoods = pkg.selectedFoodIds || [];
    (Array.isArray(rawSelectedStays) ? rawSelectedStays : []).forEach((id) => {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) allPartnerIds.add(parsed);
    });
    (Array.isArray(rawSelectedFoods) ? rawSelectedFoods : []).forEach((id) => {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed)) allPartnerIds.add(parsed);
    });
  });

  const [assets, partners] = await Promise.all([
    allIds.size > 0
      ? Asset.findAll({
          where: { id: Array.from(allIds) },
        })
      : [],
    allPartnerIds.size > 0
      ? PartnerTieup.findAll({
          where: { id: Array.from(allPartnerIds) },
        })
      : [],
  ]);

  const assetMap = new Map();
  assets.forEach((a) => assetMap.set(a.id, a.toJSON()));

  const partnerMap = new Map();
  partners.forEach((p) => partnerMap.set(p.id, p.toJSON()));

  const enriched = list.map((pkg) => {
    const data = typeof pkg.toJSON === 'function' ? pkg.toJSON() : { ...pkg };
    const rawAssetIds = data.includedAssetIds || [];
    const rawVehIds = data.availableVehicleIds || [];

    const assetIds = (Array.isArray(rawAssetIds) ? rawAssetIds : []).map((id) =>
      typeof id === 'object' && id !== null ? id.id || id._id : id
    );
    const vehicleIds = (Array.isArray(rawVehIds) ? rawVehIds : []).map((id) =>
      typeof id === 'object' && id !== null ? id.id || id._id : id
    );

    data.includedAssets = assetIds
      .map((id) => assetMap.get(parseInt(id, 10)))
      .filter(Boolean);
    data.availableVehicles = vehicleIds
      .map((id) => assetMap.get(parseInt(id, 10)))
      .filter(Boolean);

    // Attach partners
    data.stayPartner = data.stayPartnerId
      ? partnerMap.get(parseInt(data.stayPartnerId, 10)) || null
      : null;
    data.foodPartner = data.foodPartnerId
      ? partnerMap.get(parseInt(data.foodPartnerId, 10)) || null
      : null;

    const rawSelectedStays = data.selectedStayIds || [];
    const rawSelectedFoods = data.selectedFoodIds || [];
    data.selectedStays = (Array.isArray(rawSelectedStays) ? rawSelectedStays : [])
      .map((id) => partnerMap.get(parseInt(id, 10)))
      .filter(Boolean);
    data.selectedFoods = (Array.isArray(rawSelectedFoods) ? rawSelectedFoods : [])
      .map((id) => partnerMap.get(parseInt(id, 10)))
      .filter(Boolean);

    return data;
  });

  return isArray ? enriched : enriched[0];
};

// @desc    Get all packages with filtering, search, sort, pagination
// @route   GET /api/packages
// @access  Public
export const getPackages = async (req, res, next) => {
  try {
    const {
      category,
      tier,
      destination,
      search,
      sort,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      includeInactive = 'false',
    } = req.query;

    const where = {};

    // Filter by active status unless admin requests inactive
    if (includeInactive !== 'true') {
      where.status = 'active';
    }

    if (category && category !== 'all') {
      where.category = category.toLowerCase();
    }

    if (tier && tier !== 'all') {
      where.tier = tier.toLowerCase();
    }

    if (destination && destination !== 'all') {
      where.destination = { [Op.like]: destination.trim() };
    }

    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchPattern } },
        { destination: { [Op.like]: searchPattern } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    // Sorting
    let order = [
      ['featured', 'DESC'],
      ['createdAt', 'DESC'],
    ];
    if (sort === 'price-asc') {
      order = [['price', 'ASC']];
    } else if (sort === 'price-desc') {
      order = [['price', 'DESC']];
    } else if (sort === 'newest') {
      order = [['createdAt', 'DESC']];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: rawPackages, count: total } = await Package.findAndCountAll({
      where,
      order,
      offset: skip,
      limit: limitNum,
    });

    const packages = await attachPackageAssets(rawPackages);

    res.status(200).json({
      success: true,
      count: packages.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      packages,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single package by slug with compare-tier package data
// @route   GET /api/packages/:slug
// @access  Public
export const getPackageBySlug = async (req, res, next) => {
  try {
    const rawPkg = await Package.findOne({
      where: { slug: req.params.slug },
    });
    if (!rawPkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const pkg = await attachPackageAssets(rawPkg);

    // Find the counterpart tier package (same destination and category, different tier)
    const counterpartTier = rawPkg.tier === 'premium' ? 'extra_premium' : 'premium';
    const rawCounterpart = await Package.findOne({
      where: {
        destination: rawPkg.destination,
        category: rawPkg.category,
        tier: counterpartTier,
        status: 'active',
      },
    });

    const counterpart = rawCounterpart ? await attachPackageAssets(rawCounterpart) : null;

    res.status(200).json({
      success: true,
      package: pkg,
      counterpart,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single package by ID
// @route   GET /api/packages/id/:id
// @access  Public
export const getPackageById = async (req, res, next) => {
  try {
    const rawPkg = await Package.findByPk(req.params.id);
    if (!rawPkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const pkg = await attachPackageAssets(rawPkg);

    res.status(200).json({
      success: true,
      package: pkg,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get featured packages for home hero/showcase
// @route   GET /api/packages/featured
// @access  Public
export const getFeaturedPackages = async (req, res, next) => {
  try {
    const rawFeatured = await Package.findAll({
      where: { status: 'active', featured: true },
      order: [['createdAt', 'DESC']],
      limit: 6,
    });

    const featured = await attachPackageAssets(rawFeatured);

    res.status(200).json({
      success: true,
      packages: featured,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all unique destinations
// @route   GET /api/packages/destinations
// @access  Public
export const getDestinations = async (req, res, next) => {
  try {
    const packages = await Package.findAll({
      where: { status: 'active' },
      attributes: ['destination', 'images', 'price'],
    });

    const destMap = new Map();
    packages.forEach((p) => {
      const dest = p.destination;
      const images = p.images || [];
      const firstImg = Array.isArray(images) && images.length ? images[0] : '';
      if (!destMap.has(dest)) {
        destMap.set(dest, {
          name: dest,
          count: 1,
          image: firstImg,
          minPrice: p.price,
        });
      } else {
        const item = destMap.get(dest);
        item.count += 1;
        if (p.price < item.minPrice) item.minPrice = p.price;
        if (!item.image && firstImg) item.image = firstImg;
      }
    });

    const destinations = Array.from(destMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.status(200).json({
      success: true,
      destinations,
    });
  } catch (err) {
    next(err);
  }
};

// ================= ADMIN CONTROLLERS =================

// @desc    Create a new package
// @route   POST /api/packages
// @access  Private (Admin)
export const createPackage = async (req, res, next) => {
  try {
    const { title, category, tier } = req.body;

    if (!title || !category || !tier) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, and tier are required.',
      });
    }

    let slug = generateSlug(title);
    let existingSlug = await Package.findOne({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const payload = {
      ...req.body,
      slug,
    };

    if (req.body.includedAssets && Array.isArray(req.body.includedAssets)) {
      payload.includedAssetIds = req.body.includedAssets.map((a) =>
        typeof a === 'object' && a !== null ? a.id || a._id : a
      );
    }
    if (req.body.availableVehicles && Array.isArray(req.body.availableVehicles)) {
      payload.availableVehicleIds = req.body.availableVehicles.map((v) =>
        typeof v === 'object' && v !== null ? v.id || v._id : v
      );
    }

    const newPackage = await Package.create(payload);
    const enriched = await attachPackageAssets(newPackage);

    res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      package: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a package
// @route   PUT /api/packages/:id
// @access  Private (Admin)
export const updatePackage = async (req, res, next) => {
  try {
    let pkg = await Package.findByPk(req.params.id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const payload = { ...req.body };

    // If title changed, update slug
    if (req.body.title && req.body.title !== pkg.title) {
      let slug = generateSlug(req.body.title);
      let existingSlug = await Package.findOne({
        where: {
          slug,
          id: { [Op.ne]: pkg.id },
        },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
      payload.slug = slug;
    }

    if (req.body.includedAssets && Array.isArray(req.body.includedAssets)) {
      payload.includedAssetIds = req.body.includedAssets.map((a) =>
        typeof a === 'object' && a !== null ? a.id || a._id : a
      );
    }
    if (req.body.availableVehicles && Array.isArray(req.body.availableVehicles)) {
      payload.availableVehicleIds = req.body.availableVehicles.map((v) =>
        typeof v === 'object' && v !== null ? v.id || v._id : v
      );
    }

    await pkg.update(payload);
    const enriched = await attachPackageAssets(pkg);

    res.status(200).json({
      success: true,
      message: 'Package updated successfully.',
      package: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a package
// @route   DELETE /api/packages/:id
// @access  Private (Admin)
export const deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    await pkg.destroy();

    res.status(200).json({
      success: true,
      message: 'Package removed successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle package active status
// @route   PATCH /api/packages/:id/status
// @access  Private (Admin)
export const togglePackageStatus = async (req, res, next) => {
  try {
    const pkg = await Package.findByPk(req.params.id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const nextStatus = pkg.status === 'active' ? 'inactive' : 'active';
    await pkg.update({ status: nextStatus });

    res.status(200).json({
      success: true,
      message: `Package marked as ${nextStatus}.`,
      package: pkg,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload package images
// @route   POST /api/packages/upload
// @access  Private (Admin)
export const uploadPackageImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one image file to upload.',
      });
    }

    const uploadPromises = req.files.map((file) => processUploadedFile(file, req));
    const urls = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${urls.length} image(s) uploaded successfully.`,
      urls,
    });
  } catch (err) {
    next(err);
  }
};
