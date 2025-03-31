/**
 * API constants
 * Centralized location for all API-related constants
 */

// Quote categories
export const QUOTE_CATEGORIES = {
  LITERARY: 'literary',
  WISDOM: 'wisdom',
  NATURE: 'nature', 
  INSPIRATION: 'inspiration'
};

// API error codes
export const API_ERROR_CODES = {
  INVALID_TOKEN: 'invalid_token',
  TOKEN_EXPIRED: 'token_expired',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
  SERVER_ERROR: 'server_error'
};

// HTTP status codes 
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

export default {
  QUOTE_CATEGORIES,
  API_ERROR_CODES,
  HTTP_STATUS
}; 