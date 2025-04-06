import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validatePassword, validateUsername, validateEmail, getPasswordRequirementsText } from "../utils/validation.js";
import { recordFailedLoginAttempt, resetFailedLoginAttempts, shouldLockout } from "../utils/rateLimiting.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";
import crypto from "crypto";

// Validate that JWT_SECRET is properly set
if (!process.env.JWT_SECRET) {
  console.error("ERROR: JWT_SECRET environment variable is not set!");
  console.error("This is a critical security issue. The application should not run without a proper JWT_SECRET.");
  process.exit(1);
}

const secretKey = process.env.JWT_SECRET;
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
const tokenExpiration = process.env.JWT_EXPIRES_IN || "24h";
const refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

/**
 * Generate a JWT access token
 * @param {Object} payload - Data to include in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = tokenExpiration) => {
  return jwt.sign(payload, secretKey, { expiresIn });
};

/**
 * Generate a refresh token
 * @param {Object} payload - Data to include in the token
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, secretKey, { expiresIn: refreshTokenExpiration });
};

/**
 * Store a refresh token in the user's account
 * @param {string} userId - User ID
 * @param {string} refreshToken - Token to store
 * @param {string} userAgent - Browser/device info
 */
const storeRefreshToken = async (userId, refreshToken, userAgent) => {
  try {
    // Calculate expiration date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
    
    // Find user and add refresh token
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          expires: expiryDate,
          userAgent: userAgent || 'Unknown'
        }
      }
    });
    
    // Limit to 5 refresh tokens per user (oldest gets removed)
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          $each: [],
          $sort: { createdAt: -1 },
          $slice: 5
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error("Error storing refresh token:", error);
    return false;
  }
};

/**
 * Remove a refresh token from user's account
 * @param {string} userId - User ID
 * @param {string} refreshToken - Token to remove
 */
const removeRefreshToken = async (userId, refreshToken) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $pull: {
        refreshTokens: { token: refreshToken }
      }
    });
    return true;
  } catch (error) {
    console.error("Error removing refresh token:", error);
    return false;
  }
};

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: usernameValidation.message 
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: passwordValidation.message,
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: emailValidation.message 
      });
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
        return res.status(400).json({ 
          success: false,
          message: "Username already exists" 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Create new user
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: password,
      lastLogin: new Date(),
      emailVerificationToken: hashedToken,
      emailVerified: false
    });
    
    await newUser.save();

    // Generate tokens
    const accessToken = generateToken({ userId: newUser._id });
    const refreshToken = generateRefreshToken({ userId: newUser._id });
    
    // Store refresh token
    await storeRefreshToken(newUser._id, refreshToken, req.headers['user-agent']);

    // Set refresh token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, verificationToken, newUser.username);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Continue registration process even if email sending fails
      // We'll handle email verification later
    }

    // Return success response
    res.status(201).json({ 
      success: true,
      token: accessToken,
      user: { 
        id: newUser._id, 
        username: newUser.username,
        email: newUser.email,
        experience: newUser.experience || 0,
        level: newUser.level || 1,
        avatar: newUser.avatar
      },
      message: "Registration successful! Please check your email to verify your account."
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login an existing user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    console.log("📝 Login attempt received");
    
    // Get client IP address
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check if the IP is temporarily locked out
    if (shouldLockout(ip) && process.env.NODE_ENV !== 'development') {
      console.log(`Login blocked: IP ${ip} is temporarily locked out due to too many failed attempts`);
      return res.status(429).json({ 
        success: false,
        message: "Too many failed login attempts. Please try again later.",
        passwordRequirements: getPasswordRequirementsText(),
        lockout: true
      });
    }
    
    // Accept either identifier or username
    const identifier = req.body.identifier || req.body.username;
    const { password } = req.body;
    
    if (!identifier || !password) {
      console.log("Login failed: Missing credentials");
      
      // Record the failed attempt
      recordFailedLoginAttempt(ip);
      
      return res.status(400).json({ 
        success: false,
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
    if (!user) {
      console.log(`Login failed: No user found with identifier: ${identifier.toLowerCase()}`);
      
      // Record the failed attempt
      recordFailedLoginAttempt(ip);
      
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials. Please check your username/email and password.",
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    // Check account status
    if (user.accountStatus !== 'active') {
      console.log(`Login failed: Account status is ${user.accountStatus}`);
      return res.status(403).json({
        success: false,
        message: `Your account is ${user.accountStatus}. Please contact support.`
      });
    }

    console.log(`User found with ID: ${user._id}`);
    
    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for user: ${user.username}`);
      
      // Record the failed attempt
      const attempts = recordFailedLoginAttempt(ip);
      console.log(`Failed login attempts for IP ${ip}: ${attempts}`);
      
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials. Please check your username/email and password.",
        passwordRequirements: getPasswordRequirementsText()
      });
    }

    // Reset failed login attempts on successful login
    resetFailedLoginAttempts(ip);

    // Update last login and activity
    user.lastLogin = new Date();
    user.lastActive = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Store refresh token
    await storeRefreshToken(user._id, refreshToken, req.headers['user-agent']);

    console.log(`✅ Login successful for user: ${user.username}`);

    // Set refresh token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth' // Only send cookie to auth routes
    };

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Return success response with tokens
    res.json({ 
      success: true,
      token: accessToken,
      user: { 
        id: user._id, 
        username: user.username,
        email: user.email,
        experience: user.experience || 0,
        level: user.level || 1,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      message: "Login successful! Welcome back."
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      passwordRequirements: getPasswordRequirementsText()
    });
  }
};

/**
 * Verify and refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyToken = async (req, res) => {
  try {
    // User is already authenticated through the auth middleware
    const userId = req.user.userId;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    // Generate a new token
    const newToken = generateToken({ userId: user._id, role: user.role });

    // Return success response with new token
    res.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        experience: user.experience || 0,
        level: user.level || 1,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      },
      message: "Token verified and refreshed successfully"
    });
  } catch (error) {
    console.error("❌ Error verifying token:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Token verification failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh an expired access token using a refresh token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie instead of request body
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: "No refresh token provided" 
      });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, secretKey);
    
    if (!decoded.userId) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Check if refresh token exists in user's refreshTokens array
    const tokenExists = user.refreshTokens && user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }
    
    // Generate new access token
    const newAccessToken = generateToken({ userId: user._id, role: user.role });
    
    // Generate new refresh token
    const newRefreshToken = generateRefreshToken({ userId: user._id });
    
    // Replace old refresh token with new one
    await removeRefreshToken(user._id, refreshToken);
    await storeRefreshToken(user._id, newRefreshToken, req.headers['user-agent']);
    
    // Set new refresh token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    };
    
    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    
    // Return success response with new access token
    res.json({ 
      success: true,
      token: newAccessToken,
      message: "Token refreshed successfully" 
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Refresh token expired" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Failed to refresh token",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout user by invalidating refresh tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.userId;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Remove the specific refresh token if provided
    if (refreshToken) {
      await removeRefreshToken(userId, refreshToken);
    } else {
      // Otherwise, remove all refresh tokens for this user
      await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
    }
    
    // Return success response
    res.json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("❌ Error during logout:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's game state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUserGameState = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find user with game state data
    const user = await User.findById(userId)
      .select('username experience level inventory lastPosition gameState lastActive')
      .populate('inventory', 'name description type');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    // Return game state data
    res.json({
      success: true,
      gameState: {
        username: user.username,
        experience: user.experience,
        level: user.level,
        inventory: user.inventory,
        lastPosition: user.lastPosition,
        gameProgress: user.gameState,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error("❌ Error retrieving game state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve game state",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user's game state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateGameState = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameData } = req.body;
    
    if (!gameData) {
      return res.status(400).json({
        success: false,
        message: "Game data is required"
      });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Update game state
    await user.saveGameProgress(gameData);
    
    // Return success response
    res.json({
      success: true,
      message: "Game state updated successfully"
    });
  } catch (error) {
    console.error("❌ Error updating game state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update game state",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // For security reasons, always return success even if user is not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If a user with that email exists, a password reset link has been sent."
      });
    }
    
    // Generate password reset token (random bytes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour)
    const tokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Save token to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(tokenExpiry);
    await user.save();
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.username);
      
      res.status(200).json({
        success: true,
        message: "Password reset link has been sent to your email address."
      });
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      
      // Revert changes to user
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later."
      });
    }
  } catch (error) {
    console.error("Error in password reset request:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing password reset request."
    });
  }
};

/**
 * Reset password with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required."
      });
    }
    
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        success: false,
        message: passwordValidation.message,
        passwordRequirements: getPasswordRequirementsText()
      });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token."
      });
    }
    
    // Set new password
    user.password = newPassword;
    
    // Clear reset token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    // Save user with new password
    await user.save();
    
    // Generate new authentication tokens
    const accessToken = generateToken({ userId: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user._id });
    
    // Store refresh token
    await storeRefreshToken(user._id, refreshToken, req.headers['user-agent']);

    // Set refresh token in HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    };
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    // Return success response
    res.status(200).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        experience: user.experience || 0,
        level: user.level || 1,
        avatar: user.avatar
      },
      message: "Password has been reset successfully. You are now logged in."
    });
  } catch (error) {
    console.error("Error in password reset:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing password reset."
    });
  }
};

/**
 * Verify email with token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required"
      });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with matching verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email verification token"
      });
    }
    
    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Error in email verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing email verification"
    });
  }
};
