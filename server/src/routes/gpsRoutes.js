import express from 'express';
import {
  getTrackedVehicles,
  getVehicleById,
  updateVehicleGps,
  simulateGpsStep,
  resetVehiclesGps,
} from '../controllers/gpsController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all tracked vehicles (Protected for admin, or accessible by token)
router.get('/vehicles', protectAdmin, getTrackedVehicles);
router.get('/vehicles/:id', protectAdmin, getVehicleById);

// Update telemetry from IoT hardware or driver app
router.post('/update', updateVehicleGps);

// Simulation tick & reset (admin only)
router.post('/simulate-step', protectAdmin, simulateGpsStep);
router.post('/reset', protectAdmin, resetVehiclesGps);

export default router;
