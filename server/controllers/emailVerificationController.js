import crypto from 'crypto';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

/**
 * Send email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    // Save token to user document
    user.emailVerificationToken = hashedToken;
    await user.save();
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken, user.username);
      
      return res.status(200).json({
        success: true,
        message: "Verification email sent successfully"
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      
      // Reset the token in case of email failure
      user.emailVerificationToken = null;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later."
      });
    }
  } catch (error) {
    console.error("Send verification email error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while sending verification email"
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
    
    // Hash the token to compare with the one in the database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with the token
    const user = await User.findOne({
      emailVerificationToken: hashedToken
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token"
      });
    }
    
    // Update user document
    user.emailVerified = true;
    user.emailVerificationToken = null;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying email"
    });
  }
}; 