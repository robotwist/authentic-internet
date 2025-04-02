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
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  }
});

// Stricter rate limiter for authentication routes to prevent brute force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
    passwordRequirements: 'Passwords must be at least 8 characters and include uppercase, lowercase, and numbers.'
  },
  // Skip rate limiting in development to make testing easier
  skip: () => process.env.NODE_ENV === 'development',
});

// Very strict rate limiter for password reset routes
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429, 
    message: 'Too many password reset attempts, please try again after an hour.'
  },
  skip: () => process.env.NODE_ENV === 'development'
});

// Store failed login attempts for IP-based account lockout
const failedLoginAttempts = new Map();

/**
 * Get failed login attempts for a specific IP
 * @param {string} ip - IP address
 * @returns {number} Number of failed attempts
 */
export const getFailedLoginAttempts = (ip) => {
  return failedLoginAttempts.get(ip) || 0;
};

/**
 * Record a failed login attempt for an IP
 * @param {string} ip - IP address
 */
export const recordFailedLoginAttempt = (ip) => {
  const attempts = getFailedLoginAttempts(ip) + 1;
  failedLoginAttempts.set(ip, attempts);
  
  // Automatically clear the record after the lockout period (60 minutes)
  setTimeout(() => {
    const currentAttempts = failedLoginAttempts.get(ip);
    if (currentAttempts && currentAttempts <= attempts) {
      failedLoginAttempts.delete(ip);
    }
  }, 60 * 60 * 1000);
  
  return attempts;
};

/**
 * Reset failed login attempts for an IP (on successful login)
 * @param {string} ip - IP address
 */
export const resetFailedLoginAttempts = (ip) => {
  failedLoginAttempts.delete(ip);
};

/**
 * Check if an account should be temporarily locked out based on failed attempts
 * @param {string} ip - IP address
 * @returns {boolean} Whether the account should be locked out
 */
export const shouldLockout = (ip) => {
  return getFailedLoginAttempts(ip) >= 10; // Lock after 10 failed attempts
}; 