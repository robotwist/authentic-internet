/**
 * Error classes for Authentic Internet API
 * These extend the native Error class to provide additional information.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'server_error', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Used for validation errors
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'validation_error', details);
  }
}

/**
 * 401 Unauthorized - Authentication issues
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 401, 'authentication_error', details);
  }
}

/**
 * 403 Forbidden - Permission issues
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Permission denied', details = null) {
    super(message, 403, 'authorization_error', details);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'not_found', details);
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, 'conflict', details);
  }
}

/**
 * 429 Too Many Requests - Rate limiting
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details = null) {
    super(message, 429, 'rate_limit', details);
  }
}

/**
 * 500 Internal Server Error - Database errors
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database error', details = null) {
    super(message, 500, 'database_error', details);
  }
}

/**
 * External Service Error - For third-party API issues
 */
export class ExternalServiceError extends AppError {
  constructor(message = 'External service error', details = null) {
    super(message, 502, 'external_service_error', details);
  }
} 