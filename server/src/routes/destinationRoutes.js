import express from 'express';
import {
  getDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
  toggleDestinationStatus,
  addSubLocation,
} from '../controllers/destinationController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (anyone / client can browse destinations)
router.get('/', getDestinations);
router.get('/:id', getDestinationById);

// Admin protected routes
router.post('/', protectAdmin, createDestination);
router.put('/:id', protectAdmin, updateDestination);
router.delete('/:id', protectAdmin, deleteDestination);
router.patch('/:id/status', protectAdmin, toggleDestinationStatus);
router.post('/:id/sub-locations', protectAdmin, addSubLocation);

export default router;
