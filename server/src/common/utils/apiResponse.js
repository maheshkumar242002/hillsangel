import { HTTP_STATUS, getStatusBasemap } from '../constants/httpStatus.js';

/**
 * Standard ApiResponse Builder
 * Formats API responses consistently with status code numbers, metadata, messages, and payloads.
 */
export class ApiResponse {
  /**
   * Send a formatted JSON response
   * @param {import('express').Response} res
   * @param {number} statusCode
   * @param {object} payload
   */
  static send(res, statusCode, { success, message, data = null, meta = null, errors = null }) {
    const statusMeta = getStatusBasemap(statusCode);
    const isSuccess = success !== undefined ? success : statusMeta.isSuccess;
    const resolvedMessage = message || statusMeta.defaultMessage;

    const isPlainObject = (val) => val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date);

    const responseBody = {
      success: isSuccess,
      statusCode,
      message: resolvedMessage,
      ...(isPlainObject(meta) ? meta : {}),
      ...(isPlainObject(data) ? data : {}),
      ...(data !== null && data !== undefined && { data }),
      ...(meta !== null && meta !== undefined && { meta }),
      ...(errors !== null && errors !== undefined && { errors }),
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(responseBody);
  }

  /**
   * 200 OK
   */
  static success(res, data = null, message = 'Operation completed successfully.', meta = null) {
    return this.send(res, HTTP_STATUS.OK, {
      success: true,
      message,
      data,
      meta,
    });
  }

  /**
   * 201 Created
   */
  static created(res, data = null, message = 'Resource created successfully.', meta = null) {
    return this.send(res, HTTP_STATUS.CREATED, {
      success: true,
      message,
      data,
      meta,
    });
  }

  /**
   * 202 Accepted
   */
  static accepted(res, data = null, message = 'Request accepted for processing.') {
    return this.send(res, HTTP_STATUS.ACCEPTED, {
      success: true,
      message,
      data,
    });
  }

  /**
   * 204 No Content
   */
  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  /**
   * 400 Bad Request
   */
  static badRequest(res, message = 'Invalid request parameters.', errors = null) {
    return this.send(res, HTTP_STATUS.BAD_REQUEST, {
      success: false,
      message,
      errors,
    });
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(res, message = 'Authentication required or invalid credentials.') {
    return this.send(res, HTTP_STATUS.UNAUTHORIZED, {
      success: false,
      message,
    });
  }

  /**
   * 403 Forbidden
   */
  static forbidden(res, message = 'Access denied. You do not have permission.') {
    return this.send(res, HTTP_STATUS.FORBIDDEN, {
      success: false,
      message,
    });
  }

  /**
   * 404 Not Found
   */
  static notFound(res, message = 'The requested resource was not found.') {
    return this.send(res, HTTP_STATUS.NOT_FOUND, {
      success: false,
      message,
    });
  }

  /**
   * 409 Conflict
   */
  static conflict(res, message = 'A conflict occurred. Record already exists or is locked.') {
    return this.send(res, HTTP_STATUS.CONFLICT, {
      success: false,
      message,
    });
  }

  /**
   * 422 Unprocessable Entity
   */
  static unprocessableEntity(res, errors = null, message = 'Validation failed.') {
    return this.send(res, HTTP_STATUS.UNPROCESSABLE_ENTITY, {
      success: false,
      message,
      errors,
    });
  }

  /**
   * 500 Internal Server Error
   */
  static serverError(res, message = 'An unexpected server error occurred.', error = null) {
    const errorDetails =
      process.env.NODE_ENV !== 'production' && error
        ? { errorName: error.name, details: error.message }
        : null;

    return this.send(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      success: false,
      message,
      errors: errorDetails,
    });
  }
}

export default ApiResponse;
