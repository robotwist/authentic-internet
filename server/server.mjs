import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import connectMongo from "connect-mongo";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(
  session({
    store: connectMongo.create({ mongoUrl: process.env.MONGO_URI }),
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  })
);

const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected Successfully");

    const authRoutes = await import("./routes/authRoutes.js");
    const artifactRoutes = await import("./routes/artifactRoutes.js");
    const userRoutes = await import("./routes/userRoutes.js");
    const messageRoutes = await import("./routes/messageRoutes.js");

    app.use("/api/auth", authRoutes.default);
    app.use("/api/artifacts", artifactRoutes.default);
    app.use("/api/users", userRoutes.default);
    app.use("/api/messages", messageRoutes.default);

    app.get("/", (req, res) => {
      res.send("✅ API is working! Use /api/artifacts or /api/users");
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
