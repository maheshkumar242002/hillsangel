/**
 * Partner Tie-up Enums
 */

export const PartnerCategory = Object.freeze({
  HOTEL_RESORT: 'hotel_resort',
  ACTIVITY_SIGHTSEEING: 'activity_sightseeing',
  RESTAURANT_DINING: 'restaurant_dining',
  TRANSPORT_CAB: 'transport_cab',
});

export const PartnerPricingModel = Object.freeze({
  FIXED: 'fixed',
  PER_PERSON: 'per_person',
  PER_NIGHT: 'per_night',
  COMMISSION_PERCENT: 'commission_percent',
});

export const FoodType = Object.freeze({
  ALL: 'all',
  VEG: 'veg',
  NON_VEG: 'non_veg',
  BUFFET: 'buffet',
});

export const PartnerStatus = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const SettlementStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
});

export const PayoutStatus = Object.freeze({
  PENDING: 'pending',
  PROCESSED: 'processed',
  COMPLETED: 'completed',
});

export default {
  PartnerCategory,
  PartnerPricingModel,
  FoodType,
  PartnerStatus,
  SettlementStatus,
  PayoutStatus,
};
