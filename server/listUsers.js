// Script to list all users in the database
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/authentic-internet';
console.log(`Connecting to database: ${MONGO_URI}`);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define a simple user schema for this script
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      isActive: Boolean
    });
    
    // Create the model
    const User = mongoose.model('User', userSchema);
    
    // Find all users
    return User.find({}, 'username email isActive')
      .then(users => {
        console.log('\nUsers in the database:');
        console.log('=====================');
        
        if (users.length === 0) {
          console.log('No users found in the database.');
        } else {
          users.forEach(user => {
            console.log(`- ${user.username} (${user.email}) ${user.isActive ? 'Active' : 'Inactive'}`);
          });
          console.log(`\nTotal users: ${users.length}`);
        }
      });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  })
  .finally(() => {
    // Close the connection
    setTimeout(() => {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }, 1000);
  }); 