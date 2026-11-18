import customerService from '../service/customerService.js';
import { ApiResponse } from '../common/index.js';
import { CustomerStatus } from '../enums/index.js';

/**
 * Customer Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling CustomerService, and returning API responses.
 * (Database operations are handled in CustomerRepository; Business logic & history joins are handled in CustomerService)
 */

// @desc    Get all customers with pagination & search (Admin)
// @route   GET /api/customers
// @access  Private (Admin)
export const getCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getCustomers(req.query);

    return ApiResponse.success(res, result.customers, 'Customers retrieved successfully', {
      count: result.customers.length,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / Insert a customer record (Admin)
// @route   POST /api/customers
// @access  Private (Admin)
export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, status } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Customer Name must be at least 2 characters.');
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      errors.push('Valid phone number is required.');
    }
    if (status && !Object.values(CustomerStatus).includes(status)) {
      errors.push(`Invalid customer status. Allowed: ${Object.values(CustomerStatus).join(', ')}`);
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for customer creation.', errors);
    }

    // 2. CALL SERVICE LAYER
    const customer = await customerService.createCustomer(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(res, customer, 'Customer inserted successfully.');
  } catch (error) {
    if (error.statusCode === 409) return ApiResponse.conflict(res, error.message);
    next(error);
  }
};

// @desc    Get single customer details with linked bookings (Admin)
// @route   GET /api/customers/:id
// @access  Private (Admin)
export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Customer ID is required.');
    }

    const result = await customerService.getCustomerWithBookings(Number(id));

    return ApiResponse.success(res, result, 'Customer details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Update customer details or notes (Admin)
// @route   PUT /api/customers/:id
// @access  Private (Admin)
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Customer ID is required.');
    }
    if (status && !Object.values(CustomerStatus).includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status. Allowed: ${Object.values(CustomerStatus).join(', ')}`);
    }

    const updatedCustomer = await customerService.updateCustomer(Number(id), req.body);

    return ApiResponse.success(res, updatedCustomer, 'Customer profile updated successfully.');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Delete a customer (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/customers/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private (Admin)
export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Customer ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await customerService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Customer #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Customer #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};
