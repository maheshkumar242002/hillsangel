import { UploadService } from '../../service/uploadService.js';
import { ApiResponse } from '../utils/apiResponse.js';

/**
 * Common Upload Controller
 * Provides standardized endpoints for single and multiple file/media uploads.
 */
export class UploadController {
  /**
   * Handle single file upload
   * @route POST /api/common/upload
   * @access Authenticated (or Public if permitted)
   */
  static async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'Please select a file to upload.');
      }

      const fileData = await UploadService.processFile(req.file, req);

      return ApiResponse.created(
        res,
        fileData,
        'File uploaded successfully.'
      );
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.send(res, error.statusCode, {
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Handle multiple files upload
   * @route POST /api/common/upload/multiple
   * @access Authenticated
   */
  static async uploadMultiple(req, res, next) {
    try {
      if (!req.files || !req.files.length) {
        return ApiResponse.badRequest(res, 'Please select at least one file to upload.');
      }

      const filesData = await UploadService.processMultipleFiles(req.files, req);

      return ApiResponse.created(
        res,
        {
          count: filesData.length,
          files: filesData,
          urls: filesData.map((f) => f.url),
        },
        `${filesData.length} files uploaded successfully.`
      );
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.send(res, error.statusCode, {
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Handle video / large media upload
   * @route POST /api/common/upload/media
   * @access Authenticated
   */
  static async uploadMedia(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'Please select a media file to upload.');
      }

      const mediaData = await UploadService.processFile(req.file, req);

      return ApiResponse.created(
        res,
        mediaData,
        'Media uploaded successfully.'
      );
    } catch (error) {
      if (error.statusCode) {
        return ApiResponse.send(res, error.statusCode, {
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }
}

export default UploadController;
