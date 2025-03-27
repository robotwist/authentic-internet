import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { register, login, verifyToken } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long').escape(),
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const validateLogin = [
  body('identifier').trim().notEmpty().withMessage('Username or email is required'),
  body('password').exists().withMessage('Password is required')
];

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Protected routes - verify and refresh token
router.post('/verify', auth, verifyToken);

export default router; 