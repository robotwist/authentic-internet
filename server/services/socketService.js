/**
 * WebSocket Service for real-time communication
 * This service handles Socket.io setup and event handlers
 */
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Store active connections
const activeConnections = new Map();

// Initialize Socket.io server
let io;

/**
 * Initialize the WebSocket service with an HTTP server
 * @param {Object} server - HTTP server instance
 */
export const initSocketService = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'development' 
        ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'] 
        : [process.env.CLIENT_URL],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware to authenticate users
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.user = {
        id: user._id,
        username: user.username,
        email: user.email
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Store connection
    activeConnections.set(socket.user.id.toString(), socket);
    
    // Notify everyone about online users
    broadcastOnlineUsers();
    
    // Handle user events
    setupUserEvents(socket);
    
    // Handle message events
    setupMessageEvents(socket);
    
    // Handle world events
    setupWorldEvents(socket);
    
    // Handle artifact events
    setupArtifactEvents(socket);
    
    // Disconnect event
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      activeConnections.delete(socket.user.id.toString());
      broadcastOnlineUsers();
    });
  });

  console.log('✅ WebSocket service initialized');
  return io;
};

/**
 * Broadcast list of online users to all connected clients
 */
const broadcastOnlineUsers = () => {
  const onlineUsers = Array.from(activeConnections.values()).map(socket => ({
    id: socket.user.id,
    username: socket.user.username
  }));
  
  io.emit('online-users', { users: onlineUsers });
};

/**
 * Set up user-related event handlers
 * @param {Object} socket - Socket instance
 */
const setupUserEvents = (socket) => {
  // User status update (away, busy, online, etc.)
  socket.on('user:status', (data) => {
    socket.broadcast.emit('user:status', {
      userId: socket.user.id,
      status: data.status
    });
  });

  // User typing indicator for chat
  socket.on('user:typing', (data) => {
    const targetSocket = activeConnections.get(data.userId);
    if (targetSocket) {
      targetSocket.emit('user:typing', {
        userId: socket.user.id,
        username: socket.user.username,
        isTyping: data.isTyping
      });
    }
  });
};

/**
 * Set up message-related event handlers
 * @param {Object} socket - Socket instance
 */
const setupMessageEvents = (socket) => {
  // New private message
  socket.on('message:private', async (data) => {
    try {
      // Validate data
      if (!data.content || !data.recipientId) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Store message in database (implement your message saving logic)
      // const message = await Message.create({...})
      
      // Send to recipient if online
      const recipientSocket = activeConnections.get(data.recipientId);
      if (recipientSocket) {
        recipientSocket.emit('message:private', {
          senderId: socket.user.id,
          senderName: socket.user.username,
          content: data.content,
          timestamp: new Date(),
          // messageId: message._id
        });
      }
      
      // Acknowledge message receipt
      socket.emit('message:sent', {
        success: true,
        recipientId: data.recipientId,
        // messageId: message._id
      });
      
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Read receipt for messages
  socket.on('message:read', (data) => {
    const senderSocket = activeConnections.get(data.senderId);
    if (senderSocket) {
      senderSocket.emit('message:read', {
        messageId: data.messageId,
        readBy: socket.user.id,
        readAt: new Date()
      });
    }
  });
};

/**
 * Set up world-related event handlers
 * @param {Object} socket - Socket instance
 */
const setupWorldEvents = (socket) => {
  // Join a world
  socket.on('world:join', (data) => {
    if (!data.worldId) {
      socket.emit('error', { message: 'World ID is required' });
      return;
    }
    
    // Leave previous world rooms
    Object.keys(socket.rooms).forEach(room => {
      if (room.startsWith('world:')) {
        socket.leave(room);
      }
    });
    
    // Join new world room
    const roomId = `world:${data.worldId}`;
    socket.join(roomId);
    
    // Notify others in the world
    socket.to(roomId).emit('world:user-joined', {
      userId: socket.user.id,
      username: socket.user.username
    });
    
    // Send list of users in this world
    const worldUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .map(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        return {
          id: userSocket.user.id,
          username: userSocket.user.username
        };
      });
    
    socket.emit('world:users', { users: worldUsers });
  });
  
  // Leave a world
  socket.on('world:leave', (data) => {
    if (!data.worldId) {
      socket.emit('error', { message: 'World ID is required' });
      return;
    }
    
    const roomId = `world:${data.worldId}`;
    socket.leave(roomId);
    
    // Notify others
    socket.to(roomId).emit('world:user-left', {
      userId: socket.user.id,
      username: socket.user.username
    });
  });
  
  // World chat message
  socket.on('world:message', (data) => {
    if (!data.worldId || !data.content) {
      socket.emit('error', { message: 'World ID and content are required' });
      return;
    }
    
    const roomId = `world:${data.worldId}`;
    
    // Send to everyone in the world (including sender)
    io.in(roomId).emit('world:message', {
      senderId: socket.user.id,
      senderName: socket.user.username,
      content: data.content,
      timestamp: new Date()
    });
  });
};

/**
 * Set up artifact-related event handlers
 * @param {Object} socket - Socket instance
 */
const setupArtifactEvents = (socket) => {
  // Artifact created
  socket.on('artifact:created', (data) => {
    // Broadcast to all connected users
    socket.broadcast.emit('artifact:created', {
      creatorId: socket.user.id,
      creatorName: socket.user.username,
      artifactId: data.artifactId,
      artifactName: data.name
    });
  });
  
  // Artifact updated
  socket.on('artifact:updated', (data) => {
    socket.broadcast.emit('artifact:updated', {
      updaterId: socket.user.id,
      updaterName: socket.user.username,
      artifactId: data.artifactId,
      artifactName: data.name
    });
  });
  
  // Artifact interaction (e.g., viewing, commenting)
  socket.on('artifact:interaction', (data) => {
    socket.broadcast.emit('artifact:interaction', {
      userId: socket.user.id,
      username: socket.user.username,
      artifactId: data.artifactId,
      interactionType: data.type
    });
  });
};

/**
 * Get Socket.io server instance
 * @returns {Object} Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Send a notification to a specific user
 * @param {string} userId - User ID
 * @param {Object} data - Notification data
 */
export const sendNotification = (userId, data) => {
  const socket = activeConnections.get(userId.toString());
  if (socket) {
    socket.emit('notification', data);
  }
};

/**
 * Broadcast a notification to all connected users
 * @param {Object} data - Notification data
 */
export const broadcastNotification = (data) => {
  io.emit('notification', data);
};

export default {
  initSocketService,
  getIO,
  sendNotification,
  broadcastNotification
}; 