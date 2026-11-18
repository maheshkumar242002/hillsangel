import { Op } from 'sequelize';
import { BaseRepository } from './BaseRepository.js';
import AssetExpense from '../models/AssetExpense.js';
import Vehicle from '../models/Vehicle.js';
import Asset from '../models/Asset.js';

export class ExpenseRepository extends BaseRepository {
  constructor() {
    super(AssetExpense);
  }

  /**
   * Find expenses with filters, search, and date ranges
   */
  async findExpensesFiltered({
    category,
    entityType,
    vehicleId,
    assetId,
    status,
    paymentMode,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
    sort = 'date_desc',
  } = {}) {
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (entityType && entityType !== 'all') where.entityType = entityType;
    if (vehicleId && vehicleId !== 'all') where.vehicleId = vehicleId;
    if (assetId && assetId !== 'all') where.assetId = assetId;
    if (status && status !== 'all') where.status = status;
    if (paymentMode && paymentMode !== 'all') where.paymentMode = paymentMode;

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate[Op.gte] = startDate;
      if (endDate) where.expenseDate[Op.lte] = endDate;
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { title: { [Op.like]: term } },
        { vendorName: { [Op.like]: term } },
        { invoiceNumber: { [Op.like]: term } },
        { vehicleReg: { [Op.like]: term } },
        { vehicleName: { [Op.like]: term } },
        { assetCode: { [Op.like]: term } },
        { paidBy: { [Op.like]: term } },
      ];
    }

    let order = [['expenseDate', 'DESC'], ['createdAt', 'DESC']];
    if (sort === 'date_asc') order = [['expenseDate', 'ASC']];
    else if (sort === 'amount_desc') order = [['amount', 'DESC']];
    else if (sort === 'amount_asc') order = [['amount', 'ASC']];

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const { rows: expenses, count: total } = await this.model.findAndCountAll({
      where: this.applySoftDeleteScope(where),
      include: [
        { model: Vehicle, as: 'vehicleDetails', required: false },
        { model: Asset, as: 'assetDetails', required: false },
      ],
      order,
      offset: skip,
      limit: limitNum,
    });

    return {
      expenses,
      count: expenses.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
    };
  }
}

export default new ExpenseRepository();
