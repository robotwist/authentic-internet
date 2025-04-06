import csrf from 'csurf';

/**
 * Configure CSRF protection middleware
 * This protects against Cross-Site Request Forgery attacks
 * It requires a csrf token to be included in non-GET, non-HEAD, non-OPTIONS requests
 */
export const csrfProtection = csrf({
  cookie: {
    key: '_csrf-token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
});

/**
 * Middleware to handle CSRF errors gracefully
 */
export const handleCsrfError = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  // Handle CSRF token errors
  console.error('CSRF token validation failed:', req.method, req.path);
  
  return res.status(403).json({
    success: false,
    error: 'CSRF validation failed',
    message: 'Invalid or missing CSRF token. This could be due to an expired form or malicious activity.',
    code: 'CSRF_ERROR'
  });
};

/**
 * Middleware to provide CSRF token to client
 */
export const provideCsrfToken = (req, res, next) => {
  // Add CSRF token to response for client usage
  res.locals.csrfToken = req.csrfToken();
  next();
};

/**
 * Endpoint to get a new CSRF token
 */
export const getCsrfToken = (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
}; 