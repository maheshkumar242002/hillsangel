import VehicleGps from '../models/VehicleGps.js';

// Pre-defined initial safari fleet with GPS positions across Munnar safari trails, highways, and Office base
const defaultVehicles = [
  {
    vehicleName: 'Mahindra Commander 4x4 Safari (KL 68 C 3024)',
    regNumber: 'KL 68 C 3024',
    vehicleType: 'jeep',
    driverName: 'Murugan (Mountain Chauffeur)',
    driverPhone: '+91 98421 23456',
    status: 'on_tour',
    tripType: 'vehicle_rental_with_driver',
    customerName: 'Karthik Raja (Private Hire)',
    customerPhone: '+91 98412 77889',
    destination: 'Flexible / Directed by Customer (Open Route)',
    planCustomizations: 'Vehicle + Chauffeur Only (Food: Excluded)',
    latitude: 10.1982,
    longitude: 77.1685,
    speed: 36,
    heading: 68,
    altitude: 1680,
    ignition: true,
    batteryLevel: 94,
    currentLocationName: 'Near Luckam Waterfalls, Kanthaloor Highway Stretch',
    assignedTour: 'Vehicle Rental with Driver (Open Hill Route)',
    passengersCount: 5,
    deviceId: 'GPS-KL68C-3024',
    routeHistory: [
      { lat: 10.0889, lng: 77.0595, speed: 20, time: '09:00 AM' },
      { lat: 10.1150, lng: 77.0820, speed: 32, time: '09:30 AM' },
      { lat: 10.1540, lng: 77.1210, speed: 28, time: '10:15 AM' },
      { lat: 10.1982, lng: 77.1685, speed: 36, time: '11:00 AM' },
    ],
  },
  {
    vehicleName: 'Mahindra Thar 4x4 Off-Road (KL 68 D 1122)',
    regNumber: 'KL 68 D 1122',
    vehicleType: 'jeep',
    driverName: 'Senthil Kumar (Mountain Guide)',
    driverPhone: '+91 94432 87654',
    status: 'on_tour',
    tripType: 'vehicle_rental_with_driver',
    customerName: 'Suresh & Friends (Rental Only)',
    customerPhone: '+91 94433 11223',
    destination: 'Coimbatore - Valparai / Kundala (Custom Drop)',
    planCustomizations: 'Vehicle + Chauffeur + Campfire Add-on',
    latitude: 10.0824,
    longitude: 77.1245,
    speed: 42,
    heading: 135,
    altitude: 1720,
    ignition: true,
    batteryLevel: 88,
    currentLocationName: 'Mattupatty Dam & Echo Point Ridge',
    assignedTour: 'Vehicle Rental with Driver (Open Route)',
    passengersCount: 4,
    deviceId: 'GPS-KL68D-1122',
    routeHistory: [
      { lat: 10.0889, lng: 77.0595, speed: 25, time: '09:30 AM' },
      { lat: 10.0810, lng: 77.0950, speed: 38, time: '10:00 AM' },
      { lat: 10.0824, lng: 77.1245, speed: 42, time: '10:45 AM' },
    ],
  },
  {
    vehicleName: 'Force Gurkha 4x4 Extreme Rig (KL 68 E 4040)',
    regNumber: 'KL 68 E 4040',
    vehicleType: 'jeep',
    driverName: 'Anand Raj (Off-Road Specialist)',
    driverPhone: '+91 97865 43210',
    status: 'on_tour',
    tripType: 'tour_package',
    customerName: 'Deepak Sharma (Family Safari)',
    customerPhone: '+91 97865 99887',
    destination: 'Viriparai River Crossing & Tiger Cave',
    planCustomizations: 'Tour Package (Food: Included, Stay: Included)',
    latitude: 10.0430,
    longitude: 77.0210,
    speed: 24,
    heading: 210,
    altitude: 1410,
    ignition: true,
    batteryLevel: 91,
    currentLocationName: 'Viriparai River Crossing Off-Road Track',
    assignedTour: 'Viriparai 4x4 River Crossing Thrill (Package Tour)',
    passengersCount: 6,
    deviceId: 'GPS-KL68E-4040',
    routeHistory: [
      { lat: 10.0889, lng: 77.0595, speed: 30, time: '08:45 AM' },
      { lat: 10.0650, lng: 77.0390, speed: 28, time: '09:30 AM' },
      { lat: 10.0430, lng: 77.0210, speed: 24, time: '10:20 AM' },
    ],
  },
  {
    vehicleName: 'Mahindra Bolero Camper 4x4 (KL 68 F 5566)',
    regNumber: 'KL 68 F 5566',
    vehicleType: 'pickup',
    driverName: 'Karthik Raja',
    driverPhone: '+91 99441 55667',
    status: 'idle',
    tripType: 'depot_standby',
    customerName: 'None (Standby Fleet)',
    customerPhone: '',
    destination: 'Hills Angel Collection Depot, Perur',
    planCustomizations: 'Available for Instant Rental with Driver',
    latitude: 10.9820004,
    longitude: 76.9334183,
    speed: 0,
    heading: 0,
    altitude: 412,
    ignition: false,
    batteryLevel: 100,
    currentLocationName: 'Office & Vehicle Collection Point, Perur (Coimbatore Base)',
    assignedTour: 'Stationed at Collection Depot - Ready for Rental Dispatch',
    passengersCount: 0,
    deviceId: 'GPS-KL68F-5566',
    routeHistory: [
      { lat: 10.9820004, lng: 76.9334183, speed: 0, time: '08:00 AM' },
    ],
  },
];

// Helper: Ensure initial vehicles exist in database
async function ensureVehiclesExist() {
  const count = await VehicleGps.count();
  if (count === 0) {
    for (const v of defaultVehicles) {
      await VehicleGps.create(v);
    }
  }
}

// 1. Get all tracked vehicles + live fleet summary
export const getTrackedVehicles = async (req, res, next) => {
  try {
    await ensureVehiclesExist();

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
    const { regNumber, deviceId, latitude, longitude, speed, heading, altitude, ignition, batteryLevel, currentLocationName, status } = req.body;

    if (!regNumber && !deviceId) {
      return res.status(400).json({ success: false, message: 'Vehicle registration number or device ID is required' });
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
    await VehicleGps.destroy({ where: {} });
    for (const v of defaultVehicles) {
      await VehicleGps.create(v);
    }
    const vehicles = await VehicleGps.findAll();
    return res.status(200).json({ success: true, message: 'Fleet GPS locations reset to base', vehicles });
  } catch (err) {
    next(err);
  }
};
