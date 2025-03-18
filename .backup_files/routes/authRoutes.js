import express from "express";
import { body, validationResult } from "express-validator";
import { register, login } from "../controllers/authController.js";
import jwt from "jsonwebtoken";

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
