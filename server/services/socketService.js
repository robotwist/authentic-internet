/**
 * WebSocket Service for real-time communication
 * This service handles Socket.io setup and event handlers
 */

// Initialize Socket.io server
let io;
let socketIoAvailable = false;

// Store active connections
const activeConnections = new Map();

/**
 * Initialize the WebSocket service with an HTTP server
 * @param {http.Server} server - The HTTP server to attach Socket.io to
 */
export const initSocketService = async (server) => {
  try {
    // Dynamic import of socket.io (ESM compatible)
    const socketIo = await import('socket.io');
    socketIoAvailable = true;
    
    io = new socketIo.Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' 
          ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'] 
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
        const jwt = await import('jsonwebtoken');
        const { default: User } = await import('../models/User.js');
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
      
      // Handle collaboration events
      setupCollaborationEvents(socket);
      
      // Disconnect event
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.username}`);
        activeConnections.delete(socket.user.id.toString());
        broadcastOnlineUsers();
      });
    });

    console.log('✅ WebSocket service initialized');
    return io;
  } catch (error) {
    // Socket.io is not available
    console.warn('⚠️ Socket.io is not available:', error.message);
    console.log('📣 WebSocket service disabled');
    return null;
  }
};

/**
 * Broadcast list of online users to all connected clients
 */
const broadcastOnlineUsers = () => {
  if (!socketIoAvailable || !io) return;
  
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
  if (!socketIoAvailable) return;
  
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
  if (!socketIoAvailable) return;
  
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
  if (!socketIoAvailable) return;
  
  // Join a world
  socket.on('world:join', async (data) => {
    try {
      if (!data.worldId) {
        socket.emit('error', { message: 'World ID is required' });
        return;
      }
      
      // Import required models
      const { default: WorldInstance } = await import('../models/World.js');
      const { default: User } = await import('../models/User.js');
      
      // Get or create world instance
      let worldInstance = await WorldInstance.findOne({ worldId: data.worldId });
      if (!worldInstance) {
        // Create default world instance
        const user = await User.findById(socket.user.id);
        worldInstance = new WorldInstance({
          worldId: data.worldId,
          name: data.worldName || 'Default World',
          description: data.worldDescription || 'A shared world for players to explore',
          creator: socket.user.id,
          maxPlayers: data.maxPlayers || 50
        });
        await worldInstance.save();
      }
      
      // Check if player can join
      if (!worldInstance.canPlayerJoin(socket.user.id)) {
        socket.emit('error', { message: 'Cannot join world - full or requires invite' });
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
      
      // Add player to world instance
      const user = await User.findById(socket.user.id);
      worldInstance.addPlayer(
        socket.user.id,
        socket.user.username,
        user.avatar,
        data.position || { x: 0, y: 0, z: 0 }
      );
      await worldInstance.save();
      
      // Notify others in the world
      socket.to(roomId).emit('world:user-joined', {
        userId: socket.user.id,
        username: socket.user.username,
        avatar: user.avatar,
        position: data.position || { x: 0, y: 0, z: 0 }
      });
      
      // Send world state to joining player
      const onlinePlayers = worldInstance.getOnlinePlayers();
      const recentMessages = worldInstance.getRecentChatMessages(50);
      
      socket.emit('world:joined', {
        worldId: data.worldId,
        worldName: worldInstance.name,
        players: onlinePlayers,
        messages: recentMessages,
        settings: worldInstance.settings
      });
      
      // Send updated player list to all players in world
      io.in(roomId).emit('world:players-updated', {
        players: onlinePlayers
      });
      
    } catch (error) {
      console.error('Error joining world:', error);
      socket.emit('error', { message: 'Failed to join world' });
    }
  });
  
  // Leave a world
  socket.on('world:leave', async (data) => {
    try {
      if (!data.worldId) {
        socket.emit('error', { message: 'World ID is required' });
        return;
      }
      
      const { default: WorldInstance } = await import('../models/World.js');
      
      const roomId = `world:${data.worldId}`;
      socket.leave(roomId);
      
      // Remove player from world instance
      const worldInstance = await WorldInstance.findOne({ worldId: data.worldId });
      if (worldInstance) {
        worldInstance.removePlayer(socket.user.id);
        await worldInstance.save();
        
        // Send updated player list to remaining players
        const onlinePlayers = worldInstance.getOnlinePlayers();
        io.in(roomId).emit('world:players-updated', {
          players: onlinePlayers
        });
      }
      
      // Notify others
      socket.to(roomId).emit('world:user-left', {
        userId: socket.user.id,
        username: socket.user.username
      });
      
    } catch (error) {
      console.error('Error leaving world:', error);
    }
  });
  
  // Update player position
  socket.on('world:update-position', async (data) => {
    try {
      if (!data.worldId || !data.position) {
        socket.emit('error', { message: 'World ID and position are required' });
        return;
      }
      
      const { default: WorldInstance } = await import('../models/World.js');
      
      const worldInstance = await WorldInstance.findOne({ worldId: data.worldId });
      if (worldInstance && worldInstance.isPlayerInWorld(socket.user.id)) {
        worldInstance.updatePlayerPosition(
          socket.user.id,
          data.position,
          data.facing || 'down'
        );
        await worldInstance.save();
        
        // Broadcast position update to other players in world
        const roomId = `world:${data.worldId}`;
        socket.to(roomId).emit('world:player-moved', {
          userId: socket.user.id,
          username: socket.user.username,
          position: data.position,
          facing: data.facing || 'down'
        });
      }
      
    } catch (error) {
      console.error('Error updating position:', error);
    }
  });
  
  // World chat message
  socket.on('world:message', async (data) => {
    try {
      if (!data.worldId || !data.content) {
        socket.emit('error', { message: 'World ID and content are required' });
        return;
      }
      
      const { default: WorldInstance } = await import('../models/World.js');
      const { default: ChatMessage } = await import('../models/Chat.js');
      const { default: User } = await import('../models/User.js');
      
      const worldInstance = await WorldInstance.findOne({ worldId: data.worldId });
      if (!worldInstance || !worldInstance.settings.allowChat) {
        socket.emit('error', { message: 'Chat not allowed in this world' });
        return;
      }
      
      const user = await User.findById(socket.user.id);
      
      // Add message to world instance
      worldInstance.addChatMessage(
        socket.user.id,
        socket.user.username,
        user.avatar,
        data.content,
        'chat'
      );
      await worldInstance.save();
      
      // Create chat message record
      const chatMessage = new ChatMessage({
        messageType: 'world',
        sender: {
          userId: socket.user.id,
          username: socket.user.username,
          avatar: user.avatar,
          level: user.level
        },
        world: {
          worldId: data.worldId,
          worldName: worldInstance.name
        },
        content: data.content
      });
      await chatMessage.save();
      
      const roomId = `world:${data.worldId}`;
      
      // Send to everyone in the world (including sender)
      io.in(roomId).emit('world:message', {
        messageId: chatMessage.messageId,
        senderId: socket.user.id,
        senderName: socket.user.username,
        senderAvatar: user.avatar,
        senderLevel: user.level,
        content: data.content,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error sending world message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // React to world message
  socket.on('world:react', async (data) => {
    try {
      if (!data.messageId || !data.emoji) {
        socket.emit('error', { message: 'Message ID and emoji are required' });
        return;
      }
      
      const { default: ChatMessage } = await import('../models/Chat.js');
      
      const message = await ChatMessage.findOne({ messageId: data.messageId });
      if (message) {
        message.addReaction(socket.user.id, socket.user.username, data.emoji);
        await message.save();
        
        // Broadcast reaction to world
        const roomId = `world:${data.worldId}`;
        io.in(roomId).emit('world:reaction', {
          messageId: data.messageId,
          userId: socket.user.id,
          username: socket.user.username,
          emoji: data.emoji
        });
      }
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });
  
  // Player interaction
  socket.on('world:player-interaction', async (data) => {
    try {
      if (!data.worldId || !data.targetUserId || !data.interactionType) {
        socket.emit('error', { message: 'World ID, target user ID, and interaction type are required' });
        return;
      }
      
      const { default: WorldInstance } = await import('../models/World.js');
      const { default: User } = await import('../models/User.js');
      
      const worldInstance = await WorldInstance.findOne({ worldId: data.worldId });
      if (!worldInstance) {
        socket.emit('error', { message: 'World not found' });
        return;
      }
      
      // Get target user
      const targetUser = await User.findById(data.targetUserId);
      if (!targetUser) {
        socket.emit('error', { message: 'Target user not found' });
        return;
      }
      
      // Send interaction to target player
      const targetSocket = activeConnections.get(data.targetUserId);
      if (targetSocket) {
        targetSocket.emit('world:player-interaction', {
          fromUserId: socket.user.id,
          fromUsername: socket.user.username,
          interactionType: data.interactionType,
          worldId: data.worldId
        });
      }
      
      // Broadcast interaction to world
      const roomId = `world:${data.worldId}`;
      socket.to(roomId).emit('world:player-interaction-broadcast', {
        fromUserId: socket.user.id,
        fromUsername: socket.user.username,
        targetUserId: data.targetUserId,
        targetUsername: targetUser.username,
        interactionType: data.interactionType
      });
      
    } catch (error) {
      console.error('Error handling player interaction:', error);
      socket.emit('error', { message: 'Failed to process interaction' });
    }
  });
};

/**
 * Set up artifact-related event handlers
 * @param {Object} socket - Socket instance
 */
const setupArtifactEvents = (socket) => {
  if (!socketIoAvailable) return;
  
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
 * Set up collaboration-related event handlers
 * @param {Object} socket - Socket instance
 */
const setupCollaborationEvents = (socket) => {
  if (!socketIoAvailable) return;
  
  // Join collaboration session
  socket.on('collaboration:join', async (data) => {
    try {
      if (!data.sessionId) {
        socket.emit('error', { message: 'Session ID is required' });
        return;
      }
      
      // Leave previous collaboration rooms
      Object.keys(socket.rooms).forEach(room => {
        if (room.startsWith('collaboration:')) {
          socket.leave(room);
        }
      });
      
      // Join collaboration room
      const roomId = `collaboration:${data.sessionId}`;
      socket.join(roomId);
      
      // Notify others in the session
      socket.to(roomId).emit('collaboration:user-joined', {
        userId: socket.user.id,
        username: socket.user.username,
        timestamp: new Date()
      });
      
      // Send list of users in this session
      const sessionUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map(socketId => {
          const userSocket = io.sockets.sockets.get(socketId);
          return {
            id: userSocket.user.id,
            username: userSocket.user.username
          };
        });
      
      socket.emit('collaboration:users', { users: sessionUsers });
      
      console.log(`User ${socket.user.username} joined collaboration session ${data.sessionId}`);
      
    } catch (error) {
      console.error('Error joining collaboration session:', error);
      socket.emit('error', { message: 'Failed to join collaboration session' });
    }
  });
  
  // Leave collaboration session
  socket.on('collaboration:leave', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    socket.leave(roomId);
    
    // Notify others
    socket.to(roomId).emit('collaboration:user-left', {
      userId: socket.user.id,
      username: socket.user.username,
      timestamp: new Date()
    });
    
    console.log(`User ${socket.user.username} left collaboration session ${data.sessionId}`);
  });
  
  // User starts editing
  socket.on('collaboration:user-editing', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    socket.to(roomId).emit('collaboration:user-editing', {
      userId: socket.user.id,
      username: socket.user.username,
      field: data.field,
      timestamp: new Date()
    });
  });
  
  // User stops editing
  socket.on('collaboration:user-stopped-editing', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    socket.to(roomId).emit('collaboration:user-stopped-editing', {
      userId: socket.user.id,
      username: socket.user.username,
      timestamp: new Date()
    });
  });
  
  // Cursor position update
  socket.on('collaboration:cursor-update', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    socket.to(roomId).emit('collaboration:cursor-update', {
      userId: socket.user.id,
      username: socket.user.username,
      position: data.position,
      field: data.field,
      timestamp: new Date()
    });
  });
  
  // Content update
  socket.on('collaboration:content-update', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    socket.to(roomId).emit('collaboration:content-update', {
      userId: socket.user.id,
      username: socket.user.username,
      field: data.field,
      value: data.value,
      timestamp: new Date()
    });
  });
  
  // Comment added
  socket.on('collaboration:comment-added', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    io.in(roomId).emit('collaboration:comment-added', {
      comment: data.comment,
      timestamp: new Date()
    });
  });
  
  // Comment resolved
  socket.on('collaboration:comment-resolved', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    io.in(roomId).emit('collaboration:comment-resolved', {
      commentId: data.commentId,
      resolvedBy: socket.user.id,
      timestamp: new Date()
    });
  });
  
  // Version saved
  socket.on('collaboration:version-saved', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    io.in(roomId).emit('collaboration:version-saved', {
      version: data.version,
      savedBy: socket.user.id,
      username: socket.user.username,
      timestamp: new Date()
    });
  });
  
  // Settings updated
  socket.on('collaboration:settings-updated', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    io.in(roomId).emit('collaboration:settings-updated', {
      settings: data.settings,
      updatedBy: socket.user.id,
      username: socket.user.username,
      timestamp: new Date()
    });
  });
  
  // User activity tracking
  socket.on('collaboration:activity', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    socket.to(roomId).emit('collaboration:activity', {
      userId: socket.user.id,
      username: socket.user.username,
      activity: data.activity,
      timestamp: new Date()
    });
  });
  
  // Session status update
  socket.on('collaboration:status-update', (data) => {
    if (!data.sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    const roomId = `collaboration:${data.sessionId}`;
    io.in(roomId).emit('collaboration:status-update', {
      status: data.status,
      updatedBy: socket.user.id,
      username: socket.user.username,
      timestamp: new Date()
    });
  });
};

/**
 * Get Socket.io server instance
 * @returns {Object} Socket.io server instance
 */
export const getIO = () => {
  if (!socketIoAvailable || !io) {
    console.warn('⚠️ Socket.io is not available, getIO returning null');
    return null;
  }
  return io;
};

/**
 * Send a notification to a specific user
 * @param {string} userId - User ID
 * @param {Object} data - Notification data
 */
export const sendNotification = (userId, data) => {
  if (!socketIoAvailable) {
    console.warn('⚠️ Socket.io is not available, notification not sent');
    return;
  }
  
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
  if (!socketIoAvailable || !io) {
    console.warn('⚠️ Socket.io is not available, broadcast not sent');
    return;
  }
  
  io.emit('notification', data);
};

export default {
  initSocketService,
  getIO,
  sendNotification,
  broadcastNotification
}; 