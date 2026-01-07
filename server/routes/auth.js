import express from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, verifyToken, logout, refreshToken, getUserGameState, updateGameState, requestPasswordReset, resetPassword, verifyEmail } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { PASSWORD_REQUIREMENTS, getPasswordRequirementsText } from '../utils/validation.js';
import { authLimiter, passwordResetLimiter, gameStateReadLimiter, gameStateWriteLimiter } from '../utils/rateLimiting.js';
import { validateResetToken } from "../controllers/passwordResetController.js";
import { sendVerificationEmail } from "../controllers/emailVerificationController.js";

const router = express.Router();

/**
 * Password validation function for express-validator
 * Checks that passwords meet all requirements
 */
const passwordValidator = (value) => {
  // Minimum length check
  if (value.length < PASSWORD_REQUIREMENTS.minLength) {
    throw new Error(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }
  
  // Uppercase check
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(value)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(value)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  // Number check
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(value)) {
    throw new Error('Password must contain at least one number');
  }
  
  return true;
};

// Validation middleware
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .custom(passwordValidator)
];

const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .exists()
    .withMessage('Password is required')
];

// Registration route
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array(),
      passwordRequirements: getPasswordRequirementsText()
    });
  }

  try {
    await register(req, res);
  } catch (error) {
    console.error("Error in register route:", error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed. Please try again.",
      error: error.message,
      passwordRequirements: getPasswordRequirementsText()
    });
  }
});

// Login route
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array()
    });
  }

  try {
    await login(req, res);
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed. Please try again.",
      error: error.message
    });
  }
});

// Token verification route (both GET and POST for flexibility)
router.get('/verify', auth, async (req, res) => {
  try {
    await verifyToken(req, res);
  } catch (error) {
    console.error("Error in verify token route:", error);
    res.status(401).json({ 
      success: false,
      message: "Token verification failed"
    });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    await verifyToken(req, res);
  } catch (error) {
    console.error("Error in verify token route:", error);
    res.status(401).json({ 
      success: false,
      message: "Token verification failed"
    });
  }
});

// Token refresh route
router.post('/refresh', async (req, res) => {
  try {
    await refreshToken(req, res);
  } catch (error) {
    console.error("Error in refresh token route:", error);
    res.status(401).json({ 
      success: false,
      message: "Token refresh failed"
    });
  }
});

// Logout route
router.post('/logout', auth, async (req, res) => {
  try {
    await logout(req, res);
  } catch (error) {
    console.error("Error in logout route:", error);
    res.status(500).json({ 
      success: false,
      message: "Logout failed"
    });
  }
});

// Get user game state route
router.get('/game-state', auth, gameStateReadLimiter, async (req, res) => {
  try {
    await getUserGameState(req, res);
  } catch (error) {
    console.error("Error in game state route:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve game state"
    });
  }
});

// Update user game state route
router.post('/game-state', auth, gameStateWriteLimiter, async (req, res) => {
  try {
    await updateGameState(req, res);
  } catch (error) {
    console.error("Error in update game state route:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update game state"
    });
  }
});

// Add password reset routes
router.post("/password/reset-request", passwordResetLimiter, requestPasswordReset);
router.get("/password/validate-token/:token", validateResetToken);
router.post("/password/reset/:token", passwordResetLimiter, resetPassword);

// Add email verification routes
router.post("/email/send-verification", auth, sendVerificationEmail);
router.get("/email/verify/:token", verifyEmail);

export default router; 