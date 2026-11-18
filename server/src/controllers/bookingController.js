import bookingService from '../service/bookingService.js';
import { ApiResponse } from '../common/index.js';
import { BookingStatus, BookingType } from '../enums/index.js';

/**
 * Booking Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling BookingService, and returning API responses.
 * (Database operations are handled in BookingRepository; Business logic & pricing math are handled in BookingService)
 */

// @desc    Create a new booking (Public)
// @route   POST /api/bookings
// @access  Public (Rate limited)
export const createBooking = async (req, res, next) => {
  try {
    const { customerName, phone, travelDate, persons, pickupLocation, bookingType } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];

    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      errors.push('Customer Name must be at least 2 characters long.');
    }

    const cleanPhoneDigits = (phone && typeof phone === 'string' ? phone.trim().replace(/\D/g, '') : '');
    const cleanPhone = cleanPhoneDigits.length > 10 ? cleanPhoneDigits.slice(-10) : cleanPhoneDigits;
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      errors.push('Valid 10-digit Indian mobile number is required (e.g. 9840123456).');
    }

    if (!pickupLocation || typeof pickupLocation !== 'string' || pickupLocation.trim().length < 2) {
      errors.push('Valid pickup location is required.');
    }

    if (!travelDate) {
      errors.push('Travel date is required.');
    } else {
      const parsedDate = new Date(travelDate);
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2020) {
        errors.push('Invalid calendar date provided for travel.');
      }
    }

    const numPersons = parseInt(persons, 10);
    if (isNaN(numPersons) || numPersons < 1) {
      errors.push('Number of travellers must be at least 1.');
    }

    if (bookingType && !Object.values(BookingType).includes(bookingType) && !bookingType.startsWith('vehicle_rental')) {
      errors.push(`Invalid booking type. Allowed: ${Object.values(BookingType).join(', ')}`);
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for booking creation.', errors);
    }

    // 2. CALL SERVICE LAYER (Handles price calculation, customer linking, WhatsApp)
    const result = await bookingService.processBookingCreation(req.body);

    // 3. RETURN STANDARDIZED API RESPONSE (201 Created)
    return ApiResponse.created(
      res,
      result,
      'Trip booking confirmed successfully!'
    );
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    if (err.statusCode === 400) return ApiResponse.badRequest(res, err.message);
    next(err);
  }
};

// @desc    Get all bookings with filters, search, and pagination
// @route   GET /api/bookings
// @access  Private (Admin)
export const getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Validate status against BookingStatus Enum if supplied
    if (status && status !== 'all' && !Object.values(BookingStatus).includes(status.toLowerCase())) {
      return ApiResponse.badRequest(
        res,
        `Invalid status filter. Allowed: ${Object.values(BookingStatus).join(', ')}, all`
      );
    }

    const result = await bookingService.getBookings(req.query);

    return ApiResponse.success(res, result.bookings, 'Bookings retrieved successfully', {
      count: result.count,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private (Admin)
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Booking ID is required.');
    }

    const booking = await bookingService.getBookingById(Number(id));

    return ApiResponse.success(res, booking, 'Booking details retrieved successfully');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Update booking status, notes, and vehicle/driver dispatch
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Booking ID is required.');
    }

    if (status && !Object.values(BookingStatus).includes(status.toLowerCase())) {
      return ApiResponse.badRequest(
        res,
        `Invalid status value. Allowed: ${Object.values(BookingStatus).join(', ')}`
      );
    }

    const result = await bookingService.updateBookingStatus(Number(id), req.body);

    return ApiResponse.success(
      res,
      result.booking,
      `Booking status updated to ${result.booking.status}`,
      { settlement: result.settlement }
    );
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Delete booking (Supports Soft Delete & Hard Delete)
// @route   DELETE /api/bookings/:id
// @query   hard=true (Optional: permanent deletion; default false sets isDelete: true)
// @access  Private (Admin)
export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Booking ID is required.');
    }

    const isHard = req.query.hard === 'true' || req.body?.hard === true;
    const result = await bookingService.delete(Number(id), { hard: isHard });

    if (isHard) {
      return ApiResponse.success(res, result, `Booking #${id} permanently deleted from database (Hard Delete)`);
    }

    return ApiResponse.success(res, result, `Booking #${id} moved to trash (Soft Delete: isDelete set to true)`);
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Generate customer confirmation WhatsApp URL and mark sent
// @route   POST /api/bookings/:id/send-whatsapp
// @access  Private (Admin)
export const sendCustomerWhatsApp = async (req, res, next) => {
  try {
    const { id } = req.params;

    // VALIDATION ONLY
    if (!id || isNaN(Number(id))) {
      return ApiResponse.badRequest(res, 'Valid numeric Booking ID is required.');
    }

    const result = await bookingService.sendCustomerWhatsApp(Number(id));

    return ApiResponse.success(res, result, 'Customer WhatsApp link generated successfully.');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};

// @desc    Export bookings to CSV
// @route   GET /api/bookings/export/csv
// @access  Private (Admin)
export const exportBookingsCsv = async (req, res, next) => {
  try {
    const csvContent = await bookingService.exportBookingsCsv();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="hills-angels-bookings-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
