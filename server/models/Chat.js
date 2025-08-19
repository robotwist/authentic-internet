import mongoose from "mongoose";

// Chat message schema
const ChatMessageSchema = new mongoose.Schema({
  // Message metadata
  messageId: { type: String, required: true, unique: true },
  messageType: { 
    type: String, 
    enum: ['private', 'world', 'artifact', 'system', 'group'], 
    required: true 
  },
  
  // Sender information
  sender: { 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatar: { type: String },
    level: { type: Number, default: 1 }
  },
  
  // Recipient information (for private messages)
  recipient: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String }
  },
  
  // World context (for world chat)
  world: {
    worldId: { type: String },
    worldName: { type: String }
  },
  
  // Artifact context (for artifact discussions)
  artifact: {
    artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
    artifactName: { type: String }
  },
  
  // Message content
  content: { 
    type: String, 
    required: true, 
    maxlength: 1000 
  },
  
  // Message formatting
  formatting: {
    isBold: { type: Boolean, default: false },
    isItalic: { type: Boolean, default: false },
    color: { type: String },
    emoji: { type: String }
  },
  
  // Message status
  status: {
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Reactions
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    emoji: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Read receipts (for private messages)
  readReceipts: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String },
    readAt: { type: Date, default: Date.now }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
ChatMessageSchema.index({ messageType: 1, createdAt: -1 });
ChatMessageSchema.index({ 'sender.userId': 1, createdAt: -1 });
ChatMessageSchema.index({ 'recipient.userId': 1, createdAt: -1 });
ChatMessageSchema.index({ 'world.worldId': 1, createdAt: -1 });
ChatMessageSchema.index({ 'artifact.artifactId': 1, createdAt: -1 });
ChatMessageSchema.index({ messageId: 1 });

// Methods for chat management
ChatMessageSchema.methods.addReaction = function(userId, username, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    userId,
    username,
    emoji,
    timestamp: new Date()
  });
  
  this.updatedAt = new Date();
};

ChatMessageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  this.updatedAt = new Date();
};

ChatMessageSchema.methods.markAsRead = function(userId, username) {
  // Remove existing read receipt from this user
  this.readReceipts = this.readReceipts.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new read receipt
  this.readReceipts.push({
    userId,
    username,
    readAt: new Date()
  });
  
  this.updatedAt = new Date();
};

ChatMessageSchema.methods.editMessage = function(newContent) {
  this.content = newContent;
  this.status.isEdited = true;
  this.status.editedAt = new Date();
  this.updatedAt = new Date();
};

ChatMessageSchema.methods.deleteMessage = function(deletedBy) {
  this.status.isDeleted = true;
  this.status.deletedAt = new Date();
  this.status.deletedBy = deletedBy;
  this.updatedAt = new Date();
};

// Static methods for querying
ChatMessageSchema.statics.getPrivateMessages = function(userId1, userId2, limit = 50) {
  return this.find({
    messageType: 'private',
    $or: [
      { 'sender.userId': userId1, 'recipient.userId': userId2 },
      { 'sender.userId': userId2, 'recipient.userId': userId1 }
    ],
    'status.isDeleted': false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender.userId', 'username avatar level')
  .populate('recipient.userId', 'username avatar');
};

ChatMessageSchema.statics.getWorldMessages = function(worldId, limit = 100) {
  return this.find({
    messageType: 'world',
    'world.worldId': worldId,
    'status.isDeleted': false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender.userId', 'username avatar level');
};

ChatMessageSchema.statics.getArtifactMessages = function(artifactId, limit = 50) {
  return this.find({
    messageType: 'artifact',
    'artifact.artifactId': artifactId,
    'status.isDeleted': false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender.userId', 'username avatar level')
  .populate('artifact.artifactId', 'name');
};

// Pre-save middleware to generate message ID
ChatMessageSchema.pre('save', function(next) {
  if (!this.messageId) {
    this.messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage;
