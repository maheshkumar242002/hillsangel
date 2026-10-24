import express from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  startTripInspection,
  endTripInspection,
} from '../controllers/vehicleController.js';
import { protectAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes for booking form & fleet viewing
router.get('/', getVehicles);
router.get('/:id', getVehicleById);

// Admin routes for Vehicle Master & Fleet management
router.post('/upload', protectAdmin, upload.array('images', 8), uploadVehicleImages);
router.post('/', protectAdmin, createVehicle);
router.put('/:id', protectAdmin, updateVehicle);
router.delete('/:id', protectAdmin, deleteVehicle);

// Trip Inspection & Vehicle Condition Checklist (Start & End Trip)
router.post('/:id/start-trip', protectAdmin, startTripInspection);
router.post('/:id/end-trip', protectAdmin, endTripInspection);

export default router;
