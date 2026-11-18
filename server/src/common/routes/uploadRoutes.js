import express from 'express';
import { upload, mediaUpload } from '../../middleware/upload.js';
import { protectAdmin } from '../../middleware/auth.js';
import { UploadController } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * Common Upload Routes
 * Single, multiple, and media file upload routes.
 */

// POST /api/common/upload or /api/upload - Single file (image/doc)
router.post(
  '/',
  upload.single('file'),
  UploadController.uploadSingle
);

// POST /api/common/upload/single
router.post(
  '/single',
  upload.single('file'),
  UploadController.uploadSingle
);

// POST /api/common/upload/multiple - Multiple files (up to 10)
router.post(
  '/multiple',
  upload.array('files', 10),
  UploadController.uploadMultiple
);

// POST /api/common/upload/media - Video or heavy media (up to 50MB)
router.post(
  '/media',
  mediaUpload.single('file'),
  UploadController.uploadMedia
);

export default router;
