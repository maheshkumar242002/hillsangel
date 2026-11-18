import { BaseService } from './BaseService.js';
import gpsRepository from '../repository/gpsRepository.js';
import { GpsVehicleStatus } from '../enums/index.js';

export class GpsService extends BaseService {
  constructor() {
    super(gpsRepository);
  }

  /**
   * Get tracked vehicles with live summary statistics
   */
  async getTrackedVehiclesSummary() {
    const vehicles = await gpsRepository.findAllTrackedVehicles();

    const totalVehicles = vehicles.length;
    const onTourCount = vehicles.filter((v) => v.status === GpsVehicleStatus.ON_TOUR).length;
    const idleCount = vehicles.filter((v) => v.status === GpsVehicleStatus.IDLE).length;
    const stoppedCount = vehicles.filter((v) => v.status === GpsVehicleStatus.STOPPED).length;
    const movingCount = vehicles.filter((v) => (Number(v.speed) || 0) > 0).length;

    return {
      count: totalVehicles,
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
    };
  }

  /**
   * Get single vehicle by ID or registration number
   */
  async getVehicleById(identifier) {
    const vehicle = await gpsRepository.findByIdOrRegNumber(identifier);
    if (!vehicle) {
      const err = new Error('Vehicle not found in GPS fleet');
      err.statusCode = 404;
      throw err;
    }
    return vehicle;
  }

  /**
   * Process and update live GPS telemetry from device or admin
   */
  async updateTelemetry(payload) {
    const regNumber = payload.regNumber || payload.registrationNumber;
    const deviceId = payload.deviceId;
    const {
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      ignition,
      batteryLevel,
      currentLocationName,
      status,
      assignedTour,
      tripType,
      customerName,
      customerPhone,
      destination,
      planCustomizations,
    } = payload;

    let vehicle = await gpsRepository.findByRegOrDeviceId(regNumber, deviceId);

    if (!vehicle) {
      vehicle = await gpsRepository.create({
        vehicleName: payload.vehicleName || `Safari Vehicle (${regNumber || deviceId})`,
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
        status: status || GpsVehicleStatus.ON_TOUR,
      });
    } else {
      const lat = Number(latitude) !== undefined && !isNaN(Number(latitude)) ? Number(latitude) : vehicle.latitude;
      const lng = Number(longitude) !== undefined && !isNaN(Number(longitude)) ? Number(longitude) : vehicle.longitude;
      const curSpeed = speed !== undefined && !isNaN(Number(speed)) ? Number(speed) : vehicle.speed;

      let history = Array.isArray(vehicle.routeHistory) ? [...vehicle.routeHistory] : [];
      history.push({
        lat,
        lng,
        speed: curSpeed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
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
        assignedTour: assignedTour || vehicle.assignedTour,
        tripType: tripType || vehicle.tripType,
        customerName: customerName !== undefined ? customerName : vehicle.customerName,
        customerPhone: customerPhone !== undefined ? customerPhone : vehicle.customerPhone,
        destination: destination || vehicle.destination,
        planCustomizations: planCustomizations || vehicle.planCustomizations,
        status: status || (curSpeed > 0 ? GpsVehicleStatus.ON_TOUR : vehicle.status),
        routeHistory: history,
        lastUpdated: new Date(),
      });
    }

    return vehicle;
  }

  /**
   * Simulate a movement step for active vehicles (Demo / Showcase)
   */
  async simulateStep() {
    const vehicles = await gpsRepository.findAllTrackedVehicles();

    for (const v of vehicles) {
      if (v.status === GpsVehicleStatus.ON_TOUR || (Number(v.speed) || 0) > 0) {
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

    return gpsRepository.findAllTrackedVehicles();
  }

  /**
   * Reset all fleet GPS coordinates to base
   */
  async resetFleet() {
    return gpsRepository.resetFleetToBase();
  }
}

export default new GpsService();
