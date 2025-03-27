import mongoose from 'mongoose';
const { ValidationError } = mongoose;

/**
 * Standardized error response format for the API
 * This middleware will be applied globally to handle all errors in a consistent way
 */
const errorHandler = (err, req, res, next) => {
  // Default to internal server error
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';
  let errorDetails = null;
  let errorCode = err.code || 'server_error';
  
  console.error(`Error in ${req.method} ${req.path}:`, err);
  
  // Handle different types of errors
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    errorCode = 'validation_error';
    errorMessage = 'Validation failed';
    errorDetails = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID, etc.)
    statusCode = 400;
    errorCode = 'invalid_id';
    errorMessage = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    // MongoDB error (duplicate key, etc.)
    statusCode = 400;
    
    // Handle duplicate key error
    if (err.code === 11000) {
      errorCode = 'duplicate_key';
      errorMessage = 'A record with this information already exists';
      const field = Object.keys(err.keyValue)[0];
      errorDetails = { field, value: err.keyValue[field] };
    }
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    errorCode = 'invalid_token';
    errorMessage = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration error
    statusCode = 401;
    errorCode = 'token_expired';
    errorMessage = 'Authentication token has expired';
  } else if (err.name === 'MulterError') {
    // File upload errors
    statusCode = 400;
    errorCode = 'file_upload_error';
    
    switch(err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMessage = 'File is too large';
        break;
      case 'LIMIT_FILE_COUNT':
        errorMessage = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        errorMessage = `Unexpected field: ${err.field}`;
        break;
      default:
        errorMessage = 'File upload error';
    }
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // JSON parse error
    statusCode = 400;
    errorCode = 'invalid_json';
    errorMessage = 'Invalid JSON in request body';
  }

  // Set security headers to prevent leaking sensitive information
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Error structure follows JSON:API spec
  res.status(statusCode).json({
    error: {
      status: statusCode,
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  });
};

export default errorHandler; 