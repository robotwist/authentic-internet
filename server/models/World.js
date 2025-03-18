import mongoose from "mongoose";

const QuestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  rewardExp: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false }
});

const WorldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isMainWorld: {
    type: Boolean,
    default: false
  },
  mapData: {
    type: [[Number]],
    required: true
  },
  mapSize: {
    width: { type: Number, default: 10 },
    height: { type: Number, default: 10 }
  },
  spawnPoints: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }],
  npcs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NPC'
  }],
  portals: [{
    name: String,
    position: {
      x: Number,
      y: Number
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'World'
    }
  }],
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    }
  }],
  games: [{
    name: String,
    description: String,
    type: String,
    config: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  artifacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artifact" }], // Items in this world
  quests: [QuestSchema], // Quests in this world
}, { timestamps: true });

// Update the updatedAt timestamp before saving
WorldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to expand the world map
WorldSchema.methods.expandMap = async function(direction, size) {
  const { width, height } = this.mapSize;
  let newMapData = [...this.mapData];

  switch (direction) {
    case 'north':
      // Add new rows at the top
      for (let i = 0; i < size; i++) {
        newMapData.unshift(Array(width).fill(0));
      }
      this.mapSize.height += size;
      break;
    case 'south':
      // Add new rows at the bottom
      for (let i = 0; i < size; i++) {
        newMapData.push(Array(width).fill(0));
      }
      this.mapSize.height += size;
      break;
    case 'east':
      // Add new columns on the right
      newMapData = newMapData.map(row => [...row, ...Array(size).fill(0)]);
      this.mapSize.width += size;
      break;
    case 'west':
      // Add new columns on the left
      newMapData = newMapData.map(row => [...Array(size).fill(0), ...row]);
      this.mapSize.width += size;
      break;
  }

  this.mapData = newMapData;
  await this.save();
};

// Method to share world with another user
WorldSchema.methods.shareWith = async function(userId, role = 'viewer') {
  if (this.sharedWith.some(share => share.user.toString() === userId)) {
    throw new Error('World is already shared with this user');
  }

  this.sharedWith.push({ user: userId, role });
  await this.save();
};

// Method to remove sharing with a user
WorldSchema.methods.removeShare = async function(userId) {
  this.sharedWith = this.sharedWith.filter(share => share.user.toString() !== userId);
  await this.save();
};

// Method to add a game to the world
WorldSchema.methods.addGame = async function(gameData) {
  this.games.push(gameData);
  await this.save();
};

const World = mongoose.model("World", WorldSchema);
export default World;
