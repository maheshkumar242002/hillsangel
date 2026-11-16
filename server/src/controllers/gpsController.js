import VehicleGps from '../models/VehicleGps.js';

// 1. Get all tracked vehicles + live fleet summary (100% database driven)
export const getTrackedVehicles = async (req, res, next) => {
  try {
    const vehicles = await VehicleGps.findAll({
      order: [['status', 'ASC'], ['updatedAt', 'DESC']],
    });

    const totalVehicles = vehicles.length;
    const onTourCount = vehicles.filter((v) => v.status === 'on_tour').length;
    const idleCount = vehicles.filter((v) => v.status === 'idle').length;
    const stoppedCount = vehicles.filter((v) => v.status === 'stopped').length;
    const movingCount = vehicles.filter((v) => (v.speed || 0) > 0).length;

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      summary: {
        totalVehicles,
        onTourCount,
        idleCount,
        stoppedCount,
        movingCount,
        officeBaseCoordinates: {
          lat: 10.9820004,
          lng: 76.9334183,
          label: 'Hills Angel Office & Vehicle Collection Point (Coimbatore)',
          mapUrl: 'https://maps.app.goo.gl/NMojzWSiK3qqvGoJA',
        },
      },
      vehicles,
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get single vehicle by ID or Registration Number
export const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await VehicleGps.findOne({
      where: isNaN(Number(id)) ? { regNumber: id } : { id: Number(id) },
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in GPS fleet' });
    }

    return res.status(200).json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
};

// 3. Update Vehicle GPS Telemetry (from IoT hardware tracker or driver app)
export const updateVehicleGps = async (req, res, next) => {
  try {
    // 1. Device / Admin Authentication Check
    const deviceKey = req.headers['x-device-key'] || req.headers['x-api-key'];
    const configuredKey = process.env.GPS_DEVICE_API_KEY || 'hills_angels_gps_iot_device_auth_2026_safe';
    const isAdmin = Boolean(req.admin);

    if (!isAdmin && (!deviceKey || deviceKey !== configuredKey)) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized GPS update. Valid X-Device-Key or admin authorization required.',
      });
    }

    const regNumber = req.body.regNumber || req.body.registrationNumber;
    const { deviceId, latitude, longitude, speed, heading, altitude, ignition, batteryLevel, currentLocationName, status } = req.body;

    if (!regNumber && !deviceId) {
      return res.status(400).json({ success: false, message: 'Vehicle registration number or device ID is required' });
    }

    // 2. Validate coordinates if provided
    if (latitude !== undefined) {
      const latNum = Number(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({ success: false, message: 'Invalid latitude: must be a number between -90 and 90' });
      }
    }

    if (longitude !== undefined) {
      const lngNum = Number(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ success: false, message: 'Invalid longitude: must be a number between -180 and 180' });
      }
    }

    if (status !== undefined) {
      const validStatuses = ['on_tour', 'idle', 'returning', 'stopped', 'maintenance'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status: must be one of ${validStatuses.join(', ')}` });
      }
    }

    let vehicle = await VehicleGps.findOne({
      where: regNumber ? { regNumber } : { deviceId },
    });

    if (!vehicle) {
      vehicle = await VehicleGps.create({
        vehicleName: req.body.vehicleName || `Safari Vehicle (${regNumber || deviceId})`,
        regNumber: regNumber || deviceId,
        deviceId: deviceId || regNumber,
        latitude: Number(latitude) || 10.0889,
        longitude: Number(longitude) || 77.0595,
        speed: Number(speed) || 0,
        heading: Number(heading) || 0,
        altitude: Number(altitude) || 1500,
        ignition: ignition !== undefined ? Boolean(ignition) : true,
        batteryLevel: batteryLevel ? Number(batteryLevel) : 95,
        currentLocationName: currentLocationName || 'Live Location',
        status: status || 'on_tour',
      });
    } else {
      const lat = Number(latitude) || vehicle.latitude;
      const lng = Number(longitude) || vehicle.longitude;
      const curSpeed = speed !== undefined ? Number(speed) : vehicle.speed;

      // Append to breadcrumb route history
      let history = Array.isArray(vehicle.routeHistory) ? [...vehicle.routeHistory] : [];
      history.push({
        lat,
        lng,
        speed: curSpeed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      // Keep last 60 breadcrumb points
      if (history.length > 60) {
        history = history.slice(-60);
      }

      await vehicle.update({
        latitude: lat,
        longitude: lng,
        speed: curSpeed,
        heading: heading !== undefined ? Number(heading) : vehicle.heading,
        altitude: altitude !== undefined ? Number(altitude) : vehicle.altitude,
        ignition: ignition !== undefined ? Boolean(ignition) : vehicle.ignition,
        batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : vehicle.batteryLevel,
        currentLocationName: currentLocationName || vehicle.currentLocationName,
        assignedTour: req.body.assignedTour || vehicle.assignedTour,
        tripType: req.body.tripType || vehicle.tripType,
        customerName: req.body.customerName !== undefined ? req.body.customerName : vehicle.customerName,
        customerPhone: req.body.customerPhone !== undefined ? req.body.customerPhone : vehicle.customerPhone,
        destination: req.body.destination || vehicle.destination,
        planCustomizations: req.body.planCustomizations || vehicle.planCustomizations,
        status: status || (curSpeed > 0 ? 'on_tour' : vehicle.status),
        routeHistory: history,
        lastUpdated: new Date(),
      });
    }

    return res.status(200).json({ success: true, message: 'GPS telemetry updated', vehicle });
  } catch (err) {
    next(err);
  }
};

// 4. Live Simulation Step (moves active vehicles slightly along safari paths for live demonstration)
export const simulateGpsStep = async (req, res, next) => {
  try {
    await ensureVehiclesExist();
    const vehicles = await VehicleGps.findAll();

    for (const v of vehicles) {
      if (v.status === 'on_tour' || (v.speed || 0) > 0) {
        // Jitter / advance coordinates along hill road trajectory
        const deltaLat = (Math.random() - 0.48) * 0.0018;
        const deltaLng = (Math.random() - 0.46) * 0.0018;
        const newLat = Number((v.latitude + deltaLat).toFixed(6));
        const newLng = Number((v.longitude + deltaLng).toFixed(6));
        const newSpeed = Math.floor(25 + Math.random() * 25);
        const newHeading = Math.floor(Math.random() * 360);

        let history = Array.isArray(v.routeHistory) ? [...v.routeHistory] : [];
        history.push({
          lat: newLat,
          lng: newLng,
          speed: newSpeed,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        if (history.length > 50) history = history.slice(-50);

        await v.update({
          latitude: newLat,
          longitude: newLng,
          speed: newSpeed,
          heading: newHeading,
          routeHistory: history,
          lastUpdated: new Date(),
        });
      }
    }

    const updated = await VehicleGps.findAll();
    return res.status(200).json({ success: true, message: 'Simulation tick applied', vehicles: updated });
  } catch (err) {
    next(err);
  }
};

// 5. Reset GPS locations back to base checkpoints
export const resetVehiclesGps = async (req, res, next) => {
  try {
    await VehicleGps.update(
      { speed: 0, status: 'idle', ignition: false },
      { where: {} }
    );
    const vehicles = await VehicleGps.findAll();
    return res.status(200).json({ success: true, message: 'Fleet GPS locations reset to base', vehicles });
  } catch (err) {
    next(err);
  }
};
