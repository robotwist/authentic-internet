import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validatePassword, validateUsername, validateEmail, getPasswordRequirementsText } from "../utils/validation.js";
import { recordFailedLoginAttempt, resetFailedLoginAttempts, shouldLockout } from "../utils/rateLimiting.js";

// Validate that JWT_SECRET is properly set
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set!");
  console.error("This is a critical security issue. The application should not run without a proper JWT_SECRET.");
  process.exit(1);
}

const secretKey = process.env.JWT_SECRET;
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
const tokenExpiration = process.env.JWT_EXPIRES_IN || "24h";

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
      return res.status(400).json({ 
        message: passwordValidation.message,
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.message });
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
    console.log("Request body:", JSON.stringify(req.body));
    
    // Get client IP address
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check if the IP is temporarily locked out
    if (shouldLockout(ip) && process.env.NODE_ENV !== 'development') {
      console.log(`Login blocked: IP ${ip} is temporarily locked out due to too many failed attempts`);
      return res.status(429).json({ 
        message: "Too many failed login attempts. Please try again later.",
        passwordRequirements: getPasswordRequirementsText(),
        lockout: true
      });
    }
    
    // Accept either identifier or username for backward compatibility
    const identifier = req.body.identifier || req.body.username;
    const { password } = req.body;
    
    if (!identifier || !password) {
      console.log("Login failed: Missing credentials");
      
      // Record the failed attempt
      recordFailedLoginAttempt(ip);
      
      return res.status(400).json({ 
        message: "Please provide both username/email and password",
        passwordRequirements: getPasswordRequirementsText()
      });
    }
    
    console.log(`Searching for user with identifier: ${identifier.toLowerCase()}`);
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: identifier.toLowerCase() },
        { email: identifier.toLowerCase() }
      ]
    });

    // For security, don't reveal if username exists or password is wrong
    // Instead, provide generic message with password requirements
    if (!user) {
      console.log(`Login failed: No user found with identifier: ${identifier.toLowerCase()}`);
      
      // Record the failed attempt
      recordFailedLoginAttempt(ip);
      
      return res.status(401).json({ 
        message: "Invalid credentials. Please check your username/email and password.",
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    console.log(`User found with ID: ${user._id}`);
    console.log(`Comparing passwords for user: ${user.username}`);
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for user: ${user.username}`);
      
      // Record the failed attempt
      const attempts = recordFailedLoginAttempt(ip);
      console.log(`Failed login attempts for IP ${ip}: ${attempts}`);
      
      return res.status(401).json({ 
        message: "Invalid credentials. Please check your username/email and password.",
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    // Reset failed login attempts on successful login
    resetFailedLoginAttempts(ip);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT Token with consistent expiration
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: tokenExpiration });
    console.log(`✅ Login successful for user: ${user.username} with token length: ${token.length}`);

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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      passwordRequirements: getPasswordRequirementsText()
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
