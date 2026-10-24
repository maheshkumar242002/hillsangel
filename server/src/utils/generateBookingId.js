import { Op } from 'sequelize';
import Booking from '../models/Booking.js';

/**
 * Generates a human-readable booking ID in format HAT-YYYY-XXXX (e.g. HAT-2026-0001)
 */
export async function generateBookingId() {
  const currentYear = new Date().getFullYear();
  const prefix = `HAT-${currentYear}-`;

  // Find the most recent booking for this year
  const latestBooking = await Booking.findOne({
    where: {
      bookingId: { [Op.like]: `${prefix}%` },
    },
    order: [['id', 'DESC']],
    attributes: ['bookingId'],
  });

  let nextSequence = 1;
  if (latestBooking && latestBooking.bookingId) {
    const parts = latestBooking.bookingId.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  // Fallback check in case of concurrent bookings
  let candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
  let exists = await Booking.findOne({ where: { bookingId: candidate } });
  while (exists) {
    nextSequence += 1;
    candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    exists = await Booking.findOne({ where: { bookingId: candidate } });
  }

  return candidate;
}
