import express from 'express';
import {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  getEnquiryWhatsAppLink,
} from '../controllers/enquiryController.js';
import { protectAdmin } from '../middleware/auth.js';
import { enquiryLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public enquiry submission with rate limiter
router.post('/', enquiryLimiter, createEnquiry);

// Admin protected routes
router.get('/', protectAdmin, getEnquiries);
router.patch('/:id/status', protectAdmin, updateEnquiryStatus);
router.delete('/:id', protectAdmin, deleteEnquiry);
router.get('/:id/whatsapp-link', protectAdmin, getEnquiryWhatsAppLink);

export default router;
