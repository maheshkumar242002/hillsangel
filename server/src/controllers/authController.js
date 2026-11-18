import authService from '../service/authService.js';
import { ApiResponse } from '../common/index.js';

/**
 * Auth Controller
 * RESPONSIBILITY: Request validation, parameter parsing, calling AuthService, and returning API responses.
 * (Database operations are handled in AdminRepository; Business logic & JWT signing are handled in AuthService)
 */

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public (Rate limited)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. INPUT VALIDATION ONLY
    const errors = [];
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push('Valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      errors.push('Password is required (at least 4 characters).');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for login.', errors);
    }

    // 2. CALL SERVICE LAYER
    const { token, admin } = await authService.login({ email, password });

    // Set secure HTTP-only cookie
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    };
    res.cookie('adminToken', token, cookieOptions);

    // 3. RETURN STANDARDIZED API RESPONSE (200 OK)
    return ApiResponse.success(res, { token, admin }, 'Logged in successfully.');
  } catch (err) {
    if (err.statusCode === 401) {
      return ApiResponse.unauthorized(res, err.message);
    }
    next(err);
  }
};

// @desc    Admin logout
// @route   POST /api/auth/logout
// @access  Private (Admin)
export const logout = async (req, res, next) => {
  try {
    res.cookie('adminToken', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return ApiResponse.success(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private (Admin)
export const getMe = async (req, res, next) => {
  try {
    if (!req.admin?.id) {
      return ApiResponse.unauthorized(res, 'Not authorized.');
    }

    const admin = await authService.getMe(req.admin.id);

    return ApiResponse.success(res, admin, 'Admin profile retrieved successfully.');
  } catch (err) {
    if (err.statusCode === 404) return ApiResponse.notFound(res, err.message);
    next(err);
  }
};
