import mongoose from 'mongoose';

const ArtifactInteractionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['REVEAL', 'UNLOCK', 'COLLECT', 'SOLVE', 'CUSTOM']
  },
  condition: String,
  revealedContent: String,
  action: String
}, { _id: false });

const ReviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

// Unified Artifact Schema
const ArtifactSchema = new mongoose.Schema({
  // Core fields (required)
  id: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Artifact ID is required'
    }
  },
  name: { 
    type: String, 
    required: [true, 'Artifact name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Artifact description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: { 
    type: String, 
    required: [true, 'Artifact type is required'],
    enum: {
      values: [
        'artifact', 'WEAPON', 'SCROLL', 'ART', 'MUSIC', 'GAME', 'PUZZLE', 
        'STORY', 'TOOL', 'TREASURE', 'PORTAL', 'NPC', 'ENVIRONMENT'
      ],
      message: 'Invalid artifact type'
    }
  },
  content: { 
    type: String, 
    required: [true, 'Artifact content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  
  // Media and attachments
  media: {
    type: [String],
    validate: {
      validator: function(v) {
        return !v || v.length <= 10; // Max 10 media files
      },
      message: 'Cannot have more than 10 media files'
    }
  },
  
  // Location and visibility
  location: {
    x: { 
      type: Number, 
      required: [true, 'X coordinate is required'],
      min: [0, 'X coordinate must be non-negative']
    },
    y: { 
      type: Number, 
      required: [true, 'Y coordinate is required'],
      min: [0, 'Y coordinate must be non-negative']
    },
    mapName: {
      type: String,
      default: 'overworld'
    }
  },
  exp: { 
    type: Number, 
    default: 10,
    min: [0, 'Experience points must be non-negative'],
    max: [1000, 'Experience points cannot exceed 1000']
  },
  visible: { 
    type: Boolean, 
    default: true 
  },
  area: { 
    type: String, 
    required: [true, 'Area is required'],
    enum: {
      values: ['overworld', 'desert', 'dungeon', 'yosemite', 'custom'],
      message: 'Invalid area'
    }
  },
  
  // Social and discovery
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return !v || v.length <= 20; // Max 20 tags
      },
      message: 'Cannot have more than 20 tags'
    }
  },
  rating: {
    type: Number,
    min: [0, 'Rating must be non-negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviews: [ReviewSchema],
  remixOf: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Invalid remix artifact ID'
    }
  },
  
  // Creator information
  createdBy: {
    type: String,
    required: [true, 'Creator is required']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Legacy fields (for backward compatibility)
  interactions: [ArtifactInteractionSchema],
  properties: { 
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        return !v || typeof v === 'object';
      },
      message: 'Properties must be an object'
    }
  },
  userModifiable: { 
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function(v) {
        return !v || typeof v === 'object';
      },
      message: 'UserModifiable must be an object'
    }
  },
  
  // Additional legacy fields
  messageText: {
    type: String,
    maxlength: [1000, 'Message text cannot exceed 1000 characters']
  },
  riddle: {
    type: String,
    maxlength: [200, 'Riddle cannot exceed 200 characters']
  },
  unlockAnswer: {
    type: String,
    maxlength: [100, 'Unlock answer cannot exceed 100 characters']
  },
  isExclusive: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['dropped', 'collected', 'hidden', 'locked'],
    default: 'dropped'
  },
  image: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || v.startsWith('/') || v.startsWith('http');
      },
      message: 'Image must be a valid path or URL'
    }
  },
  attachment: {
    type: String
  },
  attachmentType: {
    type: String,
    enum: ['image', 'audio', 'video', 'document']
  },
  attachmentOriginalName: String,
  
  // Social features
  votes: {
    type: Number,
    default: 0,
    min: 0
  },
  voters: [String],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Interactive features
  isInteractive: {
    type: Boolean,
    default: false
  },
  puzzleType: {
    type: String,
    enum: ['riddle', 'textAdventure', 'dialogChallenge', 'terminalPuzzle', 'apiQuiz', 'logicChallenge']
  },
  gameConfig: {
    type: mongoose.Schema.Types.Mixed
  },
  completionRewards: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Portal features
  portalType: {
    type: String,
    enum: ['textAdventure', 'terminal', 'hemingway']
  },
  
  // Theme and dedication
  theme: {
    type: String,
    enum: ['wisdom', 'inspiration', 'nature', 'literature', 'history', 'personal']
  },
  dedication: {
    type: String,
    maxlength: [200, 'Dedication cannot exceed 200 characters']
  },
  significance: {
    type: String,
    maxlength: [500, 'Significance cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to update timestamps
ArtifactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for average rating
ArtifactSchema.virtual('averageRating').get(function() {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / this.reviews.length) * 10) / 10;
});

// Virtual for total reviews
ArtifactSchema.virtual('totalReviews').get(function() {
  return this.reviews ? this.reviews.length : 0;
});

// Index for better query performance
ArtifactSchema.index({ area: 1, type: 1 });
ArtifactSchema.index({ createdBy: 1 });
ArtifactSchema.index({ tags: 1 });
ArtifactSchema.index({ 'location.x': 1, 'location.y': 1 });
ArtifactSchema.index({ createdAt: -1 });
ArtifactSchema.index({ rating: -1 });

// Static method to validate unified artifact data
ArtifactSchema.statics.validateUnifiedArtifact = function(data) {
  const errors = [];
  
  // Check required fields
  if (!data.name) errors.push('Name is required');
  if (!data.description) errors.push('Description is required');
  if (!data.type) errors.push('Type is required');
  if (!data.content) errors.push('Content is required');
  if (!data.location || data.location.x === undefined || data.location.y === undefined) {
    errors.push('Location with x and y coordinates is required');
  }
  if (!data.area) errors.push('Area is required');
  if (!data.createdBy) errors.push('Creator is required');
  
  // Check field lengths
  if (data.name && data.name.length > 100) errors.push('Name cannot exceed 100 characters');
  if (data.description && data.description.length > 500) errors.push('Description cannot exceed 500 characters');
  if (data.content && data.content.length > 5000) errors.push('Content cannot exceed 5000 characters');
  
  // Check media array
  if (data.media && data.media.length > 10) errors.push('Cannot have more than 10 media files');
  
  // Check tags array
  if (data.tags && data.tags.length > 20) errors.push('Cannot have more than 20 tags');
  
  // Check experience points
  if (data.exp !== undefined && (data.exp < 0 || data.exp > 1000)) {
    errors.push('Experience points must be between 0 and 1000');
  }
  
  return errors;
};

// Instance method to convert to unified format
ArtifactSchema.methods.toUnifiedFormat = function() {
  const unified = {
    id: this.id,
    name: this.name,
    description: this.description,
    type: this.type,
    content: this.content,
    media: this.media || [],
    location: this.location,
    exp: this.exp || 0,
    visible: this.visible !== false,
    area: this.area,
    tags: this.tags || [],
    rating: this.averageRating,
    reviews: this.reviews || [],
    remixOf: this.remixOf,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    interactions: this.interactions || [],
    properties: this.properties || {},
    userModifiable: this.userModifiable || {}
  };
  
  // Add legacy fields for backward compatibility
  if (this.messageText) unified.messageText = this.messageText;
  if (this.riddle) unified.riddle = this.riddle;
  if (this.unlockAnswer) unified.unlockAnswer = this.unlockAnswer;
  if (this.isExclusive !== undefined) unified.isExclusive = this.isExclusive;
  if (this.status) unified.status = this.status;
  if (this.image) unified.image = this.image;
  if (this.attachment) unified.attachment = this.attachment;
  if (this.theme) unified.theme = this.theme;
  if (this.dedication) unified.dedication = this.dedication;
  if (this.significance) unified.significance = this.significance;
  
  return unified;
};

export default mongoose.model('Artifact', ArtifactSchema);
