import partnerTieupService from '../service/partnerTieupService.js';
import { ApiResponse } from '../common/index.js';
import { PartnerCategory, PartnerPricingModel, PartnerStatus } from '../enums/index.js';

/**
 * Partner Tie-up Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling PartnerTieupService, returning ApiResponse.
 */

// @desc    Get all partner tie-ups with filters & search
// @route   GET /api/partners
// @access  Public / Admin
export const getPartners = async (req, res, next) => {
  try {
    const { category, status, pricingModel } = req.query;
    const errors = [];

    if (category && category !== 'all' && !Object.values(PartnerCategory).includes(category)) {
      errors.push(`Invalid category filter. Allowed: ${Object.values(PartnerCategory).join(', ')}`);
    }

    if (status && status !== 'all' && !Object.values(PartnerStatus).includes(status)) {
      errors.push(`Invalid status filter. Allowed: ${Object.values(PartnerStatus).join(', ')}`);
    }

    if (pricingModel && pricingModel !== 'all' && !Object.values(PartnerPricingModel).includes(pricingModel)) {
      errors.push(`Invalid pricing model filter. Allowed: ${Object.values(PartnerPricingModel).join(', ')}`);
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation error on partner filters.', errors);
    }

    const partners = await partnerTieupService.getPartners(req.query);
    return ApiResponse.success(res, partners, 'Partner tie-ups fetched successfully', {
      count: partners.length,
      partners,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get partner statistics & financial averages
// @route   GET /api/partners/stats
// @access  Private (Admin)
export const getPartnerStats = async (req, res, next) => {
  try {
    const stats = await partnerTieupService.getPartnerStats();
    return ApiResponse.success(res, stats, 'Partner statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate Trip Settlement / Vendor Cost Estimator
// @route   POST /api/partners/calculate-settlement
// @access  Private (Admin)
export const calculateTripSettlement = async (req, res, next) => {
  try {
    const { persons, nights, days } = req.body;
    const errors = [];

    if (persons !== undefined && (isNaN(Number(persons)) || Number(persons) < 1)) {
      errors.push('Persons count must be a positive integer greater than 0.');
    }

    if (nights !== undefined && (isNaN(Number(nights)) || Number(nights) < 0)) {
      errors.push('Nights count must be a non-negative integer.');
    }

    if (days !== undefined && (isNaN(Number(days)) || Number(days) < 1)) {
      errors.push('Days count must be a positive integer greater than 0.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation error on settlement calculation inputs.', errors);
    }

    const result = await partnerTieupService.calculateTripSettlement(req.body);
    return ApiResponse.success(res, result, 'Trip settlement estimated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single partner tie-up by ID
// @route   GET /api/partners/:id
// @access  Public / Admin
export const getPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Partner ID is required.');
    }

    const partner = await partnerTieupService.getPartnerById(Number(id));
    return ApiResponse.success(res, { partner }, 'Partner details retrieved successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Create new partner tie-up
// @route   POST /api/partners
// @access  Private (Admin)
export const createPartner = async (req, res, next) => {
  try {
    const { name, phone, category, pricingModel } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Partner name is required and must be at least 2 characters long.');
    }

    if (category && !Object.values(PartnerCategory).includes(category)) {
      errors.push(`Invalid partner category. Allowed: ${Object.values(PartnerCategory).join(', ')}`);
    }

    if (pricingModel && !Object.values(PartnerPricingModel).includes(pricingModel)) {
      errors.push(`Invalid pricing model. Allowed: ${Object.values(PartnerPricingModel).join(', ')}`);
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.push('Invalid phone number provided.');
      }
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for partner creation.', errors);
    }

    const partner = await partnerTieupService.createPartner(req.body);
    return ApiResponse.created(res, { partner }, 'Partner tie-up created successfully');
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.conflict(res, 'Partner code already exists. Please choose a unique code.');
    }
    next(error);
  }
};

// @desc    Update partner tie-up
// @route   PUT /api/partners/:id
// @access  Private (Admin)
export const updatePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Partner ID is required.');
    }

    const { category, pricingModel, phone } = req.body;
    const errors = [];

    if (category && !Object.values(PartnerCategory).includes(category)) {
      errors.push(`Invalid partner category. Allowed: ${Object.values(PartnerCategory).join(', ')}`);
    }

    if (pricingModel && !Object.values(PartnerPricingModel).includes(pricingModel)) {
      errors.push(`Invalid pricing model. Allowed: ${Object.values(PartnerPricingModel).join(', ')}`);
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.push('Invalid phone number provided.');
      }
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for partner update.', errors);
    }

    const partner = await partnerTieupService.updatePartner(Number(id), req.body);
    return ApiResponse.success(res, { partner }, 'Partner tie-up updated successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.conflict(res, 'Partner code already exists. Please choose a unique code.');
    }
    next(error);
  }
};

// @desc    Delete partner tie-up (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/partners/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private (Admin)
export const deletePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Partner ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await partnerTieupService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Partner #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Partner #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Save new trip settlement record with partner profit shares
// @route   POST /api/partners/settlements
// @access  Private (Admin)
export const saveTripSettlement = async (req, res, next) => {
  try {
    const { tripTitle } = req.body;
    if (!tripTitle || typeof tripTitle !== 'string' || tripTitle.trim().length < 2) {
      return ApiResponse.badRequest(res, 'Trip title is required and must be at least 2 characters long.');
    }

    const settlement = await partnerTieupService.saveTripSettlement(req.body);
    return ApiResponse.created(res, { settlement }, 'Trip settlement and partner profit shares saved successfully');
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.conflict(res, 'Settlement code already exists. Please use a unique reference code.');
    }
    next(error);
  }
};

// @desc    Get all trip settlements with filters & pagination
// @route   GET /api/partners/settlements
// @access  Private (Admin)
export const getTripSettlements = async (req, res, next) => {
  try {
    const settlements = await partnerTieupService.getTripSettlements(req.query);
    return ApiResponse.success(res, settlements, 'Settlements fetched successfully', {
      count: settlements.length,
      settlements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive commission & profit tracking analytics
// @route   GET /api/partners/commission-stats
// @access  Private (Admin)
export const getCommissionStats = async (req, res, next) => {
  try {
    const stats = await partnerTieupService.getCommissionStats();
    return ApiResponse.success(res, { stats }, 'Commission statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Update partner payout status inside a settlement
// @route   PUT /api/partners/settlements/:id/payout
// @access  Private (Admin)
export const updatePartnerPayoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Settlement ID is required.');
    }

    const { status } = req.body;
    if (status && !['paid', 'pending'].includes(status)) {
      return ApiResponse.badRequest(res, 'Status must be either "paid" or "pending".');
    }

    const result = await partnerTieupService.updatePartnerPayoutStatus(Number(id), req.body);
    return ApiResponse.success(res, result, `Payout for partner updated successfully`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Delete trip settlement (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/partners/settlements/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private (Admin)
export const deleteTripSettlement = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Settlement ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await partnerTieupService.deleteTripSettlement(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Settlement record #${id} permanently deleted (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Settlement record #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Auto-calculate profit & vendor costs for a specific booking
// @route   POST /api/partners/auto-calculate-booking
// @access  Private (Admin)
export const autoCalculateBookingProfit = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId || String(bookingId).trim() === '') {
      return ApiResponse.badRequest(res, 'Valid bookingId is required.');
    }

    const data = await partnerTieupService.generateSettlementForBooking(bookingId, req.body);
    return ApiResponse.success(res, { data }, 'Booking profit calculated successfully');
  } catch (error) {
    if (error.statusCode === 404) return ApiResponse.notFound(res, error.message);
    next(error);
  }
};

// @desc    Auto-generate settlement accounts for all confirmed/completed bookings
// @route   POST /api/partners/auto-settle-all
// @access  Private (Admin)
export const autoSettleAllBookings = async (req, res, next) => {
  try {
    const result = await partnerTieupService.autoSettleAllBookings();
    return ApiResponse.success(res, {
      count: result.settledList.length,
      settled: result.settledList,
      skipped: result.skippedList,
    }, `Generated accounts for ${result.settledList.length} trip(s). (${result.skippedList.length} trips already had existing accounts).`);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload partner photo
// @route   POST /api/partners/upload
// @access  Private (Admin)
export const uploadPartnerImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'Please provide an image file to upload.');
    }

    const imageUrl = await partnerTieupService.uploadPartnerPhoto(req.file, req);
    return ApiResponse.success(res, { imageUrl }, 'Partner image uploaded successfully.');
  } catch (error) {
    if (error.statusCode) {
      return ApiResponse.send(res, error.statusCode, { success: false, message: error.message });
    }
    next(error);
  }
};
