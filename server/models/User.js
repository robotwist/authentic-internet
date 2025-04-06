import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { PASSWORD_REQUIREMENTS } from "../utils/validation.js";

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
    }
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
// Remove the username and email indexes since they're already defined with unique: true
UserSchema.index({ 'gameState.currentQuest': 1 });
UserSchema.index({ level: -1 }); // For leaderboards

const User = mongoose.model("User", UserSchema);
export default User;
