import express from 'express';
import {
  getGalleryItems,
  uploadGalleryMedia,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '../controllers/galleryController.js';
import { protectAdmin } from '../middleware/auth.js';
import { mediaUpload } from '../middleware/upload.js';

const router = express.Router();

// Public
router.get('/', getGalleryItems);

// Admin Protected
router.post('/upload', protectAdmin, mediaUpload.single('file'), uploadGalleryMedia);
router.post('/', protectAdmin, createGalleryItem);
router.put('/:id', protectAdmin, updateGalleryItem);
router.delete('/:id', protectAdmin, deleteGalleryItem);

export default router;
