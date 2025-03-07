import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js"; // Make sure your db file is a .js module

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import artifactRoutes from "./routes/artifactRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Initialize Express App
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect to MongoDB Before Starting Server
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected Successfully");

    // Use Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/artifacts", artifactRoutes);
    app.use("/api/users", userRoutes);

    // Root API Route
    app.get("/", (req, res) => {
      res.send("✅ API is working! Use /api/artifacts or /api/users");
    });

    // Start Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// Start the Server
startServer();
