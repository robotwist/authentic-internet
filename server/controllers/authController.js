import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Validate that JWT_SECRET is properly set
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set!");
  console.error("This is a critical security issue. The application should not run without a proper JWT_SECRET.");
  // In production, we might want to exit the process here
  // process.exit(1);
}

const secretKey = process.env.JWT_SECRET; // No fallback - JWT_SECRET must be set
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10; // Salt rounds can have a reasonable default

// ✅ Register a new user
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalizedUsername = username.toLowerCase(); // Normalize username

    // Check if user exists
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({ username: normalizedUsername, password: hashedPassword });
    await newUser.save();

    // Generate JWT Token
    const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: "24h" });

    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username } });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Login an existing user
export const login = async (req, res) => {
  try {
    console.log("📝 Login attempt received: ", req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.error("❌ Missing credentials in login request");
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const normalizedUsername = username.toLowerCase(); // Normalize username
    console.log(`📝 Looking up user: ${normalizedUsername}`);
    
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      console.error(`❌ User not found: ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error(`❌ Password mismatch for user: ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "1h" });
    console.log(`✅ Login successful for user: ${username}`);

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username,
        experience: user.experience || 0,
        level: user.level || 1 
      } 
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
