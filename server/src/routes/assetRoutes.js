import express from 'express';
import {
  getAssets,
  getAssetStats,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  uploadAssetImage,
} from '../controllers/assetController.js';
import { protectAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes (used by client booking form to list vehicles and rental assets)
router.get('/', getAssets);

// Admin stats
router.get('/stats', protectAdmin, getAssetStats);

// Single item
router.get('/:id', getAssetById);

// Admin CRUD
router.post('/upload', protectAdmin, upload.single('image'), uploadAssetImage);
router.post('/', protectAdmin, createAsset);
router.put('/:id', protectAdmin, updateAsset);
router.delete('/:id', protectAdmin, deleteAsset);

export default router;
