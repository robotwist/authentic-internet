import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// Validate that JWT_SECRET is properly set
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set!");
  console.error("This is a critical security issue. The application should not run without a proper JWT_SECRET.");
  process.exit(1);
}

const secretKey = process.env.JWT_SECRET;
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
const tokenExpiration = process.env.JWT_EXPIRES_IN || "24h";

// Password validation helper
const validatePassword = (password) => {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain at least one number" };
  }
  return { isValid: true };
};

// Username validation helper
const validateUsername = (username) => {
  if (username.length < 3) {
    return { isValid: false, message: "Username must be at least 3 characters long" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, message: "Username can only contain letters, numbers, and underscores" };
  }
  return { isValid: true };
};

// ✅ Register a new user
export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ message: usernameValidation.message });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    // Check if user exists by username or email
    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail }
      ]
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword
    });
    
    await newUser.save();

    // Generate JWT Token with consistent expiration
    const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: tokenExpiration });

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser._id, 
        username: newUser.username,
        email: newUser.email,
        experience: newUser.experience || 0,
        level: newUser.level || 1
      },
      message: "Registration successful! Welcome to the game."
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ 
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Login an existing user
export const login = async (req, res) => {
  try {
    console.log("📝 Login attempt received");
    
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ 
        message: "Please provide both username/email and password" 
      });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        message: "Invalid credentials. Please check your username/email and password." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: "Invalid credentials. Please check your username/email and password." 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT Token with consistent expiration
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: tokenExpiration });
    console.log(`✅ Login successful for user: ${user.username}`);

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username,
        email: user.email,
        experience: user.experience || 0,
        level: user.level || 1,
        lastLogin: user.lastLogin
      },
      message: "Login successful! Welcome back."
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ 
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Verify and refresh token
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify the token
    const decoded = jwt.verify(token, secretKey);
    
    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate a new token
    const newToken = jwt.sign({ userId: user._id }, secretKey, { expiresIn: tokenExpiration });

    res.json({
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        experience: user.experience || 0,
        level: user.level || 1,
        lastLogin: user.lastLogin
      },
      message: "Token verified and refreshed successfully"
    });
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(500).json({ 
      message: "Token verification failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
