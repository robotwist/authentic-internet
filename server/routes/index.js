import authRoutes from "./auth.js";
import artifactRoutes from "./artifactRoutes.js";
import userRoutes from "./userRoutes.js";
import messageRoutes from "./messageRoutes.js";
import worldRoutes from "./worlds.js";
import npcRoutes from "./npcs.js";
import proxyRoutes from "./proxy.js";
import progressRoutes from "./progressRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";

/**
 * Apply all routes to Express app
 * @param {Object} app - Express app instance
 */
export const applyRoutes = (app) => {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', serverTime: new Date().toISOString() });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/artifacts", artifactRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/worlds", worldRoutes);
  app.use("/api/npcs", npcRoutes);
  app.use("/api/proxy", proxyRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/feedback", feedbackRoutes);

  // WebSocket route for testing
  app.get("/api/socket-test", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "WebSocket endpoint is running and sockets are enabled",
      instructions: "Connect to the WebSocket server using socket.io client"
    });
  });
  
  // Catchall route for /api to show available endpoints
  app.get("/api", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Authentic Internet API",
      availableEndpoints: [
        "/api/health",
        "/api/auth",
        "/api/users",
        "/api/artifacts",
        "/api/messages",
        "/api/worlds",
        "/api/npcs",
        "/api/proxy",
        "/api/progress",
        "/api/feedback",
        "/api/socket-test"
      ],
      documentation: "See documentation for endpoint usage details"
    });
  });
}; 