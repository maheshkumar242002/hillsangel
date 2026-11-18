import expenseService from '../service/expenseService.js';
import { ApiResponse } from '../common/index.js';
import { ExpenseCategory, ExpenseEntityType, PaymentMode } from '../enums/index.js';

/**
 * Expense Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling ExpenseService, and returning API responses.
 * (Database operations are handled in ExpenseRepository; Business logic & auto-links are handled in ExpenseService)
 */

// @desc    Get all asset and vehicle expenses with filters & stats
// @route   GET /api/expenses
// @access  Admin Protected
export const getExpenses = async (req, res, next) => {
  try {
    const { category, entityType, paymentMode } = req.query;

    // VALIDATION ONLY
    if (category && category !== 'all' && !Object.values(ExpenseCategory).includes(category)) {
      return ApiResponse.badRequest(res, `Invalid category. Allowed: ${Object.values(ExpenseCategory).join(', ')}`);
    }
    if (entityType && entityType !== 'all' && !Object.values(ExpenseEntityType).includes(entityType)) {
      return ApiResponse.badRequest(res, `Invalid entityType. Allowed: ${Object.values(ExpenseEntityType).join(', ')}`);
    }
    if (paymentMode && paymentMode !== 'all' && !Object.values(PaymentMode).includes(paymentMode)) {
      return ApiResponse.badRequest(res, `Invalid paymentMode. Allowed: ${Object.values(PaymentMode).join(', ')}`);
    }

    const result = await expenseService.getExpenses(req.query);

    return ApiResponse.success(res, result.expenses, 'Expenses retrieved successfully', {
      count: result.count,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Admin Protected
export const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Expense ID is required.');
    }

    const expense = await expenseService.getById(Number(id));

    return ApiResponse.success(res, expense, 'Expense details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Create new expense entry
// @route   POST /api/expenses
// @access  Admin Protected
export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, entityType } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      errors.push('Expense title is required (at least 2 characters).');
    }
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.push('Amount must be a positive number greater than 0.');
    }
    if (category && !Object.values(ExpenseCategory).includes(category)) {
      errors.push(`Invalid category. Allowed: ${Object.values(ExpenseCategory).join(', ')}`);
    }
    if (entityType && !Object.values(ExpenseEntityType).includes(entityType)) {
      errors.push(`Invalid entityType. Allowed: ${Object.values(ExpenseEntityType).join(', ')}`);
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for expense creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const createdExpense = await expenseService.createExpense(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(res, createdExpense, 'Expense entry created successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing expense
// @route   PUT /api/expenses/:id
// @access  Admin Protected
export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Expense ID is required.');
    }

    const updated = await expenseService.updateExpense(Number(id), req.body);

    return ApiResponse.success(res, updated, 'Expense updated successfully.');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Reimburse an expense
// @route   POST /api/expenses/:id/reimburse
// @access  Admin Protected
export const reimburseExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Expense ID is required.');
    }

    const reimbursed = await expenseService.reimburseExpense(Number(id), req.body);

    return ApiResponse.success(res, reimbursed, 'Expense reimbursed successfully.');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Delete an expense (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/expenses/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Admin Protected
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Expense ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await expenseService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Expense #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Expense #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
