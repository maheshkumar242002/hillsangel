import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { cloudinary, isConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

const ALLOWED_VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv']);
const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
]);

// Multer disk storage with sanitized cryptographically random filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `img-${Date.now()}-${randomHex}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (ALLOWED_IMAGE_EXT.has(ext) && ALLOWED_IMAGE_MIME.has(mime)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only genuine raster images (JPG, JPEG, PNG, WEBP, AVIF) are allowed. HTML, SVG, and script files are rejected.'
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max per image
  fileFilter,
});

// Media storage for gallery (photos and videos)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const randomHex = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${Date.now()}-${randomHex}${ext}`);
  },
});

const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isImage = ALLOWED_IMAGE_EXT.has(ext) && ALLOWED_IMAGE_MIME.has(mime);
  const isVideo = ALLOWED_VIDEO_EXT.has(ext) && (ALLOWED_VIDEO_MIME.has(mime) || mime.startsWith('video/'));

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid media file. Only standard photos (JPG, PNG, WEBP, AVIF) and videos (MP4, WEBM, MOV, MKV) are allowed.'
      ),
      false
    );
  }
};

export const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: mediaFilter,
});

/**
 * Validates file magic bytes to verify real content matches declared extension
 */
export function validateFileMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(32);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 32, 0);
    fs.closeSync(fd);

    // Reject HTML / XML / SVG / script signatures
    const startStr = buffer.toString('utf8', 0, 32).toLowerCase();
    if (
      startStr.includes('<html') ||
      startStr.includes('<?xml') ||
      startStr.includes('<svg') ||
      startStr.includes('<!doctype') ||
      startStr.includes('<script') ||
      startStr.includes('<?php')
    ) {
      return false;
    }

    // Check known headers
    const hex = buffer.toString('hex').toLowerCase();
    const isJpeg = hex.startsWith('ffd8ff');
    const isPng = hex.startsWith('89504e470d0a1a0a');
    const isWebp = hex.startsWith('52494646') && buffer.toString('utf8', 8, 12) === 'WEBP';
    const isEbml = hex.startsWith('1a45dfa3'); // WebM / MKV
    const isFtyp = hex.includes('66747970'); // MP4 / QuickTime

    return isJpeg || isPng || isWebp || isEbml || isFtyp;
  } catch (err) {
    return false;
  }
}

/**
 * Upload helper that verifies file integrity, uploads to Cloudinary if configured, otherwise returns local file URL
 */
export async function processUploadedFile(file, req) {
  // Validate magic bytes on disk
  const isValid = validateFileMagicBytes(file.path);
  if (!isValid) {
    try {
      fs.unlinkSync(file.path);
    } catch (e) {}
    const securityErr = new Error('Security Error: Uploaded file failed binary signature verification.');
    securityErr.statusCode = 400;
    throw securityErr;
  }

  const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.originalname);
  if (isConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'hills-angels-media',
        resource_type: isVideo ? 'video' : 'image',
      });
      try {
        fs.unlinkSync(file.path);
      } catch (e) {}
      return result.secure_url;
    } catch (err) {
      console.warn('[Cloudinary] Upload failed, falling back to local file:', err.message);
    }
  }

  // Fallback to local server URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${file.filename}`;
}
