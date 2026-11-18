import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import Asset from '../models/Asset.js';
import sequelize from '../config/db.js';

export class AssetRepository extends BaseRepository {
  constructor() {
    super(Asset);
  }

  /**
   * Find assets with category, status, and search filters
   */
  async findAssetsFiltered({ category, status, search, sort = 'name' } = {}) {
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status;
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

    return this.findAll({
      where: this.applySoftDeleteScope(where),
      order,
    });
  }

  /**
   * Find asset by assetCode (with optional excludeId)
   */
  async findByCode(assetCode, excludeId = null) {
    const where = { assetCode: assetCode.toUpperCase().trim() };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return this.findOne(where);
  }

  /**
   * Get asset metrics & KPI aggregates
   */
  async getAssetStatistics() {
    const totalAssets = await this.count();
    const availableAssets = await this.count({ status: 'available' });
    const inUseAssets = await this.count({ status: 'in_use' });
    const maintenanceAssets = await this.count({ status: 'maintenance' });

    const [financialRows] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(buyPrice * quantity), 0) AS totalBuyInvestment,
        COALESCE(SUM(rentPrice * quantity), 0) AS totalRentYieldPotential
      FROM assets
      WHERE isDelete = 0
    `);

    const totals = financialRows?.[0] || { totalBuyInvestment: 0, totalRentYieldPotential: 0 };

    const [categoryRows] = await sequelize.query(`
      SELECT 
        category AS _id,
        COUNT(*) AS count,
        COALESCE(SUM(quantity), 0) AS totalUnits,
        COALESCE(SUM(buyPrice * quantity), 0) AS totalBuyValue
      FROM assets
      WHERE isDelete = 0
      GROUP BY category
    `);

    return {
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
    };
  }
}

export default new AssetRepository();
