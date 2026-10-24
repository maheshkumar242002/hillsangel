import { Op } from 'sequelize';
import Driver from '../models/Driver.js';
import { processUploadedFile } from '../middleware/upload.js';

// @desc    Get all drivers with optional search & status filter
// @route   GET /api/drivers
// @access  Public / Admin
export const getDrivers = async (req, res) => {
  try {
    const { status, search, sort = 'createdAt' } = req.query;
    const where = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { licenseNumber: { [Op.like]: `%${search}%` } },
        { badgeNumber: { [Op.like]: `%${search}%` } },
        { assignedVehicleReg: { [Op.like]: `%${search}%` } },
      ];
    }

    const drivers = await Driver.findAll({
      where,
      order: [['status', 'ASC'], ['rating', 'DESC'], ['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers from database',
      error: error.message,
    });
  }
};

// @desc    Get single driver by ID
// @route   GET /api/drivers/:id
// @access  Public / Admin
export const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    res.status(200).json({
      success: true,
      data: driver,
    });
  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver details',
      error: error.message,
    });
  }
};

// @desc    Create new driver in Master
// @route   POST /api/drivers
// @access  Private/Admin
export const createDriver = async (req, res) => {
  try {
    const {
      name,
      phone,
      altPhone,
      photoUrl,
      licenseNumber,
      licenseExpiry,
      badgeNumber,
      experienceYears,
      specialization,
      languages,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      address,
      assignedVehicleId,
      assignedVehicleReg,
      dailyBatta,
      rating,
      status,
      notes,
    } = req.body;

    if (!name?.trim() || !phone?.trim() || !licenseNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Driver Name, Mobile Phone, and Driving License Number are required',
      });
    }

    // Check if phone or license number already exists
    const existing = await Driver.findOne({
      where: {
        [Op.or]: [
          { phone: phone.trim() },
          { licenseNumber: licenseNumber.trim().toUpperCase() },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A driver with this Phone Number or License Number already exists in database',
      });
    }

    const driver = await Driver.create({
      name: name.trim(),
      phone: phone.trim(),
      altPhone: altPhone || '',
      photoUrl: photoUrl || '',
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseExpiry: licenseExpiry || '',
      badgeNumber: badgeNumber || '',
      experienceYears: Number(experienceYears) || 5,
      specialization: specialization || 'High-Altitude 4x4 Mountain Safari Pilot',
      languages: Array.isArray(languages) ? languages : ['Tamil', 'English'],
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || '',
      bloodGroup: bloodGroup || 'O+',
      address: address || '',
      assignedVehicleId: assignedVehicleId ? Number(assignedVehicleId) : null,
      assignedVehicleReg: assignedVehicleReg || '',
      dailyBatta: Number(dailyBatta) || 800,
      rating: Number(rating) || 4.9,
      status: status || 'available',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: `Driver ${driver.name} successfully registered in Master!`,
      data: driver,
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create driver record in database',
      error: error.message,
    });
  }
};

// @desc    Update driver in Master
// @route   PUT /api/drivers/:id
// @access  Private/Admin
export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    const updatePayload = { ...req.body };
    if (updatePayload.licenseNumber) {
      updatePayload.licenseNumber = updatePayload.licenseNumber.trim().toUpperCase();
    }
    if (updatePayload.phone) {
      updatePayload.phone = updatePayload.phone.trim();
    }

    // Check conflict with another driver
    if (updatePayload.phone || updatePayload.licenseNumber) {
      const conflict = await Driver.findOne({
        where: {
          id: { [Op.ne]: driver.id },
          [Op.or]: [
            updatePayload.phone ? { phone: updatePayload.phone } : null,
            updatePayload.licenseNumber ? { licenseNumber: updatePayload.licenseNumber } : null,
          ].filter(Boolean),
        },
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Another driver is already registered with this phone or license number',
        });
      }
    }

    await driver.update(updatePayload);

    res.status(200).json({
      success: true,
      message: 'Driver master record updated successfully',
      data: driver,
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver record',
      error: error.message,
    });
  }
};

// @desc    Delete driver from Master
// @route   DELETE /api/drivers/:id
// @access  Private/Admin
export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    await driver.destroy();

    res.status(200).json({
      success: true,
      message: `Driver ${driver.name} removed from Master`,
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete driver',
      error: error.message,
    });
  }
};

// @desc    Upload driver photo or license document
// @route   POST /api/drivers/upload
// @access  Private/Admin
export const uploadDriverPhoto = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: 'Please provide an image file to upload' });
    }

    const url = await processUploadedFile(file, req);

    res.status(200).json({
      success: true,
      url,
      message: 'Driver photo uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading driver photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message,
    });
  }
};
