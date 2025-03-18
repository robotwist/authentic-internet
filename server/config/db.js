import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Check if MONGO_URI is provided
    if (!process.env.MONGO_URI) {
      console.warn("⚠️ No MONGO_URI provided, skipping MongoDB connection");
      return false; // Return without crashing
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected Successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    // Don't exit the process, just return false
    return false;
  }
};

export default connectDB;
