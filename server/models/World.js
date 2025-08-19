import mongoose from "mongoose";

// Player position in world
const PlayerPositionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, default: 0 }
  },
  facing: { type: String, enum: ['up', 'down', 'left', 'right'], default: 'down' },
  lastActive: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: true }
});

// Chat message in world
const WorldChatMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String },
  content: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
  messageType: { type: String, enum: ['chat', 'system', 'artifact'], default: 'chat' },
  artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' }
});

// World instance for multiplayer
const WorldInstanceSchema = new mongoose.Schema({
  worldId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  
  // World configuration
  maxPlayers: { type: Number, default: 50 },
  isPublic: { type: Boolean, default: true },
  requiresInvite: { type: Boolean, default: false },
  
  // Current state
  activePlayers: [PlayerPositionSchema],
  chatHistory: [WorldChatMessageSchema],
  
  // World-specific artifacts
  artifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' }],
  
  // World settings
  settings: {
    allowChat: { type: Boolean, default: true },
    allowArtifactCreation: { type: Boolean, default: true },
    allowPlayerInteraction: { type: Boolean, default: true },
    maxChatHistory: { type: Number, default: 100 }
  },
  
  // World creator and moderators
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // World statistics
  stats: {
    totalVisits: { type: Number, default: 0 },
    totalArtifactsCreated: { type: Number, default: 0 },
    totalChatMessages: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  
  // World state
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
WorldInstanceSchema.index({ worldId: 1 });
WorldInstanceSchema.index({ 'activePlayers.userId': 1 });
WorldInstanceSchema.index({ isActive: 1, isPublic: 1 });
WorldInstanceSchema.index({ createdAt: -1 });

// Methods for world management
WorldInstanceSchema.methods.addPlayer = function(userId, username, avatar, position) {
  // Remove existing player entry
  this.activePlayers = this.activePlayers.filter(p => p.userId.toString() !== userId.toString());
  
  // Add new player
  this.activePlayers.push({
    userId,
    username,
    avatar,
    position,
    lastActive: new Date(),
    isOnline: true
  });
  
  this.stats.totalVisits++;
  this.stats.lastActivity = new Date();
};

WorldInstanceSchema.methods.removePlayer = function(userId) {
  this.activePlayers = this.activePlayers.filter(p => p.userId.toString() !== userId.toString());
  this.stats.lastActivity = new Date();
};

WorldInstanceSchema.methods.updatePlayerPosition = function(userId, position, facing) {
  const player = this.activePlayers.find(p => p.userId.toString() === userId.toString());
  if (player) {
    player.position = position;
    player.facing = facing;
    player.lastActive = new Date();
  }
};

WorldInstanceSchema.methods.addChatMessage = function(userId, username, avatar, content, messageType = 'chat', artifactId = null) {
  this.chatHistory.push({
    userId,
    username,
    avatar,
    content,
    messageType,
    artifactId,
    timestamp: new Date()
  });
  
  // Keep only the last maxChatHistory messages
  if (this.chatHistory.length > this.settings.maxChatHistory) {
    this.chatHistory = this.chatHistory.slice(-this.settings.maxChatHistory);
  }
  
  this.stats.totalChatMessages++;
  this.stats.lastActivity = new Date();
};

WorldInstanceSchema.methods.getRecentChatMessages = function(limit = 50) {
  return this.chatHistory.slice(-limit);
};

WorldInstanceSchema.methods.getOnlinePlayers = function() {
  return this.activePlayers.filter(p => p.isOnline);
};

WorldInstanceSchema.methods.isPlayerInWorld = function(userId) {
  return this.activePlayers.some(p => p.userId.toString() === userId.toString() && p.isOnline);
};

WorldInstanceSchema.methods.canPlayerJoin = function(userId) {
  if (!this.isActive) return false;
  if (this.requiresInvite && !this.moderators.includes(userId)) return false;
  if (this.activePlayers.length >= this.maxPlayers) return false;
  return true;
};

const WorldInstance = mongoose.model('WorldInstance', WorldInstanceSchema);
export default WorldInstance;
