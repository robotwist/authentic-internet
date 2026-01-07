import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { PASSWORD_REQUIREMENTS } from "../utils/validation.js";

// Power system schema
const PowerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  unlockedAt: { type: Date, default: Date.now },
  source: { type: String }, // artifact that granted this power
  level: { type: Number, default: 1 },
  active: { type: Boolean, default: true }
});

// Achievement schema
const AchievementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String },
  description: { type: String },
  icon: { type: String },
  unlockedAt: { type: Date, default: Date.now },
  artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' }
});

// Collection schema for organizing artifacts
const CollectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  artifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' }],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Creator stats schema
const CreatorStatsSchema = new mongoose.Schema({
  totalArtifacts: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalFavorites: { type: Number, default: 0 },
  featuredCount: { type: Number, default: 0 },
  topRatedArtifact: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
  mostPlayedArtifact: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
  lastPublished: { type: Date }
});

const UserSchema = new mongoose.Schema(
  {
    // Basic authentication fields
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"]
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`],
    },
    
    // Password reset and email verification
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    emailVerificationToken: {
      type: String,
      default: null
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    
    // Enhanced user profile
    displayName: {
      type: String,
      trim: true,
      default: function() { return this.username; }
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/pixel-art/svg?seed=unknown",
    },
    characterSprite: {
      type: String, // Base64 data URL of custom pixel art character
      default: null
    },
    characterName: {
      type: String,
      trim: true,
      default: function() { return this.username; }
    },
    bio: {
      type: String,
      default: "",
      maxlength: [250, "Bio must be less than 250 characters"]
    },
    
    // Social features
    friends: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    blockedUsers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    
    // Friend system
    friendRequests: {
      sent: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
      }],
      received: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        receivedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
      }]
    },
    
    // Game progression
    experience: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    skillPoints: {
      type: Number,
      default: 0
    },
    achievements: [{
      id: String,
      name: String,
      description: String,
      unlockedAt: Date
    }],
    
    // Skill system
    skills: {
      type: Map,
      of: {
        level: { type: Number, default: 0 },
        unlockedAt: { type: Date, default: Date.now }
      },
      default: {}
    },
    
    // Daily challenges system
    dailyChallenges: {
      date: { type: String },
      challenges: [{
        id: String,
        title: String,
        description: String,
        type: String,
        target: Number,
        progress: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        claimed: { type: Boolean, default: false },
        reward: {
          experience: Number,
          coins: Number
        }
      }]
    },
    
    // Virtual currency
    coins: {
      type: Number,
      default: 0
    },
    
    // Challenge streak
    challengeStreak: {
      type: Number,
      default: 0
    },
    
    // Game state
    inventory: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Artifact" 
    }],
    messages: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Message" 
    }],
    lastPosition: {
      worldId: { type: String, default: "overworld" },
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      facing: { type: String, default: "down" }
    },
    gameState: {
      type: Object,
      default: {
        inventory: [],
        viewedArtifacts: [],
        achievements: [],
        gameProgress: {
          currentQuest: null,
          completedQuests: [],
          discoveredLocations: []
        },
        lastPosition: {
          worldId: null,
          x: 0,
          y: 0
        }
      }
    },
    
    // Activity tracking
    lastLogin: { 
      type: Date
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Security and account management
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned", "deleted"],
      default: "active"
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user"
    },
    refreshTokens: [{
      token: String,
      expires: Date,
      userAgent: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    securitySettings: {
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      loginNotifications: {
        type: Boolean,
        default: true
      }
    },
    
    // Power System
    unlockedPowers: [PowerSchema],
    activePowers: [{ type: String }], // IDs of currently active powers
    maxActivePowers: { type: Number, default: 3 },
    
    // World Progression
    unlockedAreas: [{ 
      areaId: { type: String, required: true },
      unlockedAt: { type: Date, default: Date.now },
      discoveredBy: { type: String } // how they unlocked it
    }],
    currentArea: { type: String, default: 'overworld' },
    explorationLevel: { type: Number, default: 1 },
    
    // Artifact Progression
    completedArtifacts: [{ 
      artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
      completedAt: { type: Date, default: Date.now },
      score: { type: Number },
      attempts: { type: Number, default: 1 },
      timeSpent: { type: Number } // seconds
    }],
    favoriteArtifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' }],
    
    // Achievements
    achievementPoints: { type: Number, default: 0 },
    
    // Collections
    collections: [CollectionSchema],
    
    // Creator Features
    isCreator: { type: Boolean, default: false },
    creatorLevel: { type: Number, default: 1 },
    creatorStats: CreatorStatsSchema,
    verifiedCreator: { type: Boolean, default: false },
    
    // Social Features
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Preferences
    preferences: {
      notifications: {
        newFollowers: { type: Boolean, default: true },
        artifactRatings: { type: Boolean, default: true },
        featuredContent: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: true }
      },
      privacy: {
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
        showRealName: { type: Boolean, default: false },
        showLocation: { type: Boolean, default: false },
        allowMessages: { type: String, enum: ['everyone', 'friends', 'none'], default: 'friends' }
      },
      gameplay: {
        autoSave: { type: Boolean, default: true },
        soundEnabled: { type: Boolean, default: true },
        musicEnabled: { type: Boolean, default: true },
        difficulty: { type: String, enum: ['easy', 'normal', 'hard'], default: 'normal' }
      }
    },
    
    // Moderation
    isModerator: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    banExpiresAt: { type: Date },
    warningCount: { type: Number, default: 0 },
    
    // Legacy fields for backwards compatibility
    character: {
      class: { type: String, default: 'explorer' },
      stats: {
        strength: { type: Number, default: 10 },
        intelligence: { type: Number, default: 10 },
        charisma: { type: Number, default: 10 },
        wisdom: { type: Number, default: 10 }
      }
    },
    totalExperience: { type: Number, default: 0 },
    totalPlayTime: { type: Number, default: 0 }, // seconds
    joinedAt: { type: Date, default: Date.now },
  },
  { 
    timestamps: true,
    // Add virtual fields, use them in JSON responses
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.password; // Don't expose password
        delete ret.refreshTokens; // Don't expose refresh tokens
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual for total playtime
UserSchema.virtual('playtime').get(function() {
  const created = this.createdAt || new Date();
  const lastActive = this.lastActive || new Date();
  return Math.floor((lastActive - created) / (1000 * 60 * 60)); // in hours
});

// Virtual for experience needed for next level
UserSchema.virtual('experienceToNextLevel').get(function() {
  const currentLevelExp = this.getExperienceForLevel(this.level);
  const nextLevelExp = this.getExperienceForLevel(this.level + 1);
  return nextLevelExp - this.experience;
});

// Virtual for follower count
UserSchema.virtual('followerCount').get(function() {
  return this.followers?.length || 0;
});

// Virtual for following count
UserSchema.virtual('followingCount').get(function() {
  return this.following?.length || 0;
});

// Method to calculate experience needed for a specific level
UserSchema.methods.getExperienceForLevel = function(level) {
  // Exponential experience curve
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Method to add experience and handle level ups
UserSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  this.totalExperience += amount;
  
  const oldLevel = this.level;
  
  // Check for level up
  while (this.experience >= this.getExperienceForLevel(this.level + 1)) {
    this.level += 1;
    this.maxActivePowers = Math.min(this.maxActivePowers + 1, 10); // Cap at 10 active powers
  }
  
  return {
    leveledUp: this.level > oldLevel,
    oldLevel,
    newLevel: this.level,
    experienceGained: amount
  };
};

// Method to unlock a new power
UserSchema.methods.unlockPower = function(powerId, powerName, description, source) {
  // Check if already unlocked
  const existingPower = this.unlockedPowers.find(p => p.id === powerId);
  if (existingPower) {
    existingPower.level += 1; // Upgrade existing power
    return { upgraded: true, power: existingPower };
  }
  
  // Add new power
  const newPower = {
    id: powerId,
    name: powerName,
    description: description,
    source: source,
    unlockedAt: new Date(),
    level: 1,
    active: this.activePowers.length < this.maxActivePowers
  };
  
  this.unlockedPowers.push(newPower);
  
  if (newPower.active) {
    this.activePowers.push(powerId);
  }
  
  return { unlocked: true, power: newPower };
};

// Method to activate/deactivate powers
UserSchema.methods.setPowerActive = function(powerId, active) {
  const power = this.unlockedPowers.find(p => p.id === powerId);
  if (!power) return { error: 'Power not found' };
  
  if (active && this.activePowers.length >= this.maxActivePowers) {
    return { error: 'Maximum active powers reached' };
  }
  
  power.active = active;
  
  if (active && !this.activePowers.includes(powerId)) {
    this.activePowers.push(powerId);
  } else if (!active) {
    this.activePowers = this.activePowers.filter(id => id !== powerId);
  }
  
  return { success: true, power };
};

// Method to unlock a new area
UserSchema.methods.unlockArea = function(areaId, discoveredBy = 'exploration') {
  // Check if already unlocked
  const existingArea = this.unlockedAreas.find(a => a.areaId === areaId);
  if (existingArea) return { alreadyUnlocked: true };
  
  this.unlockedAreas.push({
    areaId,
    unlockedAt: new Date(),
    discoveredBy
  });
  
  return { unlocked: true, areaId };
};

// Method to complete an artifact
UserSchema.methods.completeArtifact = function(artifactId, score = 0, attempts = 1, timeSpent = 0) {
  // Check if already completed
  const existingCompletion = this.completedArtifacts.find(c => 
    c.artifactId.toString() === artifactId.toString()
  );
  
  if (existingCompletion) {
    // Update if score is better
    if (score > existingCompletion.score) {
      existingCompletion.score = score;
      existingCompletion.completedAt = new Date();
      return { updated: true, completion: existingCompletion };
    }
    return { alreadyCompleted: true };
  }
  
  // Add new completion
  const completion = {
    artifactId,
    completedAt: new Date(),
    score,
    attempts,
    timeSpent
  };
  
  this.completedArtifacts.push(completion);
  
  return { completed: true, completion };
};

// Method to add achievement
UserSchema.methods.addAchievement = function(achievementId, name, description, icon, rarity = 'common', artifactId = null) {
  // Check if already has achievement
  const existing = this.achievements.find(a => a.id === achievementId);
  if (existing) return { alreadyHas: true };
  
  const achievement = {
    id: achievementId,
    name,
    description,
    icon,
    rarity,
    artifactId,
    unlockedAt: new Date()
  };
  
  this.achievements.push(achievement);
  
  // Add achievement points based on rarity
  const points = { common: 10, rare: 25, epic: 50, legendary: 100 };
  this.achievementPoints += points[rarity] || 10;
  
  return { unlocked: true, achievement };
};

// Method to create a collection
UserSchema.methods.createCollection = function(name, description = '', isPublic = false) {
  const collection = {
    name,
    description,
    artifacts: [],
    isPublic,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this.collections.push(collection);
  return collection;
};

// Method to add artifact to collection
UserSchema.methods.addToCollection = function(collectionIndex, artifactId) {
  if (collectionIndex < 0 || collectionIndex >= this.collections.length) {
    return { error: 'Collection not found' };
  }
  
  const collection = this.collections[collectionIndex];
  
  if (!collection.artifacts.includes(artifactId)) {
    collection.artifacts.push(artifactId);
    collection.updatedAt = new Date();
    return { added: true, collection };
  }
  
  return { alreadyInCollection: true };
};

// Method to follow another user
UserSchema.methods.followUser = function(userId) {
  if (this.following.includes(userId)) {
    return { alreadyFollowing: true };
  }
  
  this.following.push(userId);
  return { followed: true };
};

// Method to unfollow a user
UserSchema.methods.unfollowUser = function(userId) {
  const index = this.following.indexOf(userId);
  if (index === -1) {
    return { notFollowing: true };
  }
  
  this.following.splice(index, 1);
  return { unfollowed: true };
};

// Friend system methods

// Send friend request
UserSchema.methods.sendFriendRequest = function(targetUserId) {
  // Check if already friends
  if (this.friends.includes(targetUserId)) {
    return { alreadyFriends: true };
  }
  
  // Check if request already sent
  const existingSent = this.friendRequests.sent.find(req => 
    req.userId.toString() === targetUserId.toString()
  );
  if (existingSent) {
    return { requestAlreadySent: true };
  }
  
  // Check if request already received
  const existingReceived = this.friendRequests.received.find(req => 
    req.userId.toString() === targetUserId.toString()
  );
  if (existingReceived) {
    return { requestAlreadyReceived: true };
  }
  
  // Add to sent requests
  this.friendRequests.sent.push({
    userId: targetUserId,
    sentAt: new Date(),
    status: 'pending'
  });
  
  return { requestSent: true };
};

// Accept friend request
UserSchema.methods.acceptFriendRequest = function(fromUserId) {
  // Find the received request
  const request = this.friendRequests.received.find(req => 
    req.userId.toString() === fromUserId.toString()
  );
  
  if (!request) {
    return { noRequestFound: true };
  }
  
  if (request.status !== 'pending') {
    return { requestAlreadyProcessed: true };
  }
  
  // Update request status
  request.status = 'accepted';
  
  // Add to friends list
  if (!this.friends.includes(fromUserId)) {
    this.friends.push(fromUserId);
  }
  
  return { requestAccepted: true };
};

// Decline friend request
UserSchema.methods.declineFriendRequest = function(fromUserId) {
  // Find the received request
  const request = this.friendRequests.received.find(req => 
    req.userId.toString() === fromUserId.toString()
  );
  
  if (!request) {
    return { noRequestFound: true };
  }
  
  if (request.status !== 'pending') {
    return { requestAlreadyProcessed: true };
  }
  
  // Update request status
  request.status = 'declined';
  
  return { requestDeclined: true };
};

// Remove friend
UserSchema.methods.removeFriend = function(friendUserId) {
  // Remove from friends list
  const friendIndex = this.friends.indexOf(friendUserId);
  if (friendIndex === -1) {
    return { notFriends: true };
  }
  
  this.friends.splice(friendIndex, 1);
  
  // Remove from friend requests
  this.friendRequests.sent = this.friendRequests.sent.filter(req => 
    req.userId.toString() !== friendUserId.toString()
  );
  this.friendRequests.received = this.friendRequests.received.filter(req => 
    req.userId.toString() !== friendUserId.toString()
  );
  
  return { friendRemoved: true };
};

// Get friend status with another user
UserSchema.methods.getFriendStatus = function(otherUserId) {
  // Check if friends
  if (this.friends.includes(otherUserId)) {
    return { status: 'friends' };
  }
  
  // Check if request sent
  const sentRequest = this.friendRequests.sent.find(req => 
    req.userId.toString() === otherUserId.toString()
  );
  if (sentRequest) {
    return { status: 'requestSent', request: sentRequest };
  }
  
  // Check if request received
  const receivedRequest = this.friendRequests.received.find(req => 
    req.userId.toString() === otherUserId.toString()
  );
  if (receivedRequest) {
    return { status: 'requestReceived', request: receivedRequest };
  }
  
  return { status: 'none' };
};

// Method to update creator stats
UserSchema.methods.updateCreatorStats = function() {
  // This would be called when artifacts are created, rated, etc.
  if (!this.creatorStats) {
    this.creatorStats = {
      totalArtifacts: 0,
      totalPlays: 0,
      totalRatings: 0,
      averageRating: 0,
      totalFavorites: 0,
      featuredCount: 0
    };
  }
  
  // Stats would be calculated from artifact data
  // This is a placeholder - actual implementation would aggregate from artifacts
};

// Hash Password Before Saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    // Check if the password is already hashed (starts with $2a$, $2b$, or $2y$ for bcrypt)
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
      console.log('Password appears to already be hashed, skipping hashing');
      return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password Comparison Method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to update last active timestamp
UserSchema.methods.updateActivity = async function() {
  this.lastActive = new Date();
  return this.save();
};

// Method to save game progress
UserSchema.methods.saveGameProgress = async function(progressData) {
  // Update only the fields that are provided
  if (progressData.experience) this.experience = progressData.experience;
  if (progressData.level) this.level = progressData.level;
  if (progressData.position) this.lastPosition = progressData.position;
  if (progressData.inventory) this.inventory = progressData.inventory;
  
  // For nested fields in gameState, use a more careful approach
  if (progressData.gameState) {
    // Initialize gameState if it doesn't exist
    if (!this.gameState) this.gameState = {};
    
    // Update specific gameState fields
    if (progressData.gameState.currentQuest) this.gameState.currentQuest = progressData.gameState.currentQuest;
    if (progressData.gameState.completedQuests) this.gameState.completedQuests = progressData.gameState.completedQuests;
    
    // Text adventure specific progress
    if (progressData.gameState.textAdventureProgress) {
      if (!this.gameState.textAdventureProgress) this.gameState.textAdventureProgress = {};
      
      const taProgress = progressData.gameState.textAdventureProgress;
      if (taProgress.currentRoom) this.gameState.textAdventureProgress.currentRoom = taProgress.currentRoom;
      if (taProgress.inventory) this.gameState.textAdventureProgress.inventory = taProgress.inventory;
      if (taProgress.completedInteractions) this.gameState.textAdventureProgress.completedInteractions = taProgress.completedInteractions;
      if (taProgress.knownPasswords) this.gameState.textAdventureProgress.knownPasswords = taProgress.knownPasswords;
    }
  }
  
  return this.save();
};

// Pre-save middleware to calculate level based on experience
UserSchema.pre('save', function(next) {
  if (this.isModified('experience')) {
    this.level = Math.floor(this.experience / 100) + 1;
  }
  next();
});

// Create indexes for frequently queried fields
// Indexes for performance optimization
UserSchema.index({ 'gameState.currentQuest': 1 });
UserSchema.index({ level: -1 }); // For leaderboards
UserSchema.index({ level: -1, experience: -1 });
UserSchema.index({ 'creatorStats.averageRating': -1, 'creatorStats.totalRatings': -1 });
UserSchema.index({ followers: 1 });
UserSchema.index({ lastActive: -1 });

const User = mongoose.model("User", UserSchema);
export default User;
