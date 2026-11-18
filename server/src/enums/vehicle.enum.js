/**
 * Vehicle Enums
 */

export const VehicleStatus = Object.freeze({
  AVAILABLE: 'available',
  ON_TOUR: 'on_tour',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
});

export const RentalType = Object.freeze({
  SELF_DRIVE: 'self_drive',
  DRIVER_ASSISTED: 'driver_assisted',
  TOUR: 'tour',
  BOTH: 'both',
});

export const FuelType = Object.freeze({
  DIESEL: 'diesel',
  PETROL: 'petrol',
  ELECTRIC: 'electric',
  CNG: 'cng',
});

export const TransmissionType = Object.freeze({
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
});

export default {
  VehicleStatus,
  RentalType,
  FuelType,
  TransmissionType,
};
