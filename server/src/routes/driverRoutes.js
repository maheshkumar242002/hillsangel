import express from 'express';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  restoreDriver,
  uploadDriverPhoto,
} from '../controllers/driverController.js';
import { protectAdmin, optionalAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public / Authenticated route to get list of drivers (sensitive fields filtered for non-admins)
router.get('/', optionalAdmin, getDrivers);
router.get('/:id', optionalAdmin, getDriverById);

// Admin-protected CRUD, restore, and photo upload
router.post('/upload', protectAdmin, upload.single('photo'), uploadDriverPhoto);
router.post('/', protectAdmin, createDriver);
router.put('/:id', protectAdmin, updateDriver);
router.delete('/:id', protectAdmin, deleteDriver);
router.patch('/:id/restore', protectAdmin, restoreDriver);

export default router;
