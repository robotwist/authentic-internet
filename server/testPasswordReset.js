import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB and test password reset functionality
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  testPasswordReset();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function testPasswordReset() {
  try {
    // Find a test user
    const user = await User.findOne({ email: 'robotwist@gmail.com' });
    
    if (!user) {
      console.error('Test user not found');
      mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`Found test user: ${user.username} (${user.email})`);
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour)
    const tokenExpiry = Date.now() + 3600000;
    
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
    
    // Now we don't reset the password, so we can test the token validation separately
    
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
} 