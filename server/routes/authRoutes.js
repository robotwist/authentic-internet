import express from "express";
import { body, validationResult } from "express-validator";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// ✅ Register Route (with Validation)
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
      await register(req, res); // Call controller method
    } catch (error) {
      console.error("Error in register route:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Login Route
router.post("/login", async (req, res) => {
  try {
    await login(req, res); // Call controller method
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
