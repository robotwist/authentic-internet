import mongoose from 'mongoose';
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
      
      // Set email verification status to false for testing
      user.emailVerified = false;
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token for storage
      const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
      
      // Save token to user
      user.emailVerificationToken = hashedToken;
      await user.save();
      
      console.log(`Generated verification token: ${verificationToken}`);
      console.log('Verification token saved to user document');
      console.log(`Email verification status before: ${user.emailVerified}`);
      
      console.log('\nVerification URL:');
      console.log(`http://localhost:3000/verify-email/${verificationToken}`);
      console.log('\nTo verify email, run:');
      console.log(`curl -X GET http://localhost:5000/api/auth/verify-email/${verificationToken}`);
      
      // Simulate email verification
      // For direct test, compare the hashed token
      const foundUser = await User.findOne({
        emailVerificationToken: hashedToken
      });
      
      if (foundUser) {
        console.log('\nFound user with valid verification token!');
        
        // Mark email as verified
        foundUser.emailVerified = true;
        foundUser.emailVerificationToken = null;
        
        // Save user
        await foundUser.save();
        
        console.log(`Email verification status after: ${foundUser.emailVerified}`);
      } else {
        console.log('Failed to find user with verification token. This should not happen!');
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