import rateLimit from 'express-rate-limit';

/**
 * Rate limiting configuration for different parts of the API
 * 
 * This helps protect against brute force attacks, DoS attacks, and other forms of abuse
 * by limiting how many requests a client can make in a certain time period.
 */

// General API rate limiter - applies to all routes unless overridden
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },
  // Skip rate limiting for health check endpoints
  skip: (req) => {
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Health check endpoints specific limiter with higher limits
export const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (1 per second)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many health check requests, please try again later.'
  }
});

// Game state read operations - more lenient for authenticated users
export const gameStateReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    // More lenient limits for authenticated users
    return req.user ? 120 : 30; // 120 reads/min for authenticated, 30 for unauthenticated
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many game state read requests, please try again later.'
  },
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Game state write operations - stricter to prevent abuse
export const gameStateWriteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    // Different limits for authenticated vs unauthenticated users
    return req.user ? 60 : 10; // 60 writes/min for authenticated, 10 for unauthenticated
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many game state save requests, please try again later.'
  },
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Artifact progress operations - moderate limits
export const artifactProgressLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    return req.user ? 90 : 20; // 90 operations/min for authenticated, 20 for unauthenticated
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many artifact progress requests, please try again later.'
  },
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});

/**
 * Rate limiting utilities to prevent brute force attacks
 */

// In-memory store for failed login attempts
// In production, this should use Redis or another persistent store
const failedAttempts = new Map();

// Configuration
const MAX_FAILED_ATTEMPTS = 5;  // Max number of failed attempts before lockout
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes lockout in milliseconds
const ATTEMPT_RESET_DURATION = 60 * 60 * 1000; // Reset attempts after 1 hour

/**
 * Record a failed login attempt for an IP address
 * @param {string} ip - The IP address making the attempt
 * @returns {number} - The current number of failed attempts
 */
export const recordFailedLoginAttempt = (ip) => {
  const now = Date.now();
  const record = failedAttempts.get(ip) || {
    count: 0,
    firstAttempt: now,
    lastAttempt: now,
    lockoutUntil: null
  };
  
  // Update the record
  record.count += 1;
  record.lastAttempt = now;
  
  // Set lockout if attempts exceed threshold
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_DURATION;
    console.log(`IP ${ip} locked out until ${new Date(record.lockoutUntil).toISOString()}`);
  }
  
  failedAttempts.set(ip, record);
  return record.count;
};

/**
 * Check if an IP address should be locked out
 * @param {string} ip - The IP address to check
 * @returns {boolean} - True if the IP should be locked out
 */
export const shouldLockout = (ip) => {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  
  const now = Date.now();
  
  // Check if lockout period has passed
  if (record.lockoutUntil && now < record.lockoutUntil) {
    return true;
  }
  
  // If lockout period has passed, reset the lockout
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    record.lockoutUntil = null;
    record.count = 0;
    failedAttempts.set(ip, record);
    return false;
  }
  
  // Check if attempts should be reset due to time elapsed
  if (now - record.firstAttempt > ATTEMPT_RESET_DURATION) {
    record.count = 0;
    record.firstAttempt = now;
    failedAttempts.set(ip, record);
  }
  
  return false;
};

/**
 * Reset failed login attempts for an IP address (on successful login)
 * @param {string} ip - The IP address to reset
 */
export const resetFailedLoginAttempts = (ip) => {
  failedAttempts.delete(ip);
};

/**
 * Express middleware for rate limiting authentication endpoints
 */
export const authLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Skip rate limiting completely in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (shouldLockout(ip)) {
    console.log(`Request blocked: IP ${ip} is temporarily locked out`);
    return res.status(429).json({
      message: "Too many requests. Please try again later.",
      error: "RATE_LIMITED",
      retryAfter: getRetryAfterSeconds(ip)
    });
  }
  
  next();
};

/**
 * Express middleware for rate limiting password reset
 */
export const passwordResetLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // More strict rate limiting for password reset
  const record = failedAttempts.get(`reset_${ip}`) || {
    count: 0,
    firstAttempt: Date.now(),
    lastAttempt: Date.now()
  };
  
  // Only allow 3 password reset requests per hour
  if (record.count >= 3 && (Date.now() - record.firstAttempt) < ATTEMPT_RESET_DURATION) {
    return res.status(429).json({
      message: "Too many password reset requests. Please try again later.",
      error: "RATE_LIMITED",
      retryAfter: Math.ceil((record.firstAttempt + ATTEMPT_RESET_DURATION - Date.now()) / 1000)
    });
  }
  
  // Update the counter
  record.count += 1;
  record.lastAttempt = Date.now();
  failedAttempts.set(`reset_${ip}`, record);
  
  next();
};

/**
 * Get seconds until retry is allowed
 * @param {string} ip - The IP address to check
 * @returns {number} - Seconds until retry is allowed
 */
const getRetryAfterSeconds = (ip) => {
  const record = failedAttempts.get(ip);
  if (!record || !record.lockoutUntil) return 0;
  
  const now = Date.now();
  return Math.ceil((record.lockoutUntil - now) / 1000);
};

// Periodically clean up the failedAttempts map to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  failedAttempts.forEach((record, ip) => {
    // Remove entries that are no longer needed
    if ((now - record.lastAttempt > ATTEMPT_RESET_DURATION) || 
        (record.lockoutUntil && now > record.lockoutUntil + ATTEMPT_RESET_DURATION)) {
      failedAttempts.delete(ip);
    }
  });
}, 60 * 60 * 1000); // Run cleanup hourly 