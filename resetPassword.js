const mongoose = require('mongoose');
const User = require('./server/models/User');
const bcrypt = require('bcryptjs');

require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    // Reset password for all users
    for (const user of users) {
      console.log(`Resetting password for user: ${user.username}`);
      
      // Set the new password (will be hashed by the pre-save hook)
      user.password = 'Password123';
      
      // Save the user
      await user.save();
      
      // Verify the password works after saving
      const passwordMatch = await user.comparePassword('Password123');
      console.log(`Password verification for ${user.username}: ${passwordMatch ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log('All passwords have been reset successfully!');
    console.log('New password for all users: Password123');
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
}); 