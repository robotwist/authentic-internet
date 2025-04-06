import nodemailer from 'nodemailer';

// Create a transporter object using SMTP transport
let transporter;

const initializeTransporter = () => {
  // For production use real SMTP settings
  if (process.env.NODE_ENV === 'production') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // For development/testing use Ethereal to simulate email sending
    console.log('Using development email transporter');
    nodemailer.createTestAccount()
      .then(testAccount => {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`📧 Development email credentials: ${testAccount.user} / ${testAccount.pass}`);
        console.log('📧 View test emails at: https://ethereal.email/');
      })
      .catch(err => {
        console.error('Failed to create test email account:', err);
      });
  }
};

// Initialize the transporter on import
initializeTransporter();

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} username - User's username
 * @returns {Promise} - Promise with send info
 */
export const sendPasswordResetEmail = async (email, token, username) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"Authentic Internet" <${process.env.EMAIL_USER || 'noreply@authentic-internet.com'}>`,
    to: email,
    subject: 'Password Reset Request',
    text: `Hello ${username},\n\nYou are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${username},</p>
        <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click the button below to complete the process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <div style="margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px;">
          <p>This is an automated message from Authentic Internet. Please do not reply to this email.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    
    // For development, log the URL where the email can be previewed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send email verification email
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @param {string} username - User's username
 * @returns {Promise} - Promise with send info
 */
export const sendVerificationEmail = async (email, token, username) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"Authentic Internet" <${process.env.EMAIL_USER || 'noreply@authentic-internet.com'}>`,
    to: email,
    subject: 'Email Verification',
    text: `Hello ${username},\n\nThank you for registering with Authentic Internet. Please verify your email address by clicking on the following link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.\n`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Hello ${username},</p>
        <p>Thank you for registering with Authentic Internet. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you did not create an account, please ignore this email.</p>
        <div style="margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px;">
          <p>This is an automated message from Authentic Internet. Please do not reply to this email.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    
    // For development, log the URL where the email can be previewed
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export default {
  sendPasswordResetEmail,
  sendVerificationEmail
}; 