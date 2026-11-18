/**
 * Driver Enums
 */

export const DriverStatus = Object.freeze({
  AVAILABLE: 'available',
  ON_TOUR: 'on_tour',
  ON_LEAVE: 'on_leave',
  BUSY: 'busy',
  INACTIVE: 'inactive',
});

export const BloodGroup = Object.freeze({
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
});

export const DriverSpecialization = Object.freeze({
  SAFARI_PILOT: 'High-Altitude 4x4 Mountain Safari Pilot',
  HIGHWAY_CRUISER: 'Highway Cruiser Specialist',
  LOCAL_GUIDE: 'Local Ghat Specialist & Eco Guide',
});

export default {
  DriverStatus,
  BloodGroup,
  DriverSpecialization,
};
