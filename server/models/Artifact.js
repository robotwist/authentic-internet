import mongoose from "mongoose";

// Sub-schemas for different content types
const GameConfigSchema = new mongoose.Schema({
  gameType: { 
    type: String, 
    enum: ['shooter', 'textAdventure', 'terminal', 'puzzle', 'platformer', 'rpg', 'custom'],
    required: function() { return this.parent().contentType === 'game'; }
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
  estimatedPlayTime: { type: Number, default: 10 }, // minutes
  gameData: { type: mongoose.Schema.Types.Mixed }, // Game-specific data
  controlScheme: {
    type: [String],
    default: ['keyboard'],
    enum: ['keyboard', 'mouse', 'touch', 'gamepad']
  },
  multiplayer: { type: Boolean, default: false },
  maxPlayers: { type: Number, default: 1 }
});

const WritingConfigSchema = new mongoose.Schema({
  writingType: {
    type: String,
    enum: ['poetry', 'short-story', 'novel-chapter', 'essay', 'script', 'lyrics', 'other'],
    required: function() { return this.parent().contentType === 'writing'; }
  },
  genre: [{ type: String }], // fantasy, sci-fi, romance, etc.
  wordCount: { type: Number },
  language: { type: String, default: 'en' },
  mature: { type: Boolean, default: false },
  collaborativeEdit: { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true }
});

const ArtConfigSchema = new mongoose.Schema({
  artType: {
    type: String,
    enum: ['digital', 'pixel', 'concept', 'character', 'environment', 'ui', 'photo', 'mixed'],
    required: function() { return this.parent().contentType === 'art'; }
  },
  medium: [{ type: String }], // photoshop, procreate, traditional, etc.
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  style: [{ type: String }], // realistic, cartoon, abstract, etc.
  nsfw: { type: Boolean, default: false }
});

const MusicConfigSchema = new mongoose.Schema({
  musicType: {
    type: String,
    enum: ['original', 'remix', 'cover', 'soundtrack', 'ambient', 'effect'],
    required: function() { return this.parent().contentType === 'music'; }
  },
  genre: [{ type: String }],
  duration: { type: Number }, // seconds
  bpm: { type: Number },
  key: { type: String },
  instruments: [{ type: String }],
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Player progress for interactive content
const PlayerProgressSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Progress tracking
  startedAt: { type: Date, default: Date.now },
  lastPlayedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  completed: { type: Boolean, default: false },
  
  // Game-specific progress
  currentState: { type: mongoose.Schema.Types.Mixed, default: {} },
  saveData: { type: mongoose.Schema.Types.Mixed, default: {} },
  achievements: [{ type: String }],
  
  // Performance metrics
  timeSpent: { type: Number, default: 0 }, // seconds
  attempts: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 },
  
  // Completion rewards granted
  rewardsGranted: { type: Boolean, default: false },
  experienceGained: { type: Number, default: 0 },
  powersUnlocked: [{ type: String }]
});

// Rating and review system
const RatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, maxlength: 1000 },
  helpful: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users who found this helpful
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Collection system
const CollectionEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addedAt: { type: Date, default: Date.now },
  collectionName: { type: String, default: 'Favorites' },
  tags: [{ type: String }],
  personalNotes: { type: String, maxlength: 500 }
});

// Main Artifact Schema
const ArtifactSchema = new mongoose.Schema({
  // Basic Information
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 1000 },
  
  // Content Type and Configuration
  contentType: {
    type: String,
    enum: ['game', 'writing', 'art', 'music', 'puzzle', 'experience', 'artifact'],
    default: 'artifact'
  },
  
  // Type-specific configurations
  gameConfig: GameConfigSchema,
  writingConfig: WritingConfigSchema,
  artConfig: ArtConfigSchema,
  musicConfig: MusicConfigSchema,
  
  // Legacy fields for backwards compatibility
  content: { type: String },
  riddle: { type: String },
  unlockAnswer: { type: String },
  
  // Location and World
  area: { type: String, required: true },
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, default: 0 } // For 3D positioning
  },
  worldType: { 
    type: String, 
    enum: ['overworld', 'desert', 'yosemite', 'dungeon', 'special', 'user-created'],
    default: 'overworld' 
  },
  
  // Creator and Ownership
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // Visibility and Access
  visibility: {
    type: String,
    enum: ['public', 'unlisted', 'private', 'community-only'],
    default: 'public'
  },
  featured: { type: Boolean, default: false },
  featuredAt: { type: Date },
  featuredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Requirements and Progression
  requirements: {
    level: { type: Number, default: 1 },
    powers: [{ type: String }], // Required powers to access
    completedArtifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artifact" }],
    areas: [{ type: String }] // Required areas to unlock
  },
  
  // Rewards and Progression
  completionRewards: {
    experience: { type: Number, default: 0 },
    powers: [{ type: String }], // Powers to unlock
    areas: [{ type: String }], // Areas to unlock
    items: [{ type: String }], // Items to grant
    achievements: [{ type: String }],
    customRewards: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Interactive Features
  isInteractive: { type: Boolean, default: false },
  allowsUserProgress: { type: Boolean, default: false },
  playerProgress: [PlayerProgressSchema],
  
  // Social Features
  ratings: [RatingSchema],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  collections: [CollectionEntrySchema],
  
  // Engagement Metrics
  views: { type: Number, default: 0 },
  plays: { type: Number, default: 0 }, // For interactive content
  completions: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  
  // Content Management
  tags: [{ type: String }],
  mature: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 },
  moderationStatus: {
    type: String,
    enum: ['approved', 'pending', 'flagged', 'removed'],
    default: 'approved'
  },
  
  // Media and Assets
  image: { type: String, default: "/images/default-artifact.png" },
  media: [{
    type: { type: String, enum: ['image', 'audio', 'video', 'document'] },
    url: { type: String },
    filename: { type: String },
    description: { type: String }
  }],
  
  // Legacy fields
  attachment: { type: String },
  attachmentType: { type: String },
  attachmentOriginalName: { type: String },
  type: { type: String, enum: ["artifact", "message"], default: "artifact" },
  messageText: { type: String },
  isExclusive: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  publishedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for performance
ArtifactSchema.index({ contentType: 1, featured: -1, createdAt: -1 });
ArtifactSchema.index({ area: 1, visibility: 1 });
ArtifactSchema.index({ creator: 1, createdAt: -1 });
ArtifactSchema.index({ averageRating: -1, totalRatings: -1 });
ArtifactSchema.index({ tags: 1 });
ArtifactSchema.index({ "location.x": 1, "location.y": 1, area: 1 });

// Virtual for display name based on content type
ArtifactSchema.virtual('displayType').get(function() {
  switch(this.contentType) {
    case 'game': return this.gameConfig?.gameType || 'Game';
    case 'writing': return this.writingConfig?.writingType || 'Writing';
    case 'art': return this.artConfig?.artType || 'Art';
    case 'music': return this.musicConfig?.musicType || 'Music';
    default: return 'Artifact';
  }
});

// Method to get player's progress
ArtifactSchema.methods.getPlayerProgress = function(playerId) {
  return this.playerProgress.find(p => p.playerId.toString() === playerId.toString());
};

// Method to check if player can access this artifact
ArtifactSchema.methods.canPlayerAccess = function(player) {
  // Check level requirement
  if (this.requirements.level && player.level < this.requirements.level) {
    return { canAccess: false, reason: 'Level too low', required: this.requirements.level };
  }
  
  // Check power requirements
  if (this.requirements.powers && this.requirements.powers.length > 0) {
    const playerPowers = player.unlockedPowers || [];
    const missingPowers = this.requirements.powers.filter(power => !playerPowers.includes(power));
    if (missingPowers.length > 0) {
      return { canAccess: false, reason: 'Missing powers', required: missingPowers };
    }
  }
  
  // Check completed artifacts requirement
  if (this.requirements.completedArtifacts && this.requirements.completedArtifacts.length > 0) {
    const playerCompletions = player.completedArtifacts || [];
    const missingCompletions = this.requirements.completedArtifacts.filter(
      artifactId => !playerCompletions.includes(artifactId.toString())
    );
    if (missingCompletions.length > 0) {
      return { canAccess: false, reason: 'Missing prerequisites', required: missingCompletions };
    }
  }
  
  return { canAccess: true };
};

// Method to check if player can attempt (for interactive content)
ArtifactSchema.methods.canPlayerAttempt = function(playerId) {
  if (!this.isInteractive) return false;
  
  const progress = this.getPlayerProgress(playerId);
  if (!progress) return true; // First attempt
  
  // Check if already completed
  if (progress.completed) return false;
  
  // Check attempt limits (if configured)
  const maxAttempts = this.gameConfig?.maxAttempts || -1;
  if (maxAttempts > 0 && progress.attempts >= maxAttempts) {
    return false;
  }
  
  return true;
};

// Method to add or update rating
ArtifactSchema.methods.addRating = function(userId, rating, review = '') {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new rating
  this.ratings.push({
    userId,
    rating,
    review,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Recalculate average
  this.updateRatingStats();
};

// Method to update rating statistics
ArtifactSchema.methods.updateRatingStats = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal
    this.totalRatings = this.ratings.length;
  }
};

// Method to update completion statistics
ArtifactSchema.methods.updateCompletionStats = function() {
  if (this.isInteractive) {
    this.completions = this.playerProgress.filter(p => p.completed).length;
    this.plays = this.playerProgress.length;
  }
};

// Method to add to user's collection
ArtifactSchema.methods.addToCollection = function(userId, collectionName = 'Favorites', tags = [], notes = '') {
  // Remove if already in collection
  this.collections = this.collections.filter(c => 
    !(c.userId.toString() === userId.toString() && c.collectionName === collectionName)
  );
  
  // Add to collection
  this.collections.push({
    userId,
    collectionName,
    tags,
    personalNotes: notes,
    addedAt: new Date()
  });
};

// Pre-save middleware
ArtifactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.updateRatingStats();
  this.updateCompletionStats();
  next();
});

export default mongoose.model("Artifact", ArtifactSchema);
