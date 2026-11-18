/**
 * Booking Enums
 */

export const BookingStatus = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const PaymentStatus = Object.freeze({
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
});

export const BookingType = Object.freeze({
  TOUR_PACKAGE: 'tour_package',
  CUSTOM_TRIP: 'custom_trip',
  VEHICLE_RENTAL: 'vehicle_rental',
});

export default {
  BookingStatus,
  PaymentStatus,
  BookingType,
};
