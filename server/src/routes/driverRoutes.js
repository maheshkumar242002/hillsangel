import express from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  uploadDriverPhoto,
} from '../controllers/driverController.js';
import { protectAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public / Authenticated route to get list of drivers
router.get('/', getDrivers);
router.get('/:id', getDriverById);

// Admin-protected CRUD & photo upload
router.post('/upload', protectAdmin, upload.single('photo'), uploadDriverPhoto);
router.post('/', protectAdmin, createDriver);
router.put('/:id', protectAdmin, updateDriver);
router.delete('/:id', protectAdmin, deleteDriver);

export default router;
