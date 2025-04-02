import helmet from 'helmet';

/**
 * Security configuration for the application
 * 
 * This includes various security headers and middleware to protect against
 * common web vulnerabilities.
 */

// Configure security headers with Helmet
export const configureSecurityHeaders = () => {
  // Base helmet configuration
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 
          "https://authentic-internet-api-9739ffaa9c5f.herokuapp.com",
          "https://flourishing-starburst-8cf88b.netlify.app", 
          "https://*.dicebear.com", 
          "https://netlify.app",
          "localhost:*",
          "ws://localhost:*"
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false, // Allow embedding of external resources
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: true },
    // Frame-related headers
    frameguard: {
      action: 'sameorigin'
    },
    hsts: {
      maxAge: 31536000,        // Must be at least 1 year to be approved
      includeSubDomains: true, // Include subdomains
      preload: true            // Allow browsers to preload HSTS config
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  });
};

// Configure CORS options for the application
export const configureCorsOptions = (allowedOrigins) => {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check against allowed origins
      if (allowedOrigins.indexOf(origin) !== -1 || 
          allowedOrigins.some(pattern => new RegExp(pattern).test(origin))) {
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