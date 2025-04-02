/**
 * Shared validation utilities for consistent application-wide validation
 */

// Password requirements configuration
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true, 
  requireLowercase: true,
  requireNumber: true,
  // You can add more requirements here in the future if needed
  // requireSpecialChar: true,
};

/**
 * Validates a password against the application's password policy
 * @param {string} password - The password to validate
 * @returns {Object} Object with isValid flag and message if invalid
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: "Password is required" };
  }
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { 
      isValid: false, 
      message: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long` 
    };
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  
  return { isValid: true };
};

/**
 * Gets a formatted string of password requirements for error messages
 * @returns {string} Formatted password requirements
 */
export const getPasswordRequirementsText = () => {
  const requirements = [];
  
  requirements.push(`at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  
  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push("contain at least one uppercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push("contain at least one lowercase letter");
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumber) {
    requirements.push("contain at least one number");
  }
  
  return `Password must ${requirements.join(", and ")}`;
};

/**
 * Validates a username against the application's username policy
 * @param {string} username - The username to validate
 * @returns {Object} Object with isValid flag and message if invalid
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { isValid: false, message: "Username is required" };
  }
  
  if (username.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters long" };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, message: "Username can only contain letters, numbers, and underscores" };
  }
  
  return { isValid: true };
};

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {Object} Object with isValid flag and message if invalid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: "Email is required" };
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, message: "Please provide a valid email address" };
  }
  
  return { isValid: true };
}; 