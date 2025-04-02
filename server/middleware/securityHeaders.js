/**
 * Security Headers Middleware
 * 
 * This middleware applies best practice security headers to all responses
 * to protect against common web vulnerabilities like XSS, clickjacking,
 * content sniffing, etc.
 */

/**
 * Apply security headers middleware
 * @returns {Function} Express middleware function
 */
export const applySecurityHeaders = () => {
  return (req, res, next) => {
    // Content Security Policy (CSP)
    // Restricts what resources can be loaded
    const cspDirectives = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Consider removing unsafe-inline and unsafe-eval in production
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'", 
        "https://authentic-internet-api-9739ffaa9c5f.herokuapp.com",
        "https://flourishing-starburst-8cf88b.netlify.app", 
        "https://*.dicebear.com", 
        "https://netlify.app",
        "localhost:*",
        "ws://localhost:*"
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
      formAction: ["'self'"],
      baseUri: ["'self'"]
    };

    // Set Content-Security-Policy header
    res.setHeader(
      'Content-Security-Policy',
      Object.entries(cspDirectives)
        .map(([key, value]) => `${key} ${value.join(' ')}`)
        .join('; ')
    );

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent iframe embedding (clickjacking protection)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Enable browser XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Set HTTP Strict Transport Security (HSTS)
    // Only in production to avoid HTTPS issues in development
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (formerly Feature Policy)
    // Limits which browser features the app can use
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Remove X-Powered-By header to avoid exposing server info
    res.removeHeader('X-Powered-By');

    next();
  };
};

export default applySecurityHeaders; 