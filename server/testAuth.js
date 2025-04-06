import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Test user
    const testEmail = 'robotwist@gmail.com';
    
    // Find test user
    const user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log(`Found test user: ${user.username} (${user.email})`);
      
      // Generate reset token
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
      
      console.log(`Generated reset token: ${resetToken}`);
      console.log('Reset token saved to user document');
      console.log('\nReset URL:');
      console.log(`http://localhost:3000/reset-password/${resetToken}`);
      console.log('\nTo validate the token, run:');
      console.log(`curl -X GET http://localhost:5000/api/auth/password/validate-token/${resetToken}`);
      console.log('\nTo reset the password, run:');
      console.log(`curl -X POST http://localhost:5000/api/auth/password/reset/${resetToken} -H "Content-Type: application/json" -d '{"password":"NewPassword123"}'`);
      
      // Simulate password reset
      const newPassword = 'Password123'; // New test password
      
      // For direct test, compare the hashed token
      const foundUser = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (foundUser) {
        console.log('\nFound user with valid reset token!');
        
        // Set new password
        foundUser.password = newPassword;
        
        // Clear reset token fields
        foundUser.resetPasswordToken = null;
        foundUser.resetPasswordExpires = null;
        
        // Save user with new password
        await foundUser.save();
        
        console.log(`Password reset to: ${newPassword}`);
        
        // Verify password
        const passwordValid = await foundUser.comparePassword(newPassword);
        console.log(`Password verification: ${passwordValid ? 'Success' : 'Failed'}`);
      } else {
        console.log('Failed to find user with reset token. This should not happen!');
      }
      
    } else {
      console.log(`No user found with email: ${testEmail}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
}); 