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
  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Server health check
   *     description: Returns the current status of the API server
   *     tags: [System]
   *     responses:
   *       200:
   *         description: Server is operational
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   *                 serverTime:
   *                   type: string
   *                   format: date-time
   *                   example: 2023-06-12T14:35:42.123Z
   */
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

  /**
   * @swagger
   * /api/socket-test:
   *   get:
   *     summary: WebSocket test endpoint
   *     description: Validates that the WebSocket server is running
   *     tags: [System]
   *     responses:
   *       200:
   *         description: WebSocket server is operational
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 message:
   *                   type: string
   *                 instructions:
   *                   type: string
   */
  // WebSocket route for testing
  app.get("/api/socket-test", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "WebSocket endpoint is running and sockets are enabled",
      instructions: "Connect to the WebSocket server using socket.io client"
    });
  });
  
  /**
   * @swagger
   * /api:
   *   get:
   *     summary: API root endpoint
   *     description: Lists all available API endpoints
   *     tags: [System]
   *     responses:
   *       200:
   *         description: List of available endpoints
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 message:
   *                   type: string
   *                 availableEndpoints:
   *                   type: array
   *                   items:
   *                     type: string
   *                 documentation:
   *                   type: string
   */
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
      documentation: "See /api-docs for detailed API documentation"
    });
  });
}; 