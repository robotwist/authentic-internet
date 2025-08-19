import mongoose from 'mongoose';

const CharacterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Character name is required'],
    trim: true,
    minlength: [1, 'Character name must be at least 1 character'],
    maxlength: [20, 'Character name cannot exceed 20 characters']
  },
  
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Character creator is required']
  },
  
  imageUrl: {
    type: String,
    required: [true, 'Character image is required']
  },
  
  pixelData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  canvasSize: {
    type: Number,
    enum: [16, 32, 64],
    default: 32
  },
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  downloads: {
    type: Number,
    default: 0
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CharacterSchema.index({ creator: 1, createdAt: -1 });
CharacterSchema.index({ isPublic: 1, createdAt: -1 });
CharacterSchema.index({ tags: 1 });
CharacterSchema.index({ name: 'text', description: 'text' });

// Virtual for like count
CharacterSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for popularity score
CharacterSchema.virtual('popularityScore').get(function() {
  return this.likes.length + (this.downloads * 2) + (this.views * 0.1);
});

// Method to increment views
CharacterSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment downloads
CharacterSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

// Method to toggle like
CharacterSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.indexOf(userId);
  if (likeIndex === -1) {
    this.likes.push(userId);
  } else {
    this.likes.splice(likeIndex, 1);
  }
  return this.save();
};

// Method to check if user has liked
CharacterSchema.methods.hasLiked = function(userId) {
  return this.likes.includes(userId);
};

// Method to make character public
CharacterSchema.methods.makePublic = function() {
  this.isPublic = true;
  return this.save();
};

// Method to make character private
CharacterSchema.methods.makePrivate = function() {
  this.isPublic = false;
  return this.save();
};

// Static method to get public characters
CharacterSchema.statics.getPublicCharacters = function(options = {}) {
  const { 
    page = 1, 
    limit = 20, 
    sort = 'createdAt', 
    order = 'desc',
    tags = [],
    search = ''
  } = options;

  const query = { isPublic: true, isActive: true };
  
  // Add tag filter
  if (tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  // Add search filter
  if (search) {
    query.$text = { $search: search };
  }

  const sortOption = {};
  sortOption[sort] = order === 'desc' ? -1 : 1;

  return this.find(query)
    .populate('creator', 'username avatar')
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit);
};

// Static method to get user's characters
CharacterSchema.statics.getUserCharacters = function(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  
  return this.find({ creator: userId, isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

// Static method to get trending characters
CharacterSchema.statics.getTrendingCharacters = function(limit = 10) {
  return this.aggregate([
    { $match: { isPublic: true, isActive: true } },
    { $addFields: { 
      popularityScore: { 
        $add: [
          { $size: '$likes' },
          { $multiply: ['$downloads', 2] },
          { $multiply: ['$views', 0.1] }
        ]
      }
    }},
    { $sort: { popularityScore: -1 } },
    { $limit: limit },
    { $lookup: {
      from: 'users',
      localField: 'creator',
      foreignField: '_id',
      as: 'creator'
    }},
    { $unwind: '$creator' },
    { $project: {
      'creator.password': 0,
      'creator.email': 0
    }}
  ]);
};

// Pre-save middleware to validate pixel data
CharacterSchema.pre('save', function(next) {
  // Validate pixel data structure
  if (this.pixelData && typeof this.pixelData === 'object') {
    const pixelCount = Object.keys(this.pixelData).length;
    const expectedPixels = this.canvasSize * this.canvasSize;
    
    if (pixelCount > expectedPixels) {
      return next(new Error('Pixel data exceeds canvas size'));
    }
  }
  
  next();
});

// Pre-save middleware to sanitize tags
CharacterSchema.pre('save', function(next) {
  if (this.tags) {
    // Remove duplicates and empty tags
    this.tags = [...new Set(this.tags.filter(tag => tag.trim().length > 0))];
    
    // Limit to 10 tags
    if (this.tags.length > 10) {
      this.tags = this.tags.slice(0, 10);
    }
  }
  next();
});

const Character = mongoose.model('Character', CharacterSchema);

export default Character;
