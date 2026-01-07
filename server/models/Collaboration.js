import mongoose from 'mongoose';

const CollaborationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  artifactType: {
    type: String,
    required: true,
    enum: ['GAME', 'STORY', 'PUZZLE', 'MUSIC', 'ART', 'EXPERIENCE']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer', 'commenter'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canEdit: { type: Boolean, default: true },
      canComment: { type: Boolean, default: true },
      canInvite: { type: Boolean, default: false },
      canPublish: { type: Boolean, default: false }
    }
  }],
  artifact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artifact'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowEditing: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 50
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    autoSaveInterval: {
      type: Number,
      default: 30000, // 30 seconds
      min: 10000,
      max: 300000
    },
    conflictResolution: {
      type: String,
      enum: ['manual', 'automatic', 'last-writer-wins'],
      default: 'last-writer-wins'
    }
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    type: {
      type: String,
      enum: ['general', 'suggestion', 'question', 'review', 'feedback'],
      default: 'general'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        type: String,
        maxlength: [500, 'Reply cannot exceed 500 characters']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  versionHistory: [{
    version: {
      type: Number,
      required: true
    },
    changes: {
      type: String,
      required: true
    },
    savedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    artifactSnapshot: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastActivityBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'invite-only'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CollaborationSchema.index({ creator: 1, status: 1 });
CollaborationSchema.index({ 'participants.user': 1, status: 1 });
CollaborationSchema.index({ artifactType: 1, status: 1 });
CollaborationSchema.index({ lastActivity: -1 });

// Virtual for participant count
CollaborationSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Virtual for comment count
CollaborationSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for session duration
CollaborationSchema.virtual('sessionDuration').get(function() {
  const endTime = this.completedAt || new Date();
  return endTime - this.createdAt;
});

// Method to add participant
CollaborationSchema.methods.addParticipant = async function(userId, role = 'editor') {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId
  );

  if (existingParticipant) {
    throw new Error('User is already a participant');
  }

  // Check if session is full
  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Collaboration session is full');
  }

  // Add participant
  this.participants.push({
    user: userId,
    role,
    joinedAt: new Date(),
    lastActivity: new Date()
  });

  this.lastActivity = new Date();
  this.lastActivityBy = userId;

  await this.save();
  return this;
};

// Method to remove participant
CollaborationSchema.methods.removeParticipant = async function(userId) {
  // Cannot remove creator
  if (this.creator.toString() === userId) {
    throw new Error('Cannot remove the creator from the session');
  }

  // Remove participant
  this.participants = this.participants.filter(
    p => p.user.toString() !== userId
  );

  this.lastActivity = new Date();
  await this.save();
  return this;
};

// Method to add comment
CollaborationSchema.methods.addComment = async function(userId, content, type = 'general') {
  // Check if user is a participant
  const isParticipant = this.participants.some(
    p => p.user.toString() === userId
  );

  if (!isParticipant && this.creator.toString() !== userId) {
    throw new Error('Must be a participant to add comments');
  }

  // Check if comments are allowed
  if (!this.settings.allowComments) {
    throw new Error('Comments are not allowed in this session');
  }

  const comment = {
    user: userId,
    content,
    type,
    timestamp: new Date()
  };

  this.comments.push(comment);
  this.lastActivity = new Date();
  this.lastActivityBy = userId;

  await this.save();
  return comment;
};

// Method to save version
CollaborationSchema.methods.saveVersion = async function(userId, changes, artifactSnapshot = null) {
  const version = this.versionHistory.length + 1;

  this.versionHistory.push({
    version,
    changes,
    savedBy: userId,
    timestamp: new Date(),
    artifactSnapshot
  });

  this.lastActivity = new Date();
  this.lastActivityBy = userId;

  await this.save();
  return this.versionHistory[this.versionHistory.length - 1];
};

// Method to get participant role
CollaborationSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId
  );

  if (participant) {
    return participant.role;
  }

  if (this.creator.toString() === userId) {
    return 'owner';
  }

  return null;
};

// Method to check permissions
CollaborationSchema.methods.hasPermission = function(userId, permission) {
  const role = this.getParticipantRole(userId);
  
  if (!role) return false;

  if (role === 'owner') return true;

  const participant = this.participants.find(
    p => p.user.toString() === userId
  );

  if (!participant) return false;

  return participant.permissions[permission] || false;
};

// Method to complete session
CollaborationSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
  return this;
};

// Static method to find active collaborations for a user
CollaborationSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    $or: [
      { creator: userId },
      { 'participants.user': userId }
    ],
    status: 'active'
  }).populate('creator', 'username email')
    .populate('participants.user', 'username email')
    .populate('artifact', 'name type status')
    .sort({ lastActivity: -1 });
};

// Pre-save middleware to update lastActivity
CollaborationSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastActivity = new Date();
  }
  next();
});

const Collaboration = mongoose.model('Collaboration', CollaborationSchema);
export default Collaboration; 