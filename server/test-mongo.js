import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGO_URI found:', !!process.env.MONGO_URI);
    
    if (!process.env.MONGO_URI) {
      console.log('❌ No MONGO_URI found in environment');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected Successfully');
    await mongoose.disconnect();
    console.log('✅ Connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

testConnection(); 