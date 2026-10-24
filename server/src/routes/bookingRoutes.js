import express from 'express';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  sendCustomerWhatsApp,
  exportBookingsCsv,
} from '../controllers/bookingController.js';
import { protectAdmin } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public booking submission with rate limiter
router.post('/', bookingLimiter, createBooking);

// Admin protected routes
router.get('/export/csv', protectAdmin, exportBookingsCsv);
router.get('/', protectAdmin, getBookings);
router.get('/:id', protectAdmin, getBookingById);
router.patch('/:id/status', protectAdmin, updateBookingStatus);
router.delete('/:id', protectAdmin, deleteBooking);
router.post('/:id/send-whatsapp', protectAdmin, sendCustomerWhatsApp);

export default router;
