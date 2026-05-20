import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth.js';
import WorldInstance from '../models/World.js';
import ChatMessage from '../models/Chat.js';
import NPC from '../models/NPC.js';
import { MAPS_STRUCTURE } from '../constants.js';

const router = express.Router();
const MAIN_WORLD_ID = 'main-world';

const createWorldId = () => `world_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const serializeDevelopmentWorld = (world) => {
  const data = typeof world.toObject === 'function' ? world.toObject() : world;

  return {
    ...data,
    _id: data._id?.toString?.() || data._id,
    isMainWorld: false,
    games: data.games || [],
    npcs: data.npcs || [],
    artifacts: data.artifacts || [],
  };
};

const findWorldInstanceById = (id) => (
  mongoose.Types.ObjectId.isValid(id)
    ? WorldInstance.findById(id)
    : WorldInstance.findOne({ worldId: id })
);

// Validation middleware
const validateWorld = [
  body('name').trim().isLength({ min: 3 }).escape(),
  body('description').trim().isLength({ min: 10 }).escape(),
  body('isPublic').optional().isBoolean(),
  body('isMainWorld').optional().isBoolean(),
  body('mapType').optional().isString()
];

// Get all public worlds
router.get('/', async (req, res) => {
  try {
    const worlds = await WorldInstance.find({ 
      isPublic: true, 
      isActive: true 
    })
    .populate('creator', 'username avatar')
    .sort({ 'stats.lastActivity': -1 })
    .limit(20);

    res.json({
      success: true,
      worlds: worlds.map(world => ({
        worldId: world.worldId,
        name: world.name,
        description: world.description,
        creator: world.creator,
        playerCount: world.activePlayers.length,
        maxPlayers: world.maxPlayers,
        stats: world.stats,
        createdAt: world.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching worlds:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get main world
router.get('/main', async (req, res) => {
  try {
    const mainMap = MAPS_STRUCTURE[0] || {};

    res.json({
      _id: MAIN_WORLD_ID,
      worldId: MAIN_WORLD_ID,
      name: 'Authentic Internet',
      description: 'The shared world where all users can interact and explore together',
      isPublic: true,
      isMainWorld: true,
      mapType: mainMap.name || 'Home',
      mapData: mainMap.data || [],
      spawnPoints: [{ x: 4, y: 4 }],
      artifacts: [],
      npcs: [],
      games: []
    });
  } catch (error) {
    console.error('Error fetching main world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's development worlds
router.get('/my-worlds', auth, async (req, res) => {
  try {
    const worlds = await WorldInstance.find({
      creator: req.user.userId,
      isActive: true
    })
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(worlds.map(serializeDevelopmentWorld));
  } catch (error) {
    console.error('Error fetching my-worlds:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new development world
router.post('/', auth, validateWorld, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if world name already exists
    const existingWorld = await WorldInstance.findOne({ name, creator: req.user.userId });
    if (existingWorld) {
      return res.status(400).json({ message: 'You already have a world with this name' });
    }

    const world = new WorldInstance({
      worldId: createWorldId(),
      name,
      description,
      isPublic: false,
      creator: req.user.userId,
      moderators: [req.user.userId]
    });

    await world.save();
    await world.populate('creator', 'username avatar');

    res.status(201).json({
      world: serializeDevelopmentWorld(world)
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Expand world map
router.post('/:id/expand', auth, async (req, res) => {
  try {
    const { direction, size } = req.body;
    const world = await findWorldInstanceById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to expand this world' });
    }

    if (typeof world.expandMap !== 'function') {
      return res.status(400).json({ message: 'Map expansion is not supported for this world' });
    }

    await world.expandMap(direction, size);
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share world with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const world = await findWorldInstanceById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to share this world' });
    }

    if (typeof world.shareWith !== 'function') {
      return res.status(400).json({ message: 'World sharing is not supported for this world' });
    }

    await world.shareWith(userId, role);
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove world sharing with a user
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    const world = await findWorldInstanceById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to modify sharing settings' });
    }

    if (typeof world.removeShare !== 'function') {
      return res.status(400).json({ message: 'World sharing is not supported for this world' });
    }

    await world.removeShare(req.params.userId);
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a game to the world
router.post('/:id/games', auth, async (req, res) => {
  try {
    const { name, description, type, config } = req.body;
    const world = await findWorldInstanceById(req.params.id);

    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to add games to this world' });
    }

    if (typeof world.addGame !== 'function') {
      return res.status(400).json({ message: 'Games are not supported for this world' });
    }

    await world.addGame({ name, description, type, config });
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific world
router.get('/:id', async (req, res) => {
  try {
    const world = await findWorldInstanceById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');
    
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    const creatorId = world.creator?._id?.toString?.() || world.creator?.toString?.();
    if (!world.isPublic && creatorId !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(serializeDevelopmentWorld(world));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update world
router.put('/:id', auth, validateWorld, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const world = await findWorldInstanceById(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this world' });
    }

    const { name, description, isPublic } = req.body;
    world.name = name;
    world.description = description;
    if (typeof isPublic === 'boolean') {
      world.isPublic = isPublic;
    }

    await world.save();
    res.json(world);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete world
router.delete('/:id', auth, async (req, res) => {
  try {
    const world = await findWorldInstanceById(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (world.creator.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this world' });
    }

    await world.deleteOne();
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get NPCs in a world
router.get('/:id/npcs', async (req, res) => {
  try {
    const world = await findWorldInstanceById(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }
    
    const npcs = await NPC.find({ world: req.params.id });
    
    return res.json(npcs);
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    return res.status(500).json({ message: 'Error fetching NPCs' });
  }
});

// Create system default world if none exists
export const ensureDefaultWorldExists = async () => {
  try {
    return await WorldInstance.findOne({ worldId: MAIN_WORLD_ID });
  } catch (error) {
    console.error('Error ensuring default world exists:', error);
    return null;
  }
};

// Multiplayer-specific routes

// Get world details by worldId
router.get('/instance/:worldId', async (req, res) => {
  try {
    const { worldId } = req.params;
    
    const world = await WorldInstance.findOne({ worldId })
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');

    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    // Don't send sensitive data to non-moderators
    const isModerator = req.user && world.moderators.some(mod => 
      mod._id.toString() === req.user.userId
    );

    const worldData = {
      worldId: world.worldId,
      name: world.name,
      description: world.description,
      creator: world.creator,
      playerCount: world.activePlayers.length,
      maxPlayers: world.maxPlayers,
      settings: world.settings,
      stats: world.stats,
      createdAt: world.createdAt,
      isPublic: world.isPublic,
      requiresInvite: world.requiresInvite
    };

    if (isModerator) {
      worldData.activePlayers = world.activePlayers;
      worldData.moderators = world.moderators;
    }

    res.json({ success: true, world: worldData });
  } catch (error) {
    console.error('Error fetching world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new multiplayer world
router.post('/instance', auth, async (req, res) => {
  try {
    const { name, description, maxPlayers = 50, isPublic = true, requiresInvite = false } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'World name is required' });
    }

    // Generate unique world ID
    const worldId = `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const world = new WorldInstance({
      worldId,
      name,
      description,
      creator: req.user.userId,
      maxPlayers,
      isPublic,
      requiresInvite,
      moderators: [req.user.userId]
    });

    await world.save();

    res.json({
      success: true,
      world: {
        worldId: world.worldId,
        name: world.name,
        description: world.description,
        creator: req.user.userId,
        maxPlayers: world.maxPlayers,
        isPublic: world.isPublic,
        requiresInvite: world.requiresInvite
      }
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get world chat history
router.get('/instance/:worldId/chat', async (req, res) => {
  try {
    const { worldId } = req.params;
    const { limit = 50 } = req.query;

    const messages = await ChatMessage.find({
      messageType: 'world',
      'world.worldId': worldId,
      'status.isDeleted': false
    })
    .populate('sender.userId', 'username avatar level')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get online players in world
router.get('/instance/:worldId/players', async (req, res) => {
  try {
    const { worldId } = req.params;

    const world = await WorldInstance.findOne({ worldId });
    if (!world) {
      return res.status(404).json({ success: false, message: 'World not found' });
    }

    const onlinePlayers = world.getOnlinePlayers();

    res.json({
      success: true,
      players: onlinePlayers
    });
  } catch (error) {
    console.error('Error fetching online players:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 