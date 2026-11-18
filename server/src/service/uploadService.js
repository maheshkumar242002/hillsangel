import fs from 'fs';
import path from 'path';
import { cloudinary, isConfigured } from '../config/cloudinary.js';
import { validateFileMagicBytes } from '../middleware/upload.js';

/**
 * UploadService
 * Encapsulates all business logic for handling file uploads,
 * binary signature verification, Cloudinary synchronization, and local storage.
 */
export class UploadService {
  /**
   * Process a single uploaded file
   * @param {Express.Multer.File} file
   * @param {import('express').Request} req
   * @returns {Promise<{ url: string, filename: string, originalname: string, size: number, mimetype: string, storage: 'cloudinary' | 'local' }>}
   */
  static async processFile(file, req) {
    if (!file) {
      const err = new Error('No file provided for upload.');
      err.statusCode = 400;
      throw err;
    }

    // Binary signature verification (prevent polyglot and malicious disguised scripts)
    const isValidSignature = validateFileMagicBytes(file.path);
    if (!isValidSignature) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (e) {}
      const securityErr = new Error('Security Error: Uploaded file failed binary signature verification.');
      securityErr.statusCode = 400;
      throw securityErr;
    }

    const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.originalname);

    // If Cloudinary is configured, upload to CDN and clean local temp file
    if (isConfigured) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'hills-angels-media',
          resource_type: isVideo ? 'video' : 'image',
        });

        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (e) {}

        return {
          url: result.secure_url,
          filename: path.basename(result.secure_url),
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          storage: 'cloudinary',
          publicId: result.public_id,
        };
      } catch (cdnErr) {
        console.warn('[UploadService] Cloudinary upload failed, falling back to local file:', cdnErr.message);
      }
    }

    // Local file fallback
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const localUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      url: localUrl,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      storage: 'local',
      publicId: null,
    };
  }

  /**
   * Process multiple uploaded files in parallel
   * @param {Express.Multer.File[]} files
   * @param {import('express').Request} req
   */
  static async processMultipleFiles(files, req) {
    if (!files || !files.length) {
      const err = new Error('No files provided for upload.');
      err.statusCode = 400;
      throw err;
    }

    const results = await Promise.all(
      files.map((file) => this.processFile(file, req))
    );

    return results;
  }
}

export default UploadService;
