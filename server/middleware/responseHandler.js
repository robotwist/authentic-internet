/**
 * Utility functions to standardize API responses across the application
 * This follows a similar structure to our error responses to keep the API consistent
 */

/**
 * Response formatter utility for route handlers
 * Adds standard metadata to responses
 */
export const formatResponse = (data, options = {}) => {
  const {
    status = 200,
    message = null,
    timestamp = new Date().toISOString(),
    page = null,
    limit = null,
    total = null
  } = options;
  
  // Base response structure
  const response = {
    status,
    timestamp,
    data
  };
  
  // Add optional message
  if (message) {
    response.message = message;
  }
  
  // Add pagination metadata if provided
  if (page !== null && limit !== null) {
    response.meta = {
      ...response.meta,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total !== null ? parseInt(total) : null
      }
    };
  }
  
  return response;
};

/**
 * Express middleware to add response utility methods to res object
 * This allows controllers to use res.success(), res.created(), etc.
 */
export const responseEnhancer = (req, res, next) => {
  // Send a success response (200 OK)
  res.success = (data, message = null) => {
    return res.status(200).json(formatResponse(data, { message }));
  };
  
  // Send a created response (201 Created)
  res.created = (data, message = 'Resource created successfully') => {
    return res.status(201).json(formatResponse(data, { status: 201, message }));
  };
  
  // Send a no content response (204 No Content)
  res.noContent = () => {
    return res.status(204).end();
  };
  
  // Send a paginated response
  res.paginated = (data, page, limit, total, message = null) => {
    return res.status(200).json(formatResponse(data, { 
      message, 
      page, 
      limit, 
      total 
    }));
  };
  
  next();
};

export default responseEnhancer; 