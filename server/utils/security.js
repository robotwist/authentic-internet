/**
 * Security configuration for the application
 * 
 * This includes various security headers and middleware to protect against
 * common web vulnerabilities.
 */

// Configure security headers
export const configureSecurityHeaders = () => {
  return (req, res, next) => {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "connect-src 'self' https://authentic-internet-api-9739ffaa9c5f.herokuapp.com https://flourishing-starburst-8cf88b.netlify.app https://*.dicebear.com https://netlify.app localhost:* ws://localhost:*; " +
      "img-src 'self' data: https: blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "object-src 'none';"
    );

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent iframe embedding (clickjacking protection)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Enable browser XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Cross-Origin Resource Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Cross-Origin Opener Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

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
    
    // Remove X-Powered-By header to avoid exposing server info
    res.removeHeader('X-Powered-By');

    next();
  };
};

// Configure CORS options for the application
export const configureCorsOptions = (allowedOrigins) => {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check against allowed origins (strings or RegExp patterns)
      if (allowedOrigins.indexOf(origin) !== -1 ||
          allowedOrigins.some(pattern =>
            pattern instanceof RegExp ? pattern.test(origin) : false,
          )) {
        return callback(null, true);
      }
      
      // Log blocked origins for monitoring
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false
  };
};

// Middleware to enforce HTTPS in production
export const enforceHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    // Redirect to HTTPS
    return res.redirect('https://' + req.get('host') + req.url);
  }
  next();
}; 