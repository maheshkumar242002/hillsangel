/**
 * HTTP Status Codes and Response Basemap
 * Standardized status codes and comprehensive metadata lookup for API responses.
 */

export const HTTP_STATUS = Object.freeze({
  // 1xx Informational
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,

  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,

  // 3xx Redirection
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  IM_A_TEAPOT: 418,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
});

/**
 * RESPONSE_BASEMAP: Complete metadata map for every HTTP status code number.
 * Provides code, standard phrase, human-readable description, category, and success flag.
 */
export const RESPONSE_BASEMAP = Object.freeze({
  200: {
    code: 200,
    phrase: 'OK',
    defaultMessage: 'Request completed successfully.',
    category: 'SUCCESS',
    isSuccess: true,
  },
  201: {
    code: 201,
    phrase: 'Created',
    defaultMessage: 'Resource created successfully.',
    category: 'SUCCESS',
    isSuccess: true,
  },
  202: {
    code: 202,
    phrase: 'Accepted',
    defaultMessage: 'Request accepted for processing.',
    category: 'SUCCESS',
    isSuccess: true,
  },
  204: {
    code: 204,
    phrase: 'No Content',
    defaultMessage: 'Operation succeeded with no content returned.',
    category: 'SUCCESS',
    isSuccess: true,
  },
  301: {
    code: 301,
    phrase: 'Moved Permanently',
    defaultMessage: 'The requested resource has been assigned a new permanent URI.',
    category: 'REDIRECTION',
    isSuccess: false,
  },
  304: {
    code: 304,
    phrase: 'Not Modified',
    defaultMessage: 'Resource has not been modified since last request.',
    category: 'REDIRECTION',
    isSuccess: true,
  },
  400: {
    code: 400,
    phrase: 'Bad Request',
    defaultMessage: 'The request could not be understood or was missing required parameters.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  401: {
    code: 401,
    phrase: 'Unauthorized',
    defaultMessage: 'Authentication is required and has failed or has not yet been provided.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  403: {
    code: 403,
    phrase: 'Forbidden',
    defaultMessage: 'You do not have permission to access this resource.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  404: {
    code: 404,
    phrase: 'Not Found',
    defaultMessage: 'The requested resource could not be found on this server.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  405: {
    code: 405,
    phrase: 'Method Not Allowed',
    defaultMessage: 'The HTTP method used is not supported for this route.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  409: {
    code: 409,
    phrase: 'Conflict',
    defaultMessage: 'The request conflicts with the current state of the server or a duplicate record exists.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  413: {
    code: 413,
    phrase: 'Payload Too Large',
    defaultMessage: 'The uploaded file or request body exceeds the maximum permitted size.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  415: {
    code: 415,
    phrase: 'Unsupported Media Type',
    defaultMessage: 'The file type or format is not supported.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  422: {
    code: 422,
    phrase: 'Unprocessable Entity',
    defaultMessage: 'Request validation failed on one or more fields.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  429: {
    code: 429,
    phrase: 'Too Many Requests',
    defaultMessage: 'Rate limit exceeded. Please wait before submitting additional requests.',
    category: 'CLIENT_ERROR',
    isSuccess: false,
  },
  500: {
    code: 500,
    phrase: 'Internal Server Error',
    defaultMessage: 'An unexpected internal server error occurred while processing the request.',
    category: 'SERVER_ERROR',
    isSuccess: false,
  },
  501: {
    code: 501,
    phrase: 'Not Implemented',
    defaultMessage: 'The requested action or functionality is not implemented.',
    category: 'SERVER_ERROR',
    isSuccess: false,
  },
  502: {
    code: 502,
    phrase: 'Bad Gateway',
    defaultMessage: 'The server received an invalid response from an upstream server.',
    category: 'SERVER_ERROR',
    isSuccess: false,
  },
  503: {
    code: 503,
    phrase: 'Service Unavailable',
    defaultMessage: 'The server is currently unable to handle the request due to maintenance or overload.',
    category: 'SERVER_ERROR',
    isSuccess: false,
  },
  504: {
    code: 504,
    phrase: 'Gateway Timeout',
    defaultMessage: 'The upstream server did not respond within the expected time limit.',
    category: 'SERVER_ERROR',
    isSuccess: false,
  },
});

/**
 * Get detailed metadata for any HTTP status code number
 * @param {number} code
 * @returns {object} Basemap info for the status code
 */
export function getStatusBasemap(code) {
  const numericCode = parseInt(code, 10);
  if (RESPONSE_BASEMAP[numericCode]) {
    return RESPONSE_BASEMAP[numericCode];
  }

  // Fallback for codes not explicitly listed
  const isSuccess = numericCode >= 200 && numericCode < 300;
  const category =
    numericCode >= 500
      ? 'SERVER_ERROR'
      : numericCode >= 400
      ? 'CLIENT_ERROR'
      : numericCode >= 300
      ? 'REDIRECTION'
      : numericCode >= 200
      ? 'SUCCESS'
      : 'INFORMATIONAL';

  return {
    code: numericCode,
    phrase: isSuccess ? 'Success' : 'Error',
    defaultMessage: isSuccess ? 'Operation succeeded.' : 'Operation failed.',
    category,
    isSuccess,
  };
}

export default HTTP_STATUS;
