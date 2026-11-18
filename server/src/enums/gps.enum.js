/**
 * GPS Tracking Enums
 */

export const GpsVehicleStatus = Object.freeze({
  ON_TOUR: 'on_tour',
  IDLE: 'idle',
  RETURNING: 'returning',
  STOPPED: 'stopped',
  MAINTENANCE: 'maintenance',
});

export const GpsTrackingMode = Object.freeze({
  LIVE: 'live',
  SIMULATION: 'simulation',
});

export default {
  GpsVehicleStatus,
  GpsTrackingMode,
};
