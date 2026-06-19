import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth.js';
import WorldInstance from '../models/World.js';
import ChatMessage from '../models/Chat.js';
import User from '../models/User.js';
import NPC from '../models/NPC.js';
import jwt from 'jsonwebtoken';
import { MAPS_STRUCTURE } from '../constants.js';

const router = express.Router();

const MAIN_WORLD_ID = 'main-world';

const getDefaultMapDefinition = (mapType = 'Home') => {
  if (!Array.isArray(MAPS_STRUCTURE) || MAPS_STRUCTURE.length === 0) {
    return { name: mapType, data: [] };
  }

  return (
    MAPS_STRUCTURE.find((map) => map.name === mapType) ||
    MAPS_STRUCTURE[0]
  );
};

const getDefaultSpawnPoints = () => [{ x: 1, y: 1 }];

const serializeWorld = (world) => {
  const data = world?.toObject ? world.toObject() : world;
  const mapDefinition = getDefaultMapDefinition(data?.mapType);

  return {
    ...data,
    worldId: data.worldId || data._id?.toString(),
    isMainWorld: false,
    mapType: data.mapType || mapDefinition.name,
    mapData: data.mapData || mapDefinition.data,
    spawnPoints: data.spawnPoints || getDefaultSpawnPoints(),
    npcs: data.npcs || [],
    games: data.games || [],
    sharedWith: data.sharedWith || [],
    portals: data.portals || [],
    artifacts: data.artifacts || [],
    playerCount: data.activePlayers?.length || 0
  };
};

const serializeMainWorld = () => {
  const mapDefinition = getDefaultMapDefinition('Home');

  return {
    _id: MAIN_WORLD_ID,
    worldId: MAIN_WORLD_ID,
    name: 'Authentic Internet',
    description: 'The shared world where all users can interact and explore together',
    isPublic: true,
    isMainWorld: true,
    mapType: mapDefinition.name,
    mapData: mapDefinition.data,
    spawnPoints: getDefaultSpawnPoints(),
    npcs: [],
    games: [],
    sharedWith: [],
    portals: [],
    artifacts: []
  };
};

const buildWorldLookup = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { worldId: id }] };
  }

  return { worldId: id };
};

const findWorldByRouteId = (id) => WorldInstance.findOne(buildWorldLookup(id));

const userCanManageWorld = (world, userId) => {
  if (!world || !userId) return false;

  const creatorId = world.creator?._id || world.creator;
  const moderatorIds = Array.isArray(world.moderators)
    ? world.moderators.map((moderator) => moderator?._id || moderator)
    : [];

  return (
    creatorId?.toString() === userId ||
    moderatorIds.some((moderatorId) => moderatorId?.toString() === userId)
  );
};

const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return next();
    }

    const user = await User.findById(decoded.userId).select('accountStatus');
    if (user?.accountStatus === 'active') {
      req.user = decoded;
      req.userId = decoded.userId;
      req.userRole = decoded.role || 'user';
    }
  } catch (error) {
    // Public world reads should still work when an optional token is absent,
    // expired, or malformed. Protected writes continue to use the strict auth middleware.
  }

  return next();
};

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
    res.json(serializeMainWorld());
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

    res.json(worlds.map(serializeWorld));
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

    const { name, description, mapType = 'DEFAULT' } = req.body;

    // Check if world name already exists
    const existingWorld = await WorldInstance.findOne({
      name,
      creator: req.user.userId,
      isActive: true
    });
    if (existingWorld) {
      return res.status(400).json({ message: 'You already have a world with this name' });
    }

    const worldId = `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const world = new WorldInstance({
      worldId,
      name,
      description,
      isPublic: false, // Development worlds are private by default
      creator: req.user.userId,
      moderators: [req.user.userId]
    });

    await world.save();
    const serializedWorld = serializeWorld({
      ...world.toObject(),
      mapType,
      mapData: getDefaultMapDefinition(mapType).data
    });

    res.status(201).json({
      ...serializedWorld,
      success: true,
      world: serializedWorld
    });
  } catch (error) {
    console.error('Error creating world:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Expand world map
router.post('/:id/expand', auth, async (req, res) => {
  try {
    res.status(501).json({ message: 'World map expansion is not supported for world instances' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Share world with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    res.status(501).json({ message: 'World sharing is not supported for world instances' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove world sharing with a user
router.delete('/:id/share/:userId', auth, async (req, res) => {
  try {
    res.status(501).json({ message: 'World sharing is not supported for world instances' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a game to the world
router.post('/:id/games', auth, async (req, res) => {
  try {
    res.status(501).json({ message: 'Embedded games are not supported for world instances' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific world
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const world = await findWorldByRouteId(req.params.id)
      .populate('creator', 'username avatar')
      .populate('moderators', 'username avatar');
    
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!world.isPublic && !userCanManageWorld(world, req.user?.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(serializeWorld(world));
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

    const world = await findWorldByRouteId(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!userCanManageWorld(world, req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to update this world' });
    }

    const { name, description, isPublic, maxPlayers, requiresInvite } = req.body;
    if (name) world.name = name;
    if (description) world.description = description;
    if (typeof maxPlayers === 'number') world.maxPlayers = maxPlayers;
    if (typeof requiresInvite === 'boolean') {
      world.requiresInvite = requiresInvite;
    }
    if (typeof isPublic === 'boolean') {
      world.isPublic = isPublic;
    }

    await world.save();
    res.json(serializeWorld(world));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete world
router.delete('/:id', auth, async (req, res) => {
  try {
    const world = await findWorldByRouteId(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!userCanManageWorld(world, req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this world' });
    }

    await world.deleteOne();
    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get NPCs in a world
router.get('/:id/npcs', optionalAuth, async (req, res) => {
  try {
    const world = await findWorldByRouteId(req.params.id);
    if (!world) {
      return res.status(404).json({ message: 'World not found' });
    }

    if (!world.isPublic && !userCanManageWorld(world, req.user?.userId)) {
      return res.status(403).json({ message: 'Access denied' });
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
    return serializeMainWorld();
  } catch (error) {
    console.error('Error ensuring default world exists:', error);
    return null;
  }
};

// Multiplayer-specific routes

// Get world details by worldId
router.get('/instance/:worldId', optionalAuth, async (req, res) => {
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