import express from 'express';
import {
  getPackages,
  getPackageBySlug,
  getFeaturedPackages,
  getDestinations,
  createPackage,
  updatePackage,
  deletePackage,
  togglePackageStatus,
  uploadPackageImages,
} from '../controllers/packageController.js';
import { protectAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getPackages);
router.get('/featured', getFeaturedPackages);
router.get('/destinations', getDestinations);
router.get('/:slug', getPackageBySlug);

// Admin protected routes
router.post('/', protectAdmin, createPackage);
router.put('/:id', protectAdmin, updatePackage);
router.delete('/:id', protectAdmin, deletePackage);
router.patch('/:id/status', protectAdmin, togglePackageStatus);
router.post('/upload', protectAdmin, upload.array('images', 8), uploadPackageImages);

export default router;
