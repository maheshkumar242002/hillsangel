/**
 * Asset & Expense Enums
 */

export const AssetCategory = Object.freeze({
  VEHICLE: 'vehicle',
  CAMPING: 'camping',
  TREKKING: 'trekking',
  ELECTRONICS: 'electronics',
  AMENITY: 'amenity',
  OTHER: 'other',
});

export const AssetStatus = Object.freeze({
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  RETIRED: 'retired',
});

export const RentUnit = Object.freeze({
  PER_TRIP: 'per trip',
  PER_DAY: 'per day',
  PER_PERSON: 'per person',
});

export const ExpenseCategory = Object.freeze({
  FUEL: 'fuel',
  SERVICE_MAINTENANCE: 'service_maintenance',
  REPAIR_PARTS: 'repair_parts',
  INSURANCE: 'insurance',
  FC_PERMIT: 'fc_permit',
  TYRES: 'tyres',
  WASHING_CLEANING: 'washing_cleaning',
  TOLL_FASTAG: 'toll_fastag',
  GEAR_EQUIPMENT: 'gear_equipment',
  OTHER: 'other',
});

export const ExpenseEntityType = Object.freeze({
  VEHICLE: 'vehicle',
  ASSET: 'asset',
  GENERAL: 'general',
});

export const PaymentMode = Object.freeze({
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  CREDIT: 'credit',
});

export default {
  AssetCategory,
  AssetStatus,
  RentUnit,
  ExpenseCategory,
  ExpenseEntityType,
  PaymentMode,
};
