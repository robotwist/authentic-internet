import express from "express";
import { body, validationResult } from "express-validator";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// 📌 1️⃣ POST /api/auth/register (Register a new user)
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await register(req, res); 
    } catch (error) {
      console.error("Error in register route:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// 📌 2️⃣ POST /api/auth/login (Login an existing user)
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await login(req, res); 
    } catch (error) {
      console.error("Error in login route:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
