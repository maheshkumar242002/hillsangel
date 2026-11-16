import { Op } from 'sequelize';
import AssetExpense from '../models/AssetExpense.js';
import Vehicle from '../models/Vehicle.js';
import Asset from '../models/Asset.js';
import Settings from '../models/Settings.js';
import sequelize from '../config/db.js';

// @desc    Get all asset and vehicle expenses with filters & stats
// @route   GET /api/expenses
// @access  Admin Protected
export const getExpenses = async (req, res, next) => {
  try {
    const {
      search,
      entityType,
      vehicleId,
      assetId,
      category,
      paidByPartnerId,
      status,
      startDate,
      endDate,
      sort = 'expenseDate_desc',
    } = req.query;

    const where = {};

    if (entityType && entityType !== 'all') {
      where.entityType = entityType;
    }
    if (vehicleId && vehicleId !== 'all') {
      where.vehicleId = vehicleId;
    }
    if (assetId && assetId !== 'all') {
      where.assetId = assetId;
    }
    if (category && category !== 'all') {
      where.category = category;
    }
    if (paidByPartnerId && paidByPartnerId !== 'all') {
      where.paidByPartnerId = paidByPartnerId;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    if (startDate && endDate) {
      where.expenseDate = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      where.expenseDate = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      where.expenseDate = {
        [Op.lte]: endDate,
      };
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { expenseCode: { [Op.like]: term } },
        { title: { [Op.like]: term } },
        { vehicleReg: { [Op.like]: term } },
        { vehicleName: { [Op.like]: term } },
        { assetName: { [Op.like]: term } },
        { assetCode: { [Op.like]: term } },
        { paidByPartnerName: { [Op.like]: term } },
        { paymentRef: { [Op.like]: term } },
        { notes: { [Op.like]: term } },
      ];
    }

    let order = [['expenseDate', 'DESC'], ['id', 'DESC']];
    if (sort === 'expenseDate_asc') order = [['expenseDate', 'ASC'], ['id', 'ASC']];
    else if (sort === 'amount_desc') order = [['amount', 'DESC']];
    else if (sort === 'amount_asc') order = [['amount', 'ASC']];

    const expenses = await AssetExpense.findAll({
      where,
      order,
    });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed statistics and partner accounts summary
// @route   GET /api/expenses/stats
// @access  Admin Protected
export const getExpenseStats = async (req, res, next) => {
  try {
    const allExpenses = await AssetExpense.findAll();

    const totalExpenseAmount = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalTransactions = allExpenses.length;

    // Entity Breakdown (Vehicle vs Asset vs General)
    const entityBreakdown = {
      vehicle: { count: 0, amount: 0 },
      asset: { count: 0, amount: 0 },
      general: { count: 0, amount: 0 },
    };

    // Category Breakdown
    const categoryBreakdown = {};

    // Partner Accounts Breakdown
    const partnerAccountsMap = {};

    // Vehicle Specific Breakdown
    const vehicleBreakdownMap = {};

    // Status breakdown
    let totalPendingReimbursement = 0;
    let totalReimbursed = 0;
    let totalDirectCompany = 0;

    allExpenses.forEach((exp) => {
      const amt = Number(exp.amount) || 0;

      // Entity
      const entity = exp.entityType || 'vehicle';
      if (entityBreakdown[entity]) {
        entityBreakdown[entity].count += 1;
        entityBreakdown[entity].amount += amt;
      }

      // Category
      const cat = exp.category || 'other';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { count: 0, amount: 0 };
      }
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].amount += amt;

      // Partner Accounts
      const pId = exp.paidByPartnerId || 'unknown';
      const pName = exp.paidByPartnerName || 'Unknown Partner';

      if (!partnerAccountsMap[pId]) {
        partnerAccountsMap[pId] = {
          partnerId: pId,
          partnerName: pName,
          totalPaid: 0,
          reimbursed: 0,
          pendingReimbursement: 0,
          directCompany: 0,
          expenseCount: 0,
        };
      }

      partnerAccountsMap[pId].totalPaid += amt;
      partnerAccountsMap[pId].expenseCount += 1;

      if (exp.status === 'reimbursed') {
        partnerAccountsMap[pId].reimbursed += amt;
        totalReimbursed += amt;
      } else if (exp.status === 'direct_company') {
        partnerAccountsMap[pId].directCompany += amt;
        totalDirectCompany += amt;
      } else {
        partnerAccountsMap[pId].pendingReimbursement += amt;
        totalPendingReimbursement += amt;
      }

      // Vehicle
      if (exp.vehicleReg || exp.vehicleName) {
        const vKey = exp.vehicleReg || exp.vehicleName;
        if (!vehicleBreakdownMap[vKey]) {
          vehicleBreakdownMap[vKey] = {
            vehicleReg: exp.vehicleReg || '',
            vehicleName: exp.vehicleName || vKey,
            vehicleId: exp.vehicleId,
            totalExpense: 0,
            expenseCount: 0,
            fuelExpense: 0,
            serviceExpense: 0,
            insuranceExpense: 0,
            otherExpense: 0,
          };
        }
        vehicleBreakdownMap[vKey].totalExpense += amt;
        vehicleBreakdownMap[vKey].expenseCount += 1;
        if (exp.category === 'fuel') vehicleBreakdownMap[vKey].fuelExpense += amt;
        else if (exp.category === 'service_maintenance' || exp.category === 'repair_parts') vehicleBreakdownMap[vKey].serviceExpense += amt;
        else if (exp.category === 'insurance' || exp.category === 'fc_permit') vehicleBreakdownMap[vKey].insuranceExpense += amt;
        else vehicleBreakdownMap[vKey].otherExpense += amt;
      }
    });

    const partnerAccounts = Object.values(partnerAccountsMap);
    const vehicleBreakdown = Object.values(vehicleBreakdownMap);

    res.status(200).json({
      success: true,
      stats: {
        totalExpenseAmount,
        totalTransactions,
        totalPendingReimbursement,
        totalReimbursed,
        totalDirectCompany,
        entityBreakdown,
        categoryBreakdown,
        partnerAccounts,
        vehicleBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new asset or vehicle expense
// @route   POST /api/expenses
// @access  Admin Protected
export const createExpense = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Auto generate unique expenseCode
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    data.expenseCode = `EXP-${yr}${mo}-${rand}`;

    // Auto populate vehicle info if vehicleId provided
    if (data.vehicleId) {
      const v = await Vehicle.findByPk(data.vehicleId);
      if (v) {
        data.vehicleReg = v.regNumber;
        data.vehicleName = v.name;
        data.entityType = 'vehicle';
      }
    }

    // Auto populate asset info if assetId provided
    if (data.assetId) {
      const a = await Asset.findByPk(data.assetId);
      if (a) {
        data.assetCode = a.assetCode;
        data.assetName = a.name;
        data.entityType = 'asset';
      }
    }

    // Fallback partner name if not provided
    if (!data.paidByPartnerName) {
      data.paidByPartnerName = data.paidByPartnerId === 'company' ? 'Company Account' : 'Managing Partner';
    }

    const expense = await AssetExpense.create(data);

    res.status(201).json({
      success: true,
      message: `Expense ${expense.expenseCode} recorded successfully`,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an expense record
// @route   PUT /api/expenses/:id
// @access  Admin Protected
export const updateExpense = async (req, res, next) => {
  try {
    const expense = await AssetExpense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found',
      });
    }

    const data = { ...req.body };
    delete data.id;
    delete data.expenseCode; // Preserve generated code

    await expense.update(data);

    res.status(200).json({
      success: true,
      message: 'Expense record updated successfully',
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark an expense as reimbursed / settled to partner
// @route   PATCH /api/expenses/:id/reimburse
// @access  Admin Protected
export const reimburseExpense = async (req, res, next) => {
  try {
    const expense = await AssetExpense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found',
      });
    }

    const { status = 'reimbursed', reimbursementRef, notes } = req.body;

    expense.status = status;
    expense.reimbursedAt = status === 'reimbursed' ? new Date().toISOString().split('T')[0] : null;
    if (reimbursementRef) expense.reimbursementRef = reimbursementRef;
    if (notes) expense.notes = expense.notes ? `${expense.notes}\n[Settlement]: ${notes}` : `[Settlement]: ${notes}`;

    await expense.save();

    res.status(200).json({
      success: true,
      message: `Expense ${expense.expenseCode} marked as ${status}`,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Admin Protected
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await AssetExpense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense record not found',
      });
    }

    await expense.destroy();

    res.status(200).json({
      success: true,
      message: 'Expense record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

