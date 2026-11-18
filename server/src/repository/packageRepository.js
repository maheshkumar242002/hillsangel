import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Package from '../models/Package.js';
import Category from '../models/Category.js';
import Tier from '../models/Tier.js';
import Asset from '../models/Asset.js';
import PartnerTieup from '../models/PartnerTieup.js';

export class PackageRepository extends BaseRepository {
  constructor() {
    super(Package);
  }

  /**
   * Helper to attach includedAssets, availableVehicles, and partner tieups (Stay & Food)
   */
  async enrichPackageAssets(pkgList) {
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
      allIds.size > 0 ? Asset.findAll({ where: { id: Array.from(allIds) } }) : [],
      allPartnerIds.size > 0 ? PartnerTieup.findAll({ where: { id: Array.from(allPartnerIds) } }) : [],
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

      data.includedAssets = assetIds.map((id) => assetMap.get(parseInt(id, 10))).filter(Boolean);
      data.availableVehicles = vehicleIds.map((id) => assetMap.get(parseInt(id, 10))).filter(Boolean);

      data.stayPartner = data.stayPartnerId ? partnerMap.get(parseInt(data.stayPartnerId, 10)) || null : null;
      data.foodPartner = data.foodPartnerId ? partnerMap.get(parseInt(data.foodPartnerId, 10)) || null : null;

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
  }

  /**
   * Find package with full associated Category and Tier details
   */
  async findWithDetails(id) {
    const pkg = await this.findById(id, {
      include: [
        { model: Category, as: 'categoryDetails' },
        { model: Tier, as: 'tierDetails' },
      ],
    });
    if (!pkg) return null;
    return this.enrichPackageAssets(pkg);
  }

  /**
   * Find package by URL slug
   */
  async findBySlug(slug) {
    const pkg = await this.findOne({ slug });
    if (!pkg) return null;
    return this.enrichPackageAssets(pkg);
  }

  /**
   * Find featured packages for homepage/landing showcases
   */
  async findFeatured(limit = 6) {
    const packages = await this.findAll({
      where: { status: 'active', featured: true },
      order: [['createdAt', 'DESC']],
      limit: Math.max(1, parseInt(limit, 10) || 6),
    });
    return this.enrichPackageAssets(packages);
  }

  /**
   * Find distinct destinations
   */
  async findDistinctDestinations() {
    return this.findAll({
      where: { status: 'active' },
      attributes: ['destination'],
      group: ['destination'],
    });
  }

  /**
   * Filter packages with criteria and assets enrichment
   */
  async findPackagesWithFilters({
    category,
    tier,
    destination,
    search,
    sort,
    minPrice,
    maxPrice,
    page = 1,
    limit = 12,
    includeInactive = false,
  } = {}) {
    const where = {};

    if (!includeInactive) {
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

    let order = [['featured', 'DESC'], ['createdAt', 'DESC']];
    if (sort === 'price-asc') order = [['price', 'ASC']];
    else if (sort === 'price-desc') order = [['price', 'DESC']];
    else if (sort === 'newest') order = [['createdAt', 'DESC']];

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: rawPackages, count: total } = await this.model.findAndCountAll({
      where: this.applySoftDeleteScope(where),
      order,
      offset: skip,
      limit: limitNum,
    });

    const packages = await this.enrichPackageAssets(rawPackages);

    return {
      packages,
      count: packages.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
    };
  }
}

export default new PackageRepository();
