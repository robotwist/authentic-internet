import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

// Password to set for all users
const NEW_PASSWORD = 'Password123';

const resetAllPasswords = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to database:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.error('No users found in the database');
      process.exit(1);
    }
    
    console.log(`Found ${users.length} users in the database`);

    // Update password for each user - directly use bcrypt to make sure it's correct
    for (const user of users) {
      console.log(`Resetting password for user: ${user.username} (${user.email})`);
      
      // Manually hash the password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);
      
      // Directly set the hashed password
      user.password = hashedPassword;
      await user.save();
      
      // Verify the password can be matched
      const isMatch = await bcrypt.compare(NEW_PASSWORD, user.password);
      console.log(`Password verification: ${isMatch ? 'Success ✅' : 'Failed ❌'}`);
      
      // Print the hashed password for debugging
      console.log(`Hashed password: ${user.password.substring(0, 20)}...`);
    }

    console.log(`\nAll passwords have been reset successfully`);
    console.log(`New password for ALL users is: ${NEW_PASSWORD}`);
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

resetAllPasswords(); 