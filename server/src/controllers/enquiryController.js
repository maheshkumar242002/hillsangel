import enquiryService from '../service/enquiryService.js';
import { ApiResponse } from '../common/index.js';
import { EnquiryStatus } from '../enums/index.js';

/**
 * Enquiry Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling EnquiryService, and returning API responses.
 * (Database operations are handled in EnquiryRepository; Business logic & links are handled in EnquiryService)
 */

// @desc    Submit public contact enquiry
// @route   POST /api/enquiries
// @access  Public (Rate limited)
export const createEnquiry = async (req, res, next) => {
  try {
    const { name, phone, message } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      errors.push('Valid phone number is required.');
    }
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      errors.push('Message must be at least 5 characters.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for enquiry submission.', errors);
    }

    // 2. CALL SERVICE LAYER
    const enquiry = await enquiryService.createEnquiry(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(
      res,
      { enquiryId: enquiry.id, _id: String(enquiry.id) },
      'Thank you for reaching out! Our travel specialist will contact you shortly.'
    );
  } catch (err) {
    next(err);
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private (Admin)
export const getEnquiries = async (req, res, next) => {
  try {
    const { status } = req.query;

    if (status && status !== 'all' && !Object.values(EnquiryStatus).includes(status)) {
      return ApiResponse.badRequest(res, `Invalid status filter. Allowed: ${Object.values(EnquiryStatus).join(', ')}`);
    }

    const result = await enquiryService.getEnquiries(req.query);

    return ApiResponse.success(res, result.enquiries, 'Enquiries retrieved successfully', {
      count: result.count,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update enquiry status
// @route   PATCH /api/enquiries/:id/status
// @access  Private (Admin)
export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // 1. VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Enquiry ID is required.');
    }
    if (!status || !Object.values(EnquiryStatus).includes(status)) {
      return ApiResponse.badRequest(
        res,
        `Valid status is required. Allowed: ${Object.values(EnquiryStatus).join(', ')}`
      );
    }

    // 2. CALL SERVICE LAYER
    const enquiry = await enquiryService.updateStatus(Number(id), status);

    // 3. RETURN RESPONSE
    return ApiResponse.success(res, enquiry, `Enquiry status updated to ${enquiry.status}.`);
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Delete enquiry (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/enquiries/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private (Admin)
export const deleteEnquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Enquiry ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await enquiryService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Enquiry #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Enquiry #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Get WhatsApp reply link for enquiry
// @route   GET /api/enquiries/:id/whatsapp-link
// @access  Private (Admin)
export const getEnquiryWhatsAppLink = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Enquiry ID is required.');
    }

    const result = await enquiryService.getWhatsAppLink(Number(id));

    return ApiResponse.success(res, result, 'WhatsApp link generated successfully.');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};
