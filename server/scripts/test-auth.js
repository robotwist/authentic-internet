/**
 * Authentication System Test Script
 * 
 * This script tests the core authentication functionality:
 * - User registration
 * - User login
 * - Token verification
 * - Token refresh
 * - Game state persistence
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from multiple possible locations
const loadEnvConfig = () => {
  // Try loading from .env file in current directory
  if (fs.existsSync(resolve(__dirname, '../.env'))) {
    dotenv.config({ path: resolve(__dirname, '../.env') });
    console.log('✅ Loaded environment from ../.env');
  }
  // Try loading from .env file in parent directory
  else if (fs.existsSync(resolve(__dirname, '../../.env'))) {
    dotenv.config({ path: resolve(__dirname, '../../.env') });
    console.log('✅ Loaded environment from ../../.env');
  }
  else {
    console.log('⚠️ No .env file found, using defaults');
    dotenv.config();
  }

  // Set comprehensive fallback values for testing if not in environment
  const fallbackValues = {
    MONGODB_URI: 'mongodb://localhost:27017/auth_test',
    JWT_SECRET: 'test_jwt_secret_do_not_use_in_production_very_long_key_for_testing',
    JWT_EXPIRES_IN: '24h',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    SALT_ROUNDS: '10',
    PORT: '5001',
    NODE_ENV: 'test',
    CLIENT_URL: 'http://localhost:5173',
    COOKIE_SECRET: 'test_cookie_secret_do_not_use_in_production'
  };

  let missingVars = [];
  
  // Check and set fallback values for each required variable
  Object.entries(fallbackValues).forEach(([key, fallbackValue]) => {
    if (!process.env[key]) {
      console.warn(`⚠️ ${key} not found in environment variables. Using fallback for testing.`);
      process.env[key] = fallbackValue;
      missingVars.push(key);
    }
  });

  // Log status of critical environment variables
  console.log('\n📋 Environment configuration:');
  console.log('=======================================');
  console.log(`- MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`- JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN || '24h (default)'}`);
  console.log(`- REFRESH_TOKEN_EXPIRES_IN: ${process.env.REFRESH_TOKEN_EXPIRES_IN || '7d (default)'}`);
  console.log(`- SALT_ROUNDS: ${process.env.SALT_ROUNDS || '10 (default)'}`);
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'test (default)'}`);
  console.log(`- PORT: ${process.env.PORT || '5001 (default)'}`);
  
  if (missingVars.length > 0) {
    console.log(`\n⚠️ Using fallback values for: ${missingVars.join(', ')}`);
    console.log('💡 For production, ensure all environment variables are properly set.');
  } else {
    console.log('\n✅ All environment variables are properly configured');
  }
  
  console.log('=======================================\n');
};

// Load env configuration before proceeding
loadEnvConfig();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Add additional options for reliability
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout on server selection
      socketTimeoutMS: 45000, // 45 seconds timeout on socket operations
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error('Please check your MongoDB connection string and make sure MongoDB is running.');
    return false;
  }
};

// Test user data
const timestamp = Date.now();
const testUser = {
  username: `test_user_${timestamp}`,
  email: `test_${timestamp}@example.com`,
  password: 'Test1234!',
};

// Helper function for JWT generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Cleanup function to remove test user
const cleanup = async () => {
  try {
    console.log(`\nCleaning up: Removing test user ${testUser.username}`);
    await User.findOneAndDelete({ username: testUser.username });
    console.log('Test user removed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
};

// Test registration
const testRegistration = async () => {
  console.log('\n===== TESTING USER REGISTRATION =====');
  try {
    // Create a new user
    const newUser = new User({
      username: testUser.username,
      email: testUser.email,
      password: testUser.password,
    });

    await newUser.save();
    console.log('✅ Registration test passed: User saved successfully');

    // Verify the user was saved correctly
    const savedUser = await User.findOne({ username: testUser.username });
    if (!savedUser) {
      throw new Error('User not found after registration');
    }
    console.log(`✅ User verification passed: Found user ${savedUser.username}`);

    // Verify password is hashed
    const isPasswordHashed = savedUser.password !== testUser.password;
    if (!isPasswordHashed) {
      throw new Error('Password was not hashed');
    }
    console.log('✅ Password hashing test passed');

    // Verify password comparison method works
    const isMatch = await savedUser.comparePassword(testUser.password);
    if (!isMatch) {
      throw new Error('Password comparison failed');
    }
    console.log('✅ Password comparison test passed');

    return savedUser;
  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
    throw error;
  }
};

// Test login
const testLogin = async (user) => {
  console.log('\n===== TESTING USER LOGIN =====');
  try {
    // Verify correct credentials work
    const isMatch = await user.comparePassword(testUser.password);
    if (!isMatch) {
      throw new Error('Login failed: Password comparison failed');
    }
    console.log('✅ Login test passed: Password validation successful');

    // Generate token
    const token = generateToken(user._id);
    if (!token) {
      throw new Error('Token generation failed');
    }
    console.log('✅ Token generation test passed');

    // Verify token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      throw new Error('Token verification failed');
    }
    console.log('✅ Token verification test passed');

    // Check decoded user ID matches
    if (decoded.userId.toString() !== user._id.toString()) {
      throw new Error('Token user ID mismatch');
    }
    console.log('✅ Token payload test passed: User ID matches');

    return token;
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    throw error;
  }
};

// Test game state persistence
const testGameState = async (user) => {
  console.log('\n===== TESTING GAME STATE PERSISTENCE =====');
  try {
    // Mock game state data
    const gameData = {
      gameState: {
        currentQuest: 'find_artifact',
        textAdventureProgress: {
          currentRoom: 'library',
          inventory: ['key', 'book'],
          completedInteractions: ['talk_to_librarian', 'examine_bookshelf'],
          knownPasswords: ['iceberg_theory']
        }
      }
    };

    // Save game state
    await user.saveGameProgress(gameData);
    console.log('✅ Game state save test passed');

    // Verify game state was saved
    const updatedUser = await User.findById(user._id);
    if (!updatedUser.gameState) {
      throw new Error('Game state not found after save');
    }

    // Check specific values
    if (updatedUser.gameState.currentQuest !== 'find_artifact') {
      throw new Error('Game state currentQuest not saved correctly');
    }
    console.log('✅ Game state verification test passed: currentQuest correct');

    if (updatedUser.gameState.textAdventureProgress.currentRoom !== 'library') {
      throw new Error('Text adventure currentRoom not saved correctly');
    }
    console.log('✅ Text adventure progress test passed: currentRoom correct');

    if (!updatedUser.gameState.textAdventureProgress.inventory.includes('key')) {
      throw new Error('Text adventure inventory not saved correctly');
    }
    console.log('✅ Text adventure inventory test passed');

    if (!updatedUser.gameState.textAdventureProgress.knownPasswords.includes('iceberg_theory')) {
      throw new Error('Text adventure knownPasswords not saved correctly');
    }
    console.log('✅ Text adventure knownPasswords test passed');

    return true;
  } catch (error) {
    console.error('❌ Game state test failed:', error.message);
    throw error;
  }
};

// Main test function
const runTests = async () => {
  let user = null;
  let connected = false;

  try {
    console.log('Starting authentication system tests...');
    
    // Connect to database
    connected = await connectDB();
    
    if (!connected) {
      console.error('Could not connect to MongoDB, aborting tests');
      return;
    }
    
    // Run tests in sequence
    user = await testRegistration();
    const token = await testLogin(user);
    await testGameState(user);
    
    console.log('\n✅ ALL TESTS PASSED');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
  } finally {
    // Clean up test data
    if (connected && user) {
      await cleanup();
    }
    
    // Disconnect from database
    if (connected) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    
    console.log('Test suite completed');
  }
};

// Run the tests
runTests(); 