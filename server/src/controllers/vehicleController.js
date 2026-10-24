import Vehicle from '../models/Vehicle.js';
import { Op } from 'sequelize';
import { processUploadedFile } from '../middleware/upload.js';

// @desc    Get all vehicles (Public & Booking Form)
// @route   GET /api/vehicles
// @access  Public
export const getVehicles = async (req, res) => {
  try {
    const { mode, persons, status, vehicleType } = req.query;

    const where = {};

    // By default, only show available or active vehicles for public booking
    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['available', 'on_tour'] };
    }

    if (mode === 'rental') {
      where.isAvailableForRental = true;
    } else if (mode === 'tour') {
      where.isAvailableForTour = true;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    const personCount = parseInt(persons, 10);
    if (!isNaN(personCount) && personCount > 0) {
      where.seatingCapacity = { [Op.gte]: personCount };
    }

    const vehicles = await Vehicle.findAll({
      where,
      order: [
        ['sortOrder', 'ASC'],
        ['seatingCapacity', 'ASC'],
      ],
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles from database',
      error: error.message,
    });
  }
};

// @desc    Get single vehicle details (including RC, Insurance, Mileage)
// @route   GET /api/vehicles/:id
// @access  Public
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error fetching vehicle by id:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message,
    });
  }
};

// @desc    Create new vehicle in Master (Admin only)
// @route   POST /api/vehicles
// @access  Private/Admin
export const createVehicle = async (req, res) => {
  try {
    const { name, regNumber } = req.body;
    if (!name || !regNumber) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle name and registration number are required',
      });
    }

    // Check if regNumber already exists
    const existing = await Vehicle.findOne({
      where: { regNumber: regNumber.toUpperCase().trim() },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with registration number ${regNumber} already exists in database`,
      });
    }

    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle in database',
      error: error.message,
    });
  }
};

// @desc    Update vehicle details, RC, Insurance, Odometer (Admin only)
// @route   PUT /api/vehicles/:id
// @access  Private/Admin
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    await vehicle.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Vehicle master updated successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message,
    });
  }
};

// @desc    Delete vehicle from Master (Admin only)
// @route   DELETE /api/vehicles/:id
// @access  Private/Admin
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    await vehicle.destroy();

    res.status(200).json({
      success: true,
      message: 'Vehicle removed from database',
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message,
    });
  }
};

// @desc    Upload vehicle images / condition photos
// @route   POST /api/vehicles/upload
// @access  Private/Admin
export const uploadVehicleImages = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an image file to upload' });
    }

    const uploadedUrls = [];
    for (const file of files) {
      const url = await processUploadedFile(file, req);
      uploadedUrls.push(url);
    }

    res.status(200).json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      message: 'Vehicle image(s) uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading vehicle image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message,
    });
  }
};

// @desc    Start trip inspection (updates status to on_tour, records condition photos, start km & fuel)
// @route   POST /api/vehicles/:id/start-trip
// @access  Private/Admin
export const startTripInspection = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const {
      startOdometerKm,
      fuelLevel,
      conditionPhotos,
      driverName,
      driverPhone,
      customerName,
      destination,
      remarks,
      bookingId,
    } = req.body;

    const startKm = parseInt(startOdometerKm, 10) || vehicle.currentOdometerKm || 0;

    const inspectionRecord = {
      tripId: `TRIP-${Date.now().toString().slice(-6)}`,
      bookingId: bookingId || '',
      customerName: customerName || 'Mountain Guest',
      destination: destination || 'Safari Circuit',
      driverName: driverName || vehicle.driverName,
      driverPhone: driverPhone || vehicle.driverPhone,
      startOdometerKm: startKm,
      fuelLevel: fuelLevel || 'Full Tank',
      conditionPhotos: Array.isArray(conditionPhotos) ? conditionPhotos : [],
      remarks: remarks || 'Pre-trip inspection verified & approved',
      startedAt: new Date().toISOString(),
      status: 'active',
    };

    await vehicle.update({
      status: 'on_tour',
      currentOdometerKm: startKm,
      currentTrip: inspectionRecord,
    });

    res.status(200).json({
      success: true,
      message: 'Trip started successfully with vehicle condition photos & inspection logged!',
      data: vehicle,
    });
  } catch (error) {
    console.error('Error starting trip inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record trip start inspection',
      error: error.message,
    });
  }
};

// @desc    End trip inspection (records return km, condition photos, updates status to available)
// @route   POST /api/vehicles/:id/end-trip
// @access  Private/Admin
export const endTripInspection = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const {
      endOdometerKm,
      returnFuelLevel,
      returnConditionPhotos,
      closingRemarks,
    } = req.body;

    const endKm = parseInt(endOdometerKm, 10) || vehicle.currentOdometerKm || 0;
    const currentTrip = vehicle.currentTrip || {};
    const kmRun = Math.max(0, endKm - (currentTrip.startOdometerKm || endKm));

    const completedTrip = {
      ...currentTrip,
      endOdometerKm: endKm,
      kmRun,
      returnFuelLevel: returnFuelLevel || 'Normal',
      returnConditionPhotos: Array.isArray(returnConditionPhotos) ? returnConditionPhotos : [],
      closingRemarks: closingRemarks || 'Vehicle returned in safe condition',
      endedAt: new Date().toISOString(),
      status: 'completed',
    };

    const history = Array.isArray(vehicle.tripInspectionHistory) ? [...vehicle.tripInspectionHistory] : [];
    history.unshift(completedTrip);

    await vehicle.update({
      status: 'available',
      currentOdometerKm: endKm,
      currentTrip: null,
      tripInspectionHistory: history.slice(0, 30),
    });

    res.status(200).json({
      success: true,
      message: `Trip completed! Total distance run: ${kmRun} km. Vehicle is now Available.`,
      data: vehicle,
    });
  } catch (error) {
    console.error('Error ending trip inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete trip inspection',
      error: error.message,
    });
  }
};
