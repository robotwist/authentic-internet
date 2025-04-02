import express from "express";
import { body, validationResult } from "express-validator";
import { register, login } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
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

// 📌 1️⃣ POST /api/auth/register (Register a new user)
router.post(
  "/register",
  authLimiter,
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").custom(passwordValidator),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    try {
      await register(req, res); 
    } catch (error) {
      console.error("Error in register route:", error);
      res.status(500).json({ 
        error: error.message,
        passwordRequirements: getPasswordRequirementsText()
      });
    }
  }
);

// 📌 2️⃣ POST /api/auth/login (Login an existing user)
router.post(
  "/login",
  authLimiter,
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    try {
      await login(req, res); 
    } catch (error) {
      console.error("Error in login route:", error);
      res.status(500).json({ 
        error: error.message,
        passwordRequirements: getPasswordRequirementsText()
      });
    }
  }
);

// 📌 3️⃣ POST /api/auth/refresh (Refresh Token)
router.post("/refresh", (req, res) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied - No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const newToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token: newToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
});

export default router;
