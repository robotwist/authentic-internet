import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { register, login, verifyToken } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { PASSWORD_REQUIREMENTS, getPasswordRequirementsText } from '../utils/validation.js';
import { authLimiter, passwordResetLimiter } from '../utils/rateLimiting.js';

const router = express.Router();

// Password validation function for express-validator
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
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long').escape(),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').custom(passwordValidator)
];

const validateLogin = [
  body('identifier').trim().notEmpty().withMessage('Username or email is required'),
  body('password').exists().withMessage('Password is required')
];

// Public routes with rate limiting
router.post('/register', authLimiter, validateRegistration, register);
router.post('/login', authLimiter, validateLogin, login);

// Protected routes - verify and refresh token (handle both GET and POST)
router.get('/verify', auth, verifyToken);
router.post('/verify', auth, verifyToken);

export default router; 