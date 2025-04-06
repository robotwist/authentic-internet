import crypto from 'crypto';
import User from '../models/User.js';
import { validatePassword, getPasswordRequirementsText } from '../utils/validation.js';
import emailService from '../services/emailService.js';

/**
 * Request a password reset
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
    
    // Don't reveal if user exists for security reasons
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If your email is registered, you will receive a password reset link shortly."
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token and expiry on user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Send email with reset link
    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.username);
      
      return res.status(200).json({
        success: true,
        message: "Password reset email sent successfully"
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      
      // Reset the token in case of email failure
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later."
      });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request"
    });
  }
};

/**
 * Validate reset token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required"
      });
    }
    
    // Hash the token to compare with the one in the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with the token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Reset token is valid",
      username: user.username
    });
  } catch (error) {
    console.error("Validate reset token error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while validating the reset token"
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
    const { token } = req.params;
    const { password } = req.body;
    
    // Add debug logging
    console.log('Reset Password Debug:');
    console.log('Token from params:', token);
    console.log('Password from body:', password);
    console.log('Full request body:', req.body);
    console.log('Request params:', req.params);
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
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
    
    // Hash the token to compare with the one in the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with the token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }
    
    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting the password"
    });
  }
}; 