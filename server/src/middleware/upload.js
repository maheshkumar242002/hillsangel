import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { cloudinary, isConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer disk storage for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `package-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|avif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (allowed.test(ext) && (mime.startsWith('image/') || allowed.test(mime))) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp, avif) are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per image
  fileFilter,
});

// Multer disk storage for general media uploads (photos and videos)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  },
});

const mediaFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|avif|mp4|webm|mov|mkv/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;
  if (allowed.test(ext) || mime.startsWith('image/') || mime.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only photos (jpeg, jpg, png, webp, avif) or videos (mp4, webm, mov, mkv) are allowed!'), false);
  }
};

export const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max for videos & photos
  fileFilter: mediaFilter,
});

/**
 * Upload helper that uploads to Cloudinary if configured, otherwise returns local file URL
 */
export async function processUploadedFile(file, req) {
  const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.originalname);
  if (isConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'hills-angels-media',
        resource_type: isVideo ? 'video' : 'image',
      });
      // Delete temporary local file
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        // ignore
      }
      return result.secure_url;
    } catch (err) {
      console.warn('[Cloudinary] Upload failed, falling back to local file:', err.message);
    }
  }

  // Fallback to local server URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${file.filename}`;
}
