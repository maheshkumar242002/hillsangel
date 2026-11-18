import settingsService from '../service/settingsService.js';
import { ApiResponse } from '../common/index.js';

/**
 * Settings Controller
 * RESPONSIBILITY: Request validation, calling SettingsService, returning ApiResponse.
 */

// @desc    Get website settings (WhatsApp number, contacts, hero, etc.)
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();
    return ApiResponse.success(res, { settings }, 'Website settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res, next) => {
  try {
    const { contactEmail, whatsappNumber } = req.body;
    const errors = [];

    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) {
      errors.push('Invalid contact email format.');
    }

    if (whatsappNumber && !/^\d{10,14}$/.test(whatsappNumber.replace(/\D/g, ''))) {
      errors.push('Invalid WhatsApp phone number format.');
    }

    if (errors.length > 0) {
      return ApiResponse.badRequest(res, 'Validation failed for settings update.', errors);
    }

    const settings = await settingsService.updateSettings(req.body);
    return ApiResponse.success(res, { settings }, 'Website settings updated successfully.');
  } catch (err) {
    next(err);
  }
};
