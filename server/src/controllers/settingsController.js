import Settings from '../models/Settings.js';

// @desc    Get website settings (WhatsApp number, contacts, hero, etc.)
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        siteName: 'Hills Angel Tours and Travels',
        whatsappNumber: process.env.WHATSAPP_NUMBER || '918111039182',
        contactPhone: '+91 81110 39182',
        contactEmail: 'info@hillsangels.com',
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update website settings
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      await settings.update(req.body);
    }

    res.status(200).json({
      success: true,
      message: 'Website settings updated successfully.',
      settings,
    });
  } catch (err) {
    next(err);
  }
};
