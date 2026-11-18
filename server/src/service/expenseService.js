import { BaseService } from './BaseService.js';
import expenseRepository from '../repository/expenseRepository.js';
import Vehicle from '../models/Vehicle.js';
import Asset from '../models/Asset.js';

export class ExpenseService extends BaseService {
  constructor() {
    super(expenseRepository);
  }

  /**
   * Filtered expenses
   */
  async getExpenses(filters) {
    return expenseRepository.findExpensesFiltered(filters);
  }

  /**
   * Create expense with entity name/code linking
   */
  async createExpense(payload) {
    let resolvedVehicleReg = payload.vehicleReg || null;
    let resolvedVehicleName = payload.vehicleName || null;
    let resolvedAssetCode = payload.assetCode || null;

    if (payload.vehicleId && (!resolvedVehicleReg || !resolvedVehicleName)) {
      const v = await Vehicle.findByPk(payload.vehicleId);
      if (v) {
        resolvedVehicleReg = resolvedVehicleReg || v.registrationNumber;
        resolvedVehicleName = resolvedVehicleName || v.name;
      }
    }

    if (payload.assetId && !resolvedAssetCode) {
      const a = await Asset.findByPk(payload.assetId);
      if (a) {
        resolvedAssetCode = a.assetCode;
      }
    }

    const expenseData = {
      ...payload,
      amount: parseFloat(payload.amount),
      vehicleReg: resolvedVehicleReg,
      vehicleName: resolvedVehicleName,
      assetCode: resolvedAssetCode,
    };

    return expenseRepository.create(expenseData);
  }

  /**
   * Update expense
   */
  async updateExpense(id, payload) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      const err = new Error('Expense not found');
      err.statusCode = 404;
      throw err;
    }
    await expense.update(payload);
    return expense;
  }

  /**
   * Reimburse expense
   */
  async reimburseExpense(id, { reimbursementRef, notes }) {
    const expense = await expenseRepository.findById(id);
    if (!expense) {
      const err = new Error('Expense record not found');
      err.statusCode = 404;
      throw err;
    }

    await expense.update({
      status: 'reimbursed',
      reimbursedAt: new Date(),
      reimbursementRef: reimbursementRef || `REIMB-${Date.now().toString().slice(-6)}`,
      notes: notes ? `${expense.notes ? expense.notes + '\n' : ''}${notes}` : expense.notes,
    });

    return expense;
  }
}

export default new ExpenseService();
