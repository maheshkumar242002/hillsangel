import express from 'express';
import {
  getPartners,
  getPartnerStats,
  calculateTripSettlement,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  saveTripSettlement,
  getTripSettlements,
  getCommissionStats,
  updatePartnerPayoutStatus,
  deleteTripSettlement,
  autoCalculateBookingProfit,
  autoSettleAllBookings,
  uploadPartnerImage,
} from '../controllers/partnerTieupController.js';
import { protectAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Partner image upload (cottages, resorts, restaurants, cafes)
router.post('/upload', protectAdmin, upload.single('image'), uploadPartnerImage);


// Public / client can query tie-ups if needed
router.get('/', getPartners);

// Admin stats
router.get('/stats', protectAdmin, getPartnerStats);

// Trip settlement estimator & auto-settlement
router.post('/calculate-settlement', protectAdmin, calculateTripSettlement);
router.post('/auto-calculate-booking', protectAdmin, autoCalculateBookingProfit);
router.post('/auto-settle-all', protectAdmin, autoSettleAllBookings);

// Settlement records & Commission tracking (MUST BE BEFORE /:id)
router.get('/commission-stats', protectAdmin, getCommissionStats);
router.get('/settlements', protectAdmin, getTripSettlements);
router.post('/settlements', protectAdmin, saveTripSettlement);
router.put('/settlements/:id/payout', protectAdmin, updatePartnerPayoutStatus);
router.delete('/settlements/:id', protectAdmin, deleteTripSettlement);

// Single partner
router.get('/:id', getPartnerById);

// Admin CRUD
router.post('/', protectAdmin, createPartner);
router.put('/:id', protectAdmin, updatePartner);
router.delete('/:id', protectAdmin, deletePartner);

export default router;
