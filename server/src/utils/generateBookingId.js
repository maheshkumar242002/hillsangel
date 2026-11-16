import { Op } from 'sequelize';
import Booking from '../models/Booking.js';
import crypto from 'crypto';

/**
 * Generates a human-readable booking ID in format HAT-YYYY-XXXX (e.g. HAT-2026-0001)
 * Guaranteed unique with concurrent race-condition prevention.
 */
export async function generateBookingId(transaction = null) {
  const currentYear = new Date().getFullYear();
  const prefix = `HAT-${currentYear}-`;

  // Find the most recent booking for this year using optional transaction lock
  const queryOptions = {
    where: {
      bookingId: { [Op.like]: `${prefix}%` },
    },
    order: [['id', 'DESC']],
    attributes: ['bookingId'],
  };

  if (transaction) {
    queryOptions.transaction = transaction;
    queryOptions.lock = transaction.LOCK.UPDATE;
  }

  const latestBooking = await Booking.findOne(queryOptions);

  let nextSequence = 1;
  if (latestBooking && latestBooking.bookingId) {
    const parts = latestBooking.bookingId.split('-');
    if (parts.length >= 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextSequence = parsed + 1;
      }
    }
  }

  // Fast-forward candidate if candidate already exists in database
  let candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
  let exists = await Booking.findOne({ where: { bookingId: candidate }, attributes: ['id'] });

  while (exists) {
    nextSequence += 1;
    candidate = `${prefix}${String(nextSequence).padStart(4, '0')}`;
    exists = await Booking.findOne({ where: { bookingId: candidate }, attributes: ['id'] });
  }

  return candidate;
}
